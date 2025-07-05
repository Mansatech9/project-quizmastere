'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, Users, Play, Trash2, Calendar, LogOut, User, BarChart3, Clock, Trophy, TrendingUp, Eye, Settings, Download, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  createdAt: string;
  category?: string;
  difficulty?: string;
  totalPlays?: number;
  averageScore?: number;
}

interface QuizStats {
  totalQuizzes: number;
  totalParticipants: number;
  averageScore: number;
  totalSessions: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 0,
    totalParticipants: 0,
    averageScore: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchQuizzes();
      fetchStats();
    }
  }, [status, router]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz/list');
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now - you can implement actual stats API
      setStats({
        totalQuizzes: quizzes.length,
        totalParticipants: Math.floor(Math.random() * 1000) + 500,
        averageScore: Math.floor(Math.random() * 30) + 70,
        totalSessions: Math.floor(Math.random() * 100) + 50
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(quizzes.filter(quiz => quiz._id !== id));
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const recentQuizzes = quizzes.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-purple-900">QuizMaster AI</h1>
                  <p className="text-sm text-gray-600">Welcome back, {session?.user?.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/create-quiz">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export Data</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Quizzes</p>
                      <p className="text-3xl font-bold">{quizzes.length}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Participants</p>
                      <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Average Score</p>
                      <p className="text-3xl font-bold">{stats.averageScore}%</p>
                    </div>
                    <Trophy className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Active Sessions</p>
                      <p className="text-3xl font-bold">{stats.totalSessions}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentQuizzes.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No quizzes yet</p>
                      <Link href="/create-quiz">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Quiz
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentQuizzes.map((quiz) => (
                        <div key={quiz._id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-purple-900">{quiz.title}</h4>
                            <p className="text-sm text-gray-600">{quiz.questions.length} questions</p>
                          </div>
                          <Link href={`/host/${quiz._id}`}>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                              <Play className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Quiz Completion Rate</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Student Engagement</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Response Time</span>
                      <span>15s</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Quizzes</h2>
              <Link href="/create-quiz">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Quiz
                </Button>
              </Link>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-24 w-24 text-purple-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No quizzes yet</h3>
                <p className="text-gray-600 mb-8">Create your first AI-powered quiz to get started!</p>
                <Link href="/create-quiz">
                  <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <Card key={quiz._id} className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-xl transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-purple-900 text-lg group-hover:text-purple-600 transition-colors">
                            {quiz.title}
                          </CardTitle>
                          <CardDescription className="mt-1">{quiz.description}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Quiz
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteQuiz(quiz._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {quiz.questions.length} questions
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Link href={`/host/${quiz._id}`}>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                          <Play className="mr-2 h-4 w-4" />
                          Host Quiz
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Analytics Dashboard</CardTitle>
                <CardDescription>
                  Detailed insights into your quiz performance and student engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-24 w-24 text-purple-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analytics Coming Soon</h3>
                  <p className="text-gray-600 mb-8">
                    Get detailed insights into student performance, question difficulty analysis, 
                    and engagement metrics.
                  </p>
                  <Badge className="bg-purple-100 text-purple-700">
                    Feature in Development
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and quiz settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-24 w-24 text-purple-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Settings Panel Coming Soon</h3>
                  <p className="text-gray-600 mb-8">
                    Customize your quiz defaults, notification preferences, and account settings.
                  </p>
                  <Badge className="bg-purple-100 text-purple-700">
                    Feature in Development
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}