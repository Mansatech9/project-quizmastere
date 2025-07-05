import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import Session from '@/lib/models/Session';
import Quiz from '@/lib/models/Quiz';
import connectDB from '@/lib/mongodb';

interface SocketServer extends NetServer {
  io?: ServerIO;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO');
    
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', async ({ roomId, playerName, isHost }) => {
        try {
          await connectDB();
          
          const session = await Session.findOne({ roomId });
          if (!session) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          socket.join(roomId);

          if (isHost) {
            socket.emit('host-joined', { 
              roomId, 
              participantCount: session.participants.length 
            });
          } else {
            // Add participant to session
            session.participants.push({
              name: playerName,
              socketId: socket.id,
              joinedAt: new Date(),
              answers: []
            });
            await session.save();

            socket.emit('participant-joined', { 
              roomId, 
              playerName,
              currentQuestion: session.currentQuestion 
            });

            // Notify host about new participant
            socket.to(roomId).emit('participant-update', {
              participants: session.participants.map(p => ({ 
                name: p.name, 
                id: p.socketId 
              }))
            });
          }
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('start-quiz', async ({ roomId, settings }) => {
        try {
          await connectDB();
          
          const session = await Session.findOne({ roomId }).populate('quizId');
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          session.status = 'active';
          session.currentQuestion = 0;
          if (settings) {
            session.settings = settings;
          }
          await session.save();

          const quiz = session.quizId as any;
          const firstQuestion = quiz.questions[0];

          io.to(roomId).emit('quiz-started', {
            question: firstQuestion.question,
            options: firstQuestion.options,
            questionIndex: 0,
            totalQuestions: quiz.questions.length,
            timeLimit: settings?.questionTimeLimit || 30
          });
        } catch (error) {
          console.error('Error starting quiz:', error);
          socket.emit('error', { message: 'Failed to start quiz' });
        }
      });

      socket.on('next-question', async ({ roomId }) => {
        try {
          await connectDB();
          
          const session = await Session.findOne({ roomId }).populate('quizId');
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          const quiz = session.quizId as any;
          const nextIndex = session.currentQuestion + 1;

          if (nextIndex >= quiz.questions.length) {
            // Quiz completed - calculate scores and update quiz status
            session.status = 'completed';
            session.endedAt = new Date();
            
            // Calculate participant scores
            const participantsWithScores = session.participants.map(p => {
              const correctAnswers = p.answers.filter(a => 
                quiz.questions[a.questionIndex].correctAnswer === a.selectedAnswer
              ).length;
              const score = Math.round((correctAnswers / quiz.questions.length) * 100);
              
              // Update participant score and mark answers as correct/incorrect
              p.score = score;
              p.answers = p.answers.map(a => ({
                ...a,
                isCorrect: quiz.questions[a.questionIndex].correctAnswer === a.selectedAnswer
              }));

              return {
                name: p.name,
                id: p.socketId,
                score,
                correctAnswers,
                totalQuestions: quiz.questions.length,
                answers: p.answers.map(a => ({
                  ...a,
                  isCorrect: quiz.questions[a.questionIndex].correctAnswer === a.selectedAnswer,
                  timeSpent: a.timeSpent || 0
                }))
              };
            });

            // Update session results
            session.results = {
              totalParticipants: session.participants.length,
              averageScore: participantsWithScores.length > 0 
                ? Math.round(participantsWithScores.reduce((sum, p) => sum + p.score, 0) / participantsWithScores.length)
                : 0,
              completionRate: 100 // All participants who reached the end completed
            };

            await session.save();

            // Update quiz statistics
            await Quiz.findByIdAndUpdate(quiz._id, {
              status: 'completed',
              $inc: { 
                totalSessions: 1,
                totalParticipants: session.participants.length
              },
              lastHosted: new Date(),
              averageScore: session.results.averageScore
            });

            io.to(roomId).emit('quiz-completed', {
              results: participantsWithScores
            });
            return;
          }

          session.currentQuestion = nextIndex;
          await session.save();

          const question = quiz.questions[nextIndex];
          
          io.to(roomId).emit('new-question', {
            question: question.question,
            options: question.options,
            questionIndex: nextIndex,
            totalQuestions: quiz.questions.length,
            timeLimit: session.settings?.questionTimeLimit || 30
          });
        } catch (error) {
          console.error('Error sending next question:', error);
          socket.emit('error', { message: 'Failed to send next question' });
        }
      });

      socket.on('submit-answer', async ({ roomId, questionIndex, selectedAnswer, timeSpent }) => {
        try {
          await connectDB();
          
          const session = await Session.findOne({ roomId });
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          const participant = session.participants.find(p => p.socketId === socket.id);
          if (!participant) {
            socket.emit('error', { message: 'Participant not found' });
            return;
          }

          // Check if already answered this question
          const existingAnswer = participant.answers.find(a => a.questionIndex === questionIndex);
          if (existingAnswer) {
            socket.emit('error', { message: 'Already answered this question' });
            return;
          }

          participant.answers.push({
            questionIndex,
            selectedAnswer,
            answeredAt: new Date(),
            timeSpent: timeSpent || 0
          });

          await session.save();

          socket.emit('answer-submitted', { questionIndex, selectedAnswer });

          // Send updated results to host
          const answerCounts = [0, 0, 0, 0];
          session.participants.forEach(p => {
            const answer = p.answers.find(a => a.questionIndex === questionIndex);
            if (answer) {
              answerCounts[answer.selectedAnswer]++;
            }
          });

          socket.to(roomId).emit('answer-update', {
            questionIndex,
            answerCounts,
            totalParticipants: session.participants.length
          });
        } catch (error) {
          console.error('Error submitting answer:', error);
          socket.emit('error', { message: 'Failed to submit answer' });
        }
      });

      socket.on('reveal-answer', async ({ roomId, questionIndex }) => {
        try {
          await connectDB();
          
          const session = await Session.findOne({ roomId }).populate('quizId');
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          const quiz = session.quizId as any;
          const correctAnswer = quiz.questions[questionIndex].correctAnswer;

          io.to(roomId).emit('answer-revealed', {
            questionIndex,
            correctAnswer,
            explanation: quiz.questions[questionIndex].explanation || null
          });
        } catch (error) {
          console.error('Error revealing answer:', error);
          socket.emit('error', { message: 'Failed to reveal answer' });
        }
      });

      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        
        try {
          await connectDB();
          
          // Remove participant from any active sessions
          const sessions = await Session.find({ 
            status: { $in: ['waiting', 'active'] },
            'participants.socketId': socket.id 
          });

          for (const session of sessions) {
            session.participants = session.participants.filter(p => p.socketId !== socket.id);
            await session.save();

            // Notify remaining participants
            socket.to(session.roomId).emit('participant-update', {
              participants: session.participants.map(p => ({ 
                name: p.name, 
                id: p.socketId 
              }))
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}