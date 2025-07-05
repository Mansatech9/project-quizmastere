import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import Quiz from '@/lib/models/Quiz';
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

  try {
    await connectDB();

    if (req.method === 'GET') {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      res.status(200).json({ quiz });
    } else if (req.method === 'DELETE') {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const quiz = await Quiz.findOneAndDelete({ 
        _id: id, 
        hostUserId: session.user.id 
      });
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      res.status(200).json({ message: 'Quiz deleted successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling quiz request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}