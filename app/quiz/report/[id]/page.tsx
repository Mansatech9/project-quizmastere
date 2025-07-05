'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Share2, BarChart3, Users, Trophy, Clock, Target, TrendingUp, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

interface QuizReport {
  quiz: {
    title: string;
    description: string;
    questions: any[];
    totalQuestions: number;
    createdAt: string;
    status: string;
  };
  summary: {
    totalSessions: number;
    totalParticipants: number;
    averageScore: number;
    averageCompletionRate: number;
  };
  sessions: any[];
  questionAnalysis: any[];
}

export default function QuizReport() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [report, setReport] = useState<QuizReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/quiz/report/${params.id}`);
        const data = await res.json();
        setReport(data.report);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id, session, router]);

  const exportReport = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${report.quiz.title.replace(/\s+/g, '_')}_report.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Report not found</h2>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-purple-900">{report.quiz.title}</h1>
                <p className="text-sm text-gray-600">Quiz Report & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Sessions</p>
                      <p className="text-3xl font-bold">{report.summary.totalSessions}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Participants</p>
                      <p className="text-3xl font-bold">{report.summary.totalParticipants}</p>
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
                      <p className="text-3xl font-bold">{report.summary.averageScore}%</p>
                    </div>
                    <Trophy className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Completion Rate</p>
                      <p className="text-3xl font-bold">{report.summary.averageCompletionRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Quiz Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Description</h4>
                      <p className="text-gray-600">{report.quiz.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Total Questions</h4>
                      <p className="text-gray-600">{report.quiz.totalQuestions}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Created</h4>
                      <p className="text-gray-600">{new Date(report.quiz.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Status</h4>
                      <Badge className={report.quiz.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {report.quiz.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Score Across All Sessions</span>
                      <span>{report.summary.averageScore}%</span>
                    </div>
                    <Progress value={report.summary.averageScore} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Completion Rate</span>
                      <span>{report.summary.averageCompletionRate}%</span>
                    </div>
                    <Progress value={report.summary.averageCompletionRate} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Participant Engagement</span>
                      <span>{Math.min(Math.round((report.summary.totalParticipants / Math.max(report.summary.totalSessions, 1)) * 10), 100)}%</span>
                    </div>
                    <Progress value={Math.min(Math.round((report.summary.totalParticipants / Math.max(report.summary.totalSessions, 1)) * 10), 100)} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Session History</CardTitle>
                <CardDescription>
                  Detailed breakdown of all quiz sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <p className="text-gray-600">No sessions found for this quiz</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {report.sessions.map((session, index) => (
                      <div key={session.sessionId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Session #{index + 1}</h4>
                            <p className="text-sm text-gray-600">Room: {session.roomId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">{session.duration} minutes</p>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-lg font-bold text-blue-600">{session.participants.length}</div>
                            <div className="text-sm text-gray-600">Participants</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-lg font-bold text-green-600">
                              {session.participants.length > 0 
                                ? Math.round(session.participants.reduce((sum: number, p: any) => sum + p.score, 0) / session.participants.length)
                                : 0}%
                            </div>
                            <div className="text-sm text-gray-600">Avg Score</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="text-lg font-bold text-purple-600">
                              {session.results?.completionRate || 0}%
                            </div>
                            <div className="text-sm text-gray-600">Completion</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Question Analysis</CardTitle>
                <CardDescription>
                  Performance breakdown for each question
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {report.questionAnalysis.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                        <p className="text-gray-700">{question.question}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{question.accuracy}%</div>
                          <div className="text-sm text-gray-600">Accuracy</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{question.totalResponses}</div>
                          <div className="text-sm text-gray-600">Responses</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-600">{question.averageTimeSpent}s</div>
                          <div className="text-sm text-gray-600">Avg Time</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-lg font-bold text-purple-600">
                            {question.accuracy >= 80 ? 'Easy' : question.accuracy >= 60 ? 'Medium' : 'Hard'}
                          </div>
                          <div className="text-sm text-gray-600">Difficulty</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium">Answer Distribution:</h5>
                        {question.options.map((option: string, optionIndex: number) => (
                          <div key={optionIndex} className="flex items-center space-x-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              optionIndex === question.correctAnswer 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1">{option}</span>
                            <span className="text-sm text-gray-600">
                              {question.optionDistribution[optionIndex]} votes
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  optionIndex === question.correctAnswer ? 'bg-green-500' : 'bg-purple-500'
                                }`}
                                style={{ 
                                  width: question.totalResponses > 0 
                                    ? `${(question.optionDistribution[optionIndex] / question.totalResponses) * 100}%` 
                                    : '0%'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Participant Performance</CardTitle>
                <CardDescription>
                  Individual participant results across all sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <p className="text-gray-600">No participant data available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {report.sessions.map((session, sessionIndex) => (
                      <div key={session.sessionId}>
                        <h4 className="font-semibold mb-4">Session #{sessionIndex + 1} - {new Date(session.date).toLocaleDateString()}</h4>
                        <div className="space-y-3">
                          {session.participants.map((participant: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-600">
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="font-medium">{participant.name}</span>
                                  <p className="text-sm text-gray-600">
                                    Joined: {new Date(participant.joinedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="font-semibold">{participant.score}%</div>
                                  <div className="text-sm text-gray-600">
                                    {participant.answers?.filter((a: any) => a.isCorrect).length || 0}/{report.quiz.totalQuestions}
                                  </div>
                                </div>
                                <Progress value={participant.score} className="w-20" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}