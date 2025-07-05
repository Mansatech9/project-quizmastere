import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { generateQuiz } from '@/lib/gemini';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { topic, difficulty, questionCount, questionType, title, description } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    await connectDB();

    // Generate questions using Gemini
    const questions = await generateQuiz(topic, difficulty, questionCount, questionType);

    // Save quiz to database
    const quiz = new Quiz({
      title: title || `${topic} Quiz`,
      description: description || `A ${difficulty} level quiz about ${topic} with ${questionCount} ${questionType === 'mcq' ? 'multiple choice' : questionType === 'true-false' ? 'true/false' : 'mixed'} questions.`,
      questions,
      hostUserId: session.user.id,
    });

    await quiz.save();

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
}