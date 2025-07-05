import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import Quiz from '@/lib/models/Quiz';
import Session from '@/lib/models/Session';
import connectDB from '@/lib/mongodb';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();

    // Get quiz
    const quiz = await Quiz.findOne({ 
      _id: id, 
      hostUserId: session.user.id 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Get all sessions for this quiz
    const sessions = await Session.find({ 
      quizId: id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Compile comprehensive report
    const report = {
      quiz: {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        totalQuestions: quiz.questions.length,
        createdAt: quiz.createdAt,
        status: quiz.status
      },
      summary: {
        totalSessions: sessions.length,
        totalParticipants: sessions.reduce((sum, s) => sum + s.participants.length, 0),
        averageScore: sessions.length > 0 
          ? Math.round(sessions.reduce((sum, s) => sum + (s.results?.averageScore || 0), 0) / sessions.length)
          : 0,
        averageCompletionRate: sessions.length > 0
          ? Math.round(sessions.reduce((sum, s) => sum + (s.results?.completionRate || 0), 0) / sessions.length)
          : 0
      },
      sessions: sessions.map(s => ({
        sessionId: s._id,
        roomId: s.roomId,
        date: s.createdAt,
        duration: s.endedAt ? Math.round((s.endedAt.getTime() - s.createdAt.getTime()) / 1000 / 60) : 0,
        participants: s.participants.map(p => ({
          name: p.name,
          score: p.score,
          answers: p.answers,
          joinedAt: p.joinedAt
        })),
        results: s.results
      })),
      questionAnalysis: quiz.questions.map((question, index) => {
        const allAnswers = sessions.flatMap(s => 
          s.participants.map(p => p.answers.find(a => a.questionIndex === index))
        ).filter(Boolean);

        const correctAnswers = allAnswers.filter(a => a.isCorrect).length;
        const totalAnswers = allAnswers.length;
        
        const optionCounts = question.options.map((_, optionIndex) => 
          allAnswers.filter(a => a.selectedAnswer === optionIndex).length
        );

        return {
          questionIndex: index,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
          totalResponses: totalAnswers,
          optionDistribution: optionCounts,
          averageTimeSpent: totalAnswers > 0 
            ? Math.round(allAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAnswers)
            : 0
        };
      })
    };

    res.status(200).json({ report });
  } catch (error) {
    console.error('Error generating quiz report:', error);
    res.status(500).json({ message: 'Failed to generate quiz report' });
  }
}