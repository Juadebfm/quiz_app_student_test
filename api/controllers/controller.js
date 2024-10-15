import Questions from "../models/question.schema.js";
import { questionSchema } from "../utils/validation.js";
import { formatResponse } from "../utils/responseFormatter.js";

export async function insertQuestions(req, res) {
  try {
    // Validate the question data with Joi schema
    const { error } = questionSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(false, "Validation error", error.details));
    }

    const { question, answers, correctAnswerIndex, course, topic } = req.body;

    // Check if a similar question already exists
    const existingQuestion = await Questions.findOne({ question: question });
    if (existingQuestion) {
      return res
        .status(409)
        .json(formatResponse(false, "A similar question already exists"));
    }

    // Create a new question document
    const newQuestion = new Questions({
      question,
      answers,
      correctAnswerIndex,
      course,
      topic,
    });

    // Save the question to the database
    await newQuestion.save();

    // Return success response
    return res
      .status(201)
      .json(formatResponse(true, "Question added successfully", newQuestion));
  } catch (error) {
    console.error("Error in insertQuestions:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}
