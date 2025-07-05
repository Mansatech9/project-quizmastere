'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Play, SkipForward, Trophy, Copy, QrCode, ArrowLeft, Clock, Eye, EyeOff, Settings, BarChart3, Pause, Square } from 'lucide-react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

interface Participant {
  name: string;
  id: string;
  score?: number;
  answers?: Array<{
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

export default function HostQuiz() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [answerCounts, setAnswerCounts] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Enhanced timer state
  const [questionTimeLimit, setQuestionTimeLimit] = useState(30);
  const [showAnswers, setShowAnswers] = useState(true);
  const [autoRevealAnswers, setAutoRevealAnswers] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Timer refs for proper cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session) return;

    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz/${params.id}`);
        const data = await res.json();
        setQuiz(data.quiz);
        
        // Create session
        const sessionRes = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: params.id }),
        });
        const sessionData = await sessionRes.json();
        setRoomId(sessionData.roomId);
        
        // Generate QR code
        const joinUrl = `${window.location.origin}/join/${sessionData.roomId}`;
        const qrCodeUrl = await QRCode.toDataURL(joinUrl);
        setQrCode(qrCodeUrl);
        
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id, session]);

  useEffect(() => {
    if (!roomId) return;

    const newSocket = io(process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000', {
      path: '/api/socketio',
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId, isHost: true });
    });

    newSocket.on('participant-update', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('answer-update', (data) => {
      setAnswerCounts(data.answerCounts);
    });

    newSocket.on('quiz-completed', (data) => {
      setQuizCompleted(true);
      setShowResults(true);
      stopTimer(); // Stop timer when quiz completes
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  // Enhanced timer effect with proper cleanup
  useEffect(() => {
    if (timerActive && !timerPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            if (autoRevealAnswers && !quizCompleted) {
              nextQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerActive, timerPaused, timeRemaining, autoRevealAnswers, quizCompleted]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const stopTimer = () => {
    setTimerActive(false);
    setTimerPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseTimer = () => {
    setTimerPaused(!timerPaused);
  };

  const startQuiz = () => {
    if (socket && roomId) {
      socket.emit('start-quiz', { 
        roomId, 
        settings: {
          questionTimeLimit,
          autoRevealAnswers,
          showAnswers
        }
      });
      setQuizStarted(true);
      setCurrentQuestion(0);
      setAnswerCounts([0, 0, 0, 0]);
      setTimeRemaining(questionTimeLimit);
      setTimerActive(true);
      setTimerPaused(false);
    }
  };

  const nextQuestion = () => {
    if (socket && roomId) {
      stopTimer(); // Stop current timer
      
      if (currentQuestion + 1 >= (quiz?.questions.length || 0)) {
        // Quiz completed
        socket.emit('next-question', { roomId });
        setQuizCompleted(true);
        setShowResults(true);
        return;
      }

      socket.emit('next-question', { roomId });
      setCurrentQuestion(currentQuestion + 1);
      setAnswerCounts([0, 0, 0, 0]);
      setTimeRemaining(questionTimeLimit);
      setTimerActive(true);
      setTimerPaused(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
  };

  const toggleAnswerReveal = () => {
    setShowAnswers(!showAnswers);
  };

  const generateReport = () => {
    // Generate detailed participant report
    const report = participants.map(participant => ({
      name: participant.name,
      score: participant.score || 0,
      answers: participant.answers || [],
      accuracy: participant.answers ? 
        (participant.answers.filter(a => a.isCorrect).length / participant.answers.length * 100).toFixed(1) : 0,
      averageTime: participant.answers ? 
        (participant.answers.reduce((sum, a) => sum + a.timeSpent, 0) / participant.answers.length).toFixed(1) : 0
    }));
    
    console.log('Detailed Report:', report);
    // You can implement actual report generation/download here
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz not found</h2>
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
                <h1 className="text-2xl font-bold text-purple-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">Host View</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Room: {roomId}
              </Badge>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-purple-600 font-semibold">{participants.length}</span>
              </div>
              {timerActive && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  timeRemaining <= 10 ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <Clock className={`h-4 w-4 ${timeRemaining <= 10 ? 'text-red-600' : 'text-orange-600'}`} />
                  <span className={`font-semibold ${timeRemaining <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                    {timeRemaining}s
                  </span>
                  {quizStarted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={pauseTimer}
                      className="h-6 w-6 p-0"
                    >
                      {timerPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              )}
              {quizStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopTimer}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!quizStarted ? (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Quiz Settings</CardTitle>
                  <CardDescription>
                    Configure your quiz settings before starting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quiz Settings */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Question Time Limit (seconds)</Label>
                      <Select value={questionTimeLimit.toString()} onValueChange={(value) => setQuestionTimeLimit(parseInt(value))}>
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

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="autoReveal"
                          checked={autoRevealAnswers}
                          onCheckedChange={setAutoRevealAnswers}
                        />
                        <Label htmlFor="autoReveal">Auto-reveal answers after time</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showAnswers"
                          checked={showAnswers}
                          onCheckedChange={setShowAnswers}
                        />
                        <Label htmlFor="showAnswers">Show correct answers during quiz</Label>
                      </div>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="text-center space-y-6 pt-6 border-t">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Room Code:</p>
                      <div className="flex items-center justify-center space-x-2">
                        <Badge variant="outline" className="text-3xl px-6 py-3 border-purple-300">
                          {roomId}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={copyRoomCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {qrCode && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">QR Code:</p>
                        <div className="flex justify-center">
                          <img src={qrCode} alt="QR Code" className="border rounded-lg" />
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={startQuiz}
                      disabled={participants.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                      size="lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : showResults ? (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <Trophy className="h-6 w-6 mr-2" />
                    Quiz Results
                  </CardTitle>
                  <CardDescription>
                    Final results and participant performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{participants.length}</div>
                        <div className="text-sm text-gray-600">Participants</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {participants.length > 0 ? 
                            Math.round(participants.reduce((sum, p) => sum + (p.score || 0), 0) / participants.length) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                        <div className="text-sm text-gray-600">Questions</div>
                      </div>
                    </div>

                    {/* Participant Results */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Participant Results</h4>
                      {participants.map((participant, index) => (
                        <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-600">
                              {index + 1}
                            </div>
                            <span className="font-medium">{participant.name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              {participant.score || 0}% ({Math.round((participant.score || 0) * quiz.questions.length / 100)}/{quiz.questions.length})
                            </span>
                            <Progress value={participant.score || 0} className="w-20" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-4">
                      <Button onClick={generateReport} className="bg-green-600 hover:bg-green-700 text-white">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Generate Report
                      </Button>
                      <Link href="/dashboard">
                        <Button variant="outline">
                          Back to Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-purple-900">
                      Question {currentQuestion + 1} of {quiz.questions.length}
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">
                        {participants.length} participants
                      </Badge>
                      {timerActive && (
                        <div className="flex items-center space-x-2">
                          <Clock className={`h-4 w-4 ${timeRemaining <= 10 ? 'text-red-600' : 'text-orange-600'}`} />
                          <span className={`font-semibold ${timeRemaining <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                            {timeRemaining}s
                          </span>
                          {timerPaused && <Badge variant="outline" className="text-yellow-600">Paused</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(currentQuestion + 1) / quiz.questions.length * 100} 
                    className="h-2"
                  />
                </CardHeader>
                <CardContent>
                  {currentQuestion < quiz.questions.length && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {quiz.questions[currentQuestion].question}
                      </h3>
                      
                      <div className="space-y-3">
                        {quiz.questions[currentQuestion].options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                showAnswers && index === quiz.questions[currentQuestion].correctAnswer
                                  ? 'bg-green-100 border-2 border-green-300'
                                  : 'bg-gray-50'
                              }`}>
                                <span className="font-medium flex items-center">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                    showAnswers && index === quiz.questions[currentQuestion].correctAnswer
                                      ? 'bg-green-500 text-white'
                                      : 'bg-purple-100 text-purple-600'
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  {option}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {answerCounts[index] || 0} votes
                                  </span>
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: participants.length > 0 
                                          ? `${((answerCounts[index] || 0) / participants.length) * 100}%` 
                                          : '0%'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={toggleAnswerReveal}
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          {showAnswers ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                          {showAnswers ? 'Hide' : 'Show'} Answer
                        </Button>
                        
                        <Button
                          onClick={nextQuestion}
                          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                        >
                          {currentQuestion === quiz.questions.length - 1 ? (
                            <>
                              <Trophy className="mr-2 h-4 w-4" />
                              Finish Quiz
                            </>
                          ) : (
                            <>
                              <SkipForward className="mr-2 h-4 w-4" />
                              Next Question
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No participants yet</p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">{participant.name}</span>
                        </div>
                        {participant.score !== undefined && (
                          <span className="text-xs text-purple-600 font-semibold">
                            {participant.score}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Quiz Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Questions:</span>
                  <span className="text-sm font-medium">{quiz.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Room Code:</span>
                  <span className="text-sm font-medium">{roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time Limit:</span>
                  <span className="text-sm font-medium">{questionTimeLimit}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={quizStarted ? "default" : "secondary"}>
                    {quizCompleted ? "Completed" : quizStarted ? "Active" : "Waiting"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}