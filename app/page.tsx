'use client';

import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Users, Zap, Trophy, ArrowRight, Clock, BarChart3, Shield, Sparkles, CheckCircle, Star, Globe, Smartphone, Palette } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: "AI-Powered Question Generation",
    description: "Generate unlimited quiz questions using advanced AI. Just describe your topic and let our AI create engaging, educational content.",
    color: "from-purple-500 to-violet-600"
  },
  {
    icon: Zap,
    title: "Real-time Interactive Sessions",
    description: "Host live quiz sessions with instant feedback. Watch participants join and see results update in real-time with beautiful animations.",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: Clock,
    title: "Timed Questions & Auto-progression",
    description: "Set custom time limits for each question. Automatic progression keeps the quiz flowing smoothly with countdown timers.",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics & Reports",
    description: "Get detailed insights with student-wise performance reports, question analytics, and comprehensive quiz statistics.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Users,
    title: "Seamless Collaboration",
    description: "Anyone can join with a simple room code or QR scan. No accounts needed for participants - just enter and play.",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: Shield,
    title: "Answer Reveal Controls",
    description: "Choose when to reveal correct answers. Full control over answer disclosure timing for optimal learning experience.",
    color: "from-indigo-500 to-purple-600"
  }
];

const stats = [
  { number: "10K+", label: "Quizzes Created" },
  { number: "50K+", label: "Students Engaged" },
  { number: "95%", label: "Satisfaction Rate" },
  { number: "24/7", label: "Available" }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "High School Teacher",
    content: "QuizMaster AI has transformed my classroom engagement. Students love the interactive format!",
    rating: 5
  },
  {
    name: "Dr. Michael Chen",
    role: "University Professor",
    content: "The AI-generated questions are surprisingly sophisticated. Perfect for my advanced courses.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Corporate Trainer",
    content: "Real-time analytics help me understand exactly where my team needs more support.",
    rating: 5
  }
];

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
     

      {/* Navigation */}
      <nav className="relative z-10 p-6 bg-white/80 backdrop-blur-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Brain className="h-10 w-10 text-purple-600" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                QuizMaster AI
              </h1>
              <p className="text-xs text-gray-500">Powered by Advanced AI</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => signIn('google')} 
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
              >
                Get Started Free
              </Button>
            )}
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by Gemini AI
            </Badge>
            <h2 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              Interactive Quizzes
              <br />
              <span className="text-5xl md:text-6xl">Reimagined</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create engaging quizzes in seconds with AI, host interactive sessions with real-time analytics, 
              and transform learning with beautiful, responsive design. The future of education is here.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-lg px-8 py-4 shadow-xl">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => signIn('google')} 
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-lg px-8 py-4 shadow-xl"
                >
                  Start Creating Quizzes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 text-lg px-8 py-4"
                >
                  Watch Demo
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, host, and analyze interactive quizzes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group h-full">
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 group-hover:text-purple-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-32"
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Loved by Educators</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what teachers and trainers are saying about QuizMaster AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">{testimonial.content}</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-32 text-center"
        >
          <Card className="border-0 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
            <CardContent className="p-12">
              <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Teaching?</h3>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of educators who are already using QuizMaster AI to create engaging, 
                interactive learning experiences.
              </p>
              {!session && (
                <Button 
                  size="lg" 
                  onClick={() => signIn('google')} 
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl"
                >
                  Get Started Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-16 mt-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-purple-400" />
                <span className="text-xl font-bold">QuizMaster AI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing education with AI-powered interactive quizzes.
              </p>
              <div className="flex space-x-4">
                <Globe className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                <Smartphone className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                <Palette className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AI Question Generation</li>
                <li>Real-time Analytics</li>
                <li>Timed Quizzes</li>
                <li>Answer Controls</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Use Cases</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Education</li>
                <li>Corporate Training</li>
                <li>Assessment</li>
                <li>Team Building</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2024 QuizMaster AI. Powered by cutting-edge AI technology.</p>
          </div>
        </div>
      </footer>
      
    </div>
  );
}