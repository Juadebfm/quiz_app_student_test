const mongoose = require("mongoose");

const ReviewSessionSchema = new mongoose.Schema(
  {
    scores: {
      type: Map,
      of: Number,
    },
    notes: {
      type: Map,
      of: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    quizResults: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizResult",
      },
    ],
    reviewSessions: [ReviewSessionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserStats", UserStatsSchema);
