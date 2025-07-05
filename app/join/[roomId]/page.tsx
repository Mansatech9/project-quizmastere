'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Question {
  question: string;
  options: string[];
  questionIndex: number;
  totalQuestions: number;
}

export default function JoinQuiz() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io(process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000', {
      path: '/api/socketio',
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('participant-joined', (data) => {
      setJoined(true);
      if (data.currentQuestion >= 0) {
        // Quiz already started, wait for current question
      }
    });

    newSocket.on('quiz-started', (data) => {
      setCurrentQuestion(data);
      setHasAnswered(false);
      setSelectedAnswer(null);
    });

    newSocket.on('new-question', (data) => {
      setCurrentQuestion(data);
      setHasAnswered(false);
      setSelectedAnswer(null);
    });

    newSocket.on('answer-submitted', (data) => {
      setHasAnswered(true);
    });

    newSocket.on('quiz-completed', (data) => {
      setQuizCompleted(true);
      setCurrentQuestion(null);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinQuiz = () => {
    if (socket && playerName.trim()) {
      socket.emit('join-room', { 
        roomId, 
        playerName: playerName.trim(), 
        isHost: false 
      });
    }
  };

  const submitAnswer = (answerIndex: number) => {
    if (socket && currentQuestion && !hasAnswered) {
      setSelectedAnswer(answerIndex);
      socket.emit('submit-answer', {
        roomId,
        questionIndex: currentQuestion.questionIndex,
        selectedAnswer: answerIndex
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {!joined ? (
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 text-center">Join Quiz</CardTitle>
              <CardDescription className="text-center">
                Enter your name to join room <Badge variant="outline">{roomId}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="border-purple-200 focus:border-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && joinQuiz()}
                  />
                </div>
                <Button
                  onClick={joinQuiz}
                  disabled={!playerName.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : quizCompleted ? (
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 text-center">Quiz Completed!</CardTitle>
              <CardDescription className="text-center">
                Thank you for participating, {playerName}!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-600">
                The quiz has ended. Check with the host for results!
              </p>
            </CardContent>
          </Card>
        ) : !currentQuestion ? (
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 text-center">Welcome, {playerName}!</CardTitle>
              <CardDescription className="text-center">
                Waiting for the host to start the quiz...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="animate-pulse">
                <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Get ready to answer some questions!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-purple-900">
                  Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}
                </CardTitle>
                <Badge variant="outline">
                  {playerName}
                </Badge>
              </div>
              <Progress 
                value={(currentQuestion.questionIndex + 1) / currentQuestion.totalQuestions * 100} 
                className="h-2"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentQuestion.question}
                </h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`w-full p-4 text-left justify-start h-auto ${
                        selectedAnswer === index 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                      onClick={() => submitAnswer(index)}
                      disabled={hasAnswered}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedAnswer === index 
                            ? 'bg-white text-purple-600' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                        {selectedAnswer === index && (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                
                {hasAnswered && (
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Answer submitted!</p>
                    <p className="text-green-600 text-sm">Waiting for next question...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}