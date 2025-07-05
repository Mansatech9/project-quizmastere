'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Chrome } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-purple-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-purple-600" />
          </div>
          <CardTitle className="text-2xl text-purple-900">Welcome to QuizMaster AI</CardTitle>
          <CardDescription>
            Sign in to create and host interactive quizzes powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}