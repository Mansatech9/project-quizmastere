import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  socketId: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number, required: true },
    answeredAt: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 }
  }]
});

const SessionSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  hostUserId: { type: String, required: true },
  participants: [ParticipantSchema],
  currentQuestion: { type: Number, default: -1 },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  settings: {
    questionTimeLimit: { type: Number, default: 30 },
    autoRevealAnswers: { type: Boolean, default: true },
    showAnswers: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);