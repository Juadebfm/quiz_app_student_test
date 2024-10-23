const mongoose = require("mongoose");

const QuizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Add user details section
    userDetails: {
      username: String,
      email: String,
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add index for better query performance
QuizResultSchema.index({ userId: 1 });
QuizResultSchema.index({ "userDetails.email": 1 });

module.exports = mongoose.model("QuizResult", QuizResultSchema);
