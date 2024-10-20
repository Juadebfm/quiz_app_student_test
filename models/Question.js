const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true }, // Index of the correct answer
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Admin who created the question
  topic: { type: String, required: true }, // Topic of the question
});

module.exports = mongoose.model("Question", questionSchema);
