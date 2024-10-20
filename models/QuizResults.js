const mongoose = require("mongoose");

const QuizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  attempts: [
    {
      answers: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
          },
          userAnswer: Number,
          correctAnswer: Number,
          isCorrect: Boolean,
        },
      ],
      score: Number,
      totalQuestions: Number,
      percentageScore: Number,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("QuizResult", QuizResultSchema);
