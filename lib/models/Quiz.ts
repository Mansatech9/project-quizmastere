import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'true-false'], default: 'mcq' }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  questions: [QuestionSchema],
  hostUserId: { type: String, required: true },
  status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
  totalSessions: { type: Number, default: 0 },
  totalParticipants: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  lastHosted: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);