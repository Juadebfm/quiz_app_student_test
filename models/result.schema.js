import mongoose from "mongoose";
const { Schema } = mongoose;

const resultSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
  },
  quizType: {
    type: String,
    required: true,
    enum: ["random", "all", "filtered"],
  },
  answers: [
    {
      question: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: [true, "Question reference is required"],
      },
      selectedAnswer: {
        type: Number,
        required: [true, "Selected answer is required"],
        min: 0,
        max: 3,
      },
      isCorrect: {
        type: Boolean,
        required: [true, "Correctness of answer is required"],
      },
    },
  ],
  score: {
    type: Number,
    required: [true, "Score is required"],
    min: [0, "Score cannot be negative"],
  },
  totalQuestions: {
    type: Number,
    required: [true, "Total number of questions is required"],
    min: [1, "There must be at least one question"],
  },
  percentageScore: {
    type: Number,
    required: [true, "Percentage score is required"],
    min: 0,
    max: 100,
  },
  timeTaken: {
    type: Number,
    required: [true, "Time taken is required"],
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

resultSchema.index({ user: 1, quiz: 1, createdAt: -1 });

export default mongoose.model("Result", resultSchema);
