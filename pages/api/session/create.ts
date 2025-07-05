import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
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

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { quizId } = req.body;
    
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    await connectDB();

    const roomId = generateRoomId();

    const quizSession = new Session({
      roomId,
      quizId,
      hostUserId: session.user.id,
      participants: [],
      currentQuestion: -1,
      status: 'waiting'
    });

    await quizSession.save();

    res.status(200).json({ 
      roomId,
      sessionId: quizSession._id 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
}