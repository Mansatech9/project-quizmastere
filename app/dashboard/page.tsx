'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Brain, Users, Play, Trash2, Calendar, LogOut, User, BarChart3, Clock, Trophy, TrendingUp, Eye, Settings, Download, Share2, FileText, Target, Zap, Activity } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  createdAt: string;
  status: 'draft' | 'completed';
  category?: string;
  difficulty?: string;
  totalSessions?: number;
  totalParticipants?: number;
  averageScore?: number;
  lastHosted?: string;
}

interface DashboardStats {
  totalQuizzes: number;
  completedQuizzes: number;
  totalParticipants: number;
  totalSessions: number;
  averageScore: number;
  activeSessions: number;
}

interface RecentActivity {
  _id: string;
  roomId: string;
  endedAt: string;
  participants: any[];
  quizId: {
    title: string;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    totalParticipants: 0,
    totalSessions: 0,
    averageScore: 0,
    activeSessions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userSettings, setUserSettings] = useState({
    emailNotifications: true,
    autoSaveQuizzes: true,
    defaultQuestionTime: 30,
    defaultDifficulty: 'intermediate'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch quizzes
      const quizzesRes = await fetch('/api/quiz/list');
      const quizzesData = await quizzesRes.json();
      setQuizzes(quizzesData.quizzes || []);

      // Fetch dashboard stats
      const statsRes = await fetch('/api/dashboard/stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats || {});
      setRecentActivity(statsData.recentActivity || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(quizzes.filter(quiz => quiz._id !== id));
        fetchDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const completedQuizzes = filteredQuizzes.filter(quiz => quiz.status === 'completed');
  const draftQuizzes = filteredQuizzes.filter(quiz => quiz.status === 'draft');

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
                  <DropdownMenuItem onClick={() => setActiveTab('settings')}>
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
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Quizzes</p>
                        <p className="text-3xl font-bold">{stats.totalQuizzes}</p>
                        <p className="text-purple-200 text-xs mt-1">
                          {stats.completedQuizzes} completed
                        </p>
                      </div>
                      <Brain className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Participants</p>
                        <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                        <p className="text-blue-200 text-xs mt-1">
                          Across {stats.totalSessions} sessions
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Average Score</p>
                        <p className="text-3xl font-bold">{stats.averageScore}%</p>
                        <p className="text-green-200 text-xs mt-1">
                          {stats.activeSessions} active sessions
                        </p>
                      </div>
                      <Trophy className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No recent activity</p>
                      <Link href="/create-quiz">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Quiz
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity._id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-purple-900">{activity.quizId.title}</h4>
                            <p className="text-sm text-gray-600">
                              {activity.participants.length} participants • {new Date(activity.endedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-purple-600">
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/create-quiz">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Quiz
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Quizzes</h2>
                <p className="text-gray-600">Manage and host your quiz collection</p>
              </div>
              <Link href="/create-quiz">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Quiz
                </Button>
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 border-purple-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-24 w-24 text-purple-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No quizzes found</h3>
                <p className="text-gray-600 mb-8">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first AI-powered quiz to get started!'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Link href="/create-quiz">
                    <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Quiz
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Draft Quizzes */}
                {draftQuizzes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-orange-500" />
                      Draft Quizzes ({draftQuizzes.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {draftQuizzes.map((quiz) => (
                        <Card key={quiz._id} className="bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300 group">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-orange-900 text-lg group-hover:text-orange-600 transition-colors">
                                  {quiz.title}
                                </CardTitle>
                                <CardDescription className="mt-1">{quiz.description}</CardDescription>
                                <Badge className="mt-2 bg-orange-100 text-orange-700 border-orange-200">
                                  Draft
                                </Badge>
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
                              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                                <Play className="mr-2 h-4 w-4" />
                                Host Quiz
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Quizzes */}
                {completedQuizzes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-green-500" />
                      Completed Quizzes ({completedQuizzes.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedQuizzes.map((quiz) => (
                        <Card key={quiz._id} className="bg-white/80 backdrop-blur-sm border-green-200 hover:shadow-xl transition-all duration-300 group">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-green-900 text-lg group-hover:text-green-600 transition-colors">
                                  {quiz.title}
                                </CardTitle>
                                <CardDescription className="mt-1">{quiz.description}</CardDescription>
                                <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                                  Completed
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Report
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Data
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share Results
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
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {quiz.questions.length} questions
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {quiz.lastHosted ? new Date(quiz.lastHosted).toLocaleDateString() : 'Never hosted'}
                                </div>
                              </div>
                              
                              {quiz.totalSessions && quiz.totalSessions > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <div className="flex justify-between text-sm">
                                    <span>Sessions: {quiz.totalSessions}</span>
                                    <span>Participants: {quiz.totalParticipants}</span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span>Avg Score: {quiz.averageScore}%</span>
                                  </div>
                                </div>
                              )}
                              
                              <Link href={`/quiz/report/${quiz._id}`}>
                                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Report
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Analytics Dashboard</CardTitle>
                <CardDescription>
                  Comprehensive insights into your quiz performance and student engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalQuizzes}</div>
                    <div className="text-sm text-gray-600">Total Quizzes</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                    <div className="text-sm text-gray-600">Quiz Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.totalParticipants}</div>
                    <div className="text-sm text-gray-600">Total Participants</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.averageScore}%</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Quiz Completion Rate</span>
                          <span>{Math.round((stats.completedQuizzes / Math.max(stats.totalQuizzes, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(stats.completedQuizzes / Math.max(stats.totalQuizzes, 1)) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Student Engagement</span>
                          <span>{stats.totalParticipants > 0 ? Math.round((stats.totalParticipants / stats.totalSessions) * 10) : 0}%</span>
                        </div>
                        <Progress value={stats.totalParticipants > 0 ? Math.min((stats.totalParticipants / stats.totalSessions) * 10, 100) : 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Average Score</span>
                          <span>{stats.averageScore}%</span>
                        </div>
                        <Progress value={stats.averageScore} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {recentActivity.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>
                      <div className="space-y-3">
                        {recentActivity.slice(0, 5).map((activity) => (
                          <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{activity.quizId.title}</div>
                              <div className="text-sm text-gray-600">
                                {activity.participants.length} participants • {new Date(activity.endedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge variant="outline">
                              Completed
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and quiz defaults
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-600">Receive email updates about your quizzes</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={userSettings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-save">Auto-save Quizzes</Label>
                        <p className="text-sm text-gray-600">Automatically save quiz drafts</p>
                      </div>
                      <Switch
                        id="auto-save"
                        checked={userSettings.autoSaveQuizzes}
                        onCheckedChange={(checked) => 
                          setUserSettings(prev => ({ ...prev, autoSaveQuizzes: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quiz Defaults</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-time">Default Question Time (seconds)</Label>
                      <Select 
                        value={userSettings.defaultQuestionTime.toString()} 
                        onValueChange={(value) => 
                          setUserSettings(prev => ({ ...prev, defaultQuestionTime: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time limit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="45">45 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-difficulty">Default Difficulty</Label>
                      <Select 
                        value={userSettings.defaultDifficulty} 
                        onValueChange={(value) => 
                          setUserSettings(prev => ({ ...prev, defaultDifficulty: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={session?.user?.name || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={session?.user?.email || ''} disabled />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}