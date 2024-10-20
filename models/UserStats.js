const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserStats", UserStatsSchema);
