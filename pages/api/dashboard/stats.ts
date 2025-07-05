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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();

    // Get user's quizzes
    const quizzes = await Quiz.find({ hostUserId: session.user.id });
    const quizIds = quizzes.map(q => q._id);

    // Get sessions for user's quizzes
    const sessions = await Session.find({ 
      quizId: { $in: quizIds },
      status: 'completed'
    });

    // Calculate stats
    const totalQuizzes = quizzes.length;
    const completedQuizzes = quizzes.filter(q => q.status === 'completed').length;
    
    const totalParticipants = sessions.reduce((sum, session) => 
      sum + session.participants.length, 0
    );
    
    const totalSessions = sessions.length;
    
    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.results?.averageScore || 0), 0) / sessions.length
      : 0;

    // Recent activity
    const recentSessions = await Session.find({ 
      quizId: { $in: quizIds },
      status: 'completed'
    })
    .populate('quizId', 'title')
    .sort({ endedAt: -1 })
    .limit(5);

    // Performance metrics
    const performanceData = sessions.map(session => ({
      date: session.endedAt,
      participants: session.participants.length,
      averageScore: session.results?.averageScore || 0,
      completionRate: session.results?.completionRate || 0
    }));

    res.status(200).json({
      stats: {
        totalQuizzes,
        completedQuizzes,
        totalParticipants,
        totalSessions,
        averageScore: Math.round(averageScore),
        activeSessions: await Session.countDocuments({ 
          quizId: { $in: quizIds }, 
          status: 'active' 
        })
      },
      recentActivity: recentSessions,
      performanceData
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}