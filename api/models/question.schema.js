import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema({
  question: {
    type: String,
    required: [true, "Question is required"],
    trim: true,
  },
  answers: {
    type: [String],
    required: [true, "Answers are required"],
    validate: [
      {
        validator: (val) => val.length === 4,
        message: "Must have exactly 4 answers",
      },
      {
        validator: (val) => val.every((answer) => answer.trim().length > 0),
        message: "All answers must be non-empty strings",
      },
    ],
  },
  correctAnswerIndex: {
    type: Number,
    required: [true, "Correct answer index is required"],
    min: [0, "Correct answer index must be between 0 and 3"],
    max: [3, "Correct answer index must be between 0 and 3"],
  },
  course: {
    type: String,
    required: [true, "Course is required"],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, "Topic is required"],
    trim: true,
  },
  createdAt: { type: Date, default: Date.now },
});

questionSchema.index({ course: 1, topic: 1 });

export default mongoose.model("Question", questionSchema);
