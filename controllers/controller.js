import Question from "../models/question.schema.js";
import { questionSchema } from "../utils/validation.js";
import { formatResponse } from "../utils/responseFormatter.js";
import mongoose from "mongoose";
import User from "../models/user.schema.js";
import Result from "../models/result.schema.js";

// Add A Question
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
    const existingQuestion = await Question.findOne({ question: question });
    if (existingQuestion) {
      return res
        .status(409)
        .json(formatResponse(false, "A similar question already exists"));
    }

    // Create a new question document
    const newQuestion = new Question({
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

// Edit Questions
export async function editQuestion(req, res) {
  try {
    const questionId = req.params.id;

    // Validate the new question data
    const { error } = questionSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(formatResponse(false, "Validation error", error.details));
    }

    const { question, answers, correctAnswerIndex, course, topic } = req.body;

    // Find the question by ID
    const existingQuestion = await Question.findById(questionId);
    if (!existingQuestion) {
      return res.status(404).json(formatResponse(false, "Question not found"));
    }

    // Update the question with new data
    existingQuestion.question = question;
    existingQuestion.answers = answers;
    existingQuestion.correctAnswerIndex = correctAnswerIndex;
    existingQuestion.course = course;
    existingQuestion.topic = topic;

    // Save the updated question to the database
    const updatedQuestion = await existingQuestion.save();

    // Return success response
    return res
      .status(200)
      .json(
        formatResponse(true, "Question updated successfully", updatedQuestion)
      );
  } catch (error) {
    console.error("Error in editQuestion:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Get All Questions
export async function getAllQuestions(req, res) {
  try {
    // Fetch all questions from the database
    const questions = await Question.find();

    // Get the total count of questions in the database
    const totalQuestions = await Question.countDocuments();

    // If no questions are found, return a 404 response
    if (!questions || questions.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, "No questions found", null));
    }

    // Return the questions and the total count
    return res.status(200).json(
      formatResponse(true, "Questions fetched successfully", {
        totalQuestions,
        questions,
      })
    );
  } catch (error) {
    console.error("Error in getAllQuestions:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Get Random 35 Questions for a student
export async function getRandomQuestions(req, res) {
  try {
    const randomQuestions = await Question.aggregate([
      { $sample: { size: 35 } },
    ]);

    // If no questions are found, return a 404 response
    if (!randomQuestions || randomQuestions.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, "No questions found", null));
    }

    // Return the random questions
    return res.status(200).json(
      formatResponse(true, "Random questions fetched successfully", {
        totalQuestions: randomQuestions.length,
        questions: randomQuestions,
      })
    );
  } catch (error) {
    console.error("Error in getRandomQuestions:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Get Questions by Course or Topic
export async function getQuestionsByCourseOrTopic(req, res) {
  try {
    const { course, topic } = req.query;

    let query = {};

    // Build query based on the course or topic, if provided
    if (course) {
      query.course = new RegExp(course, "i");
    }
    if (topic) {
      query.topic = new RegExp(topic, "i");
    }

    // Fetch questions from the database based on the query
    const questions = await Question.find(query);

    // If no questions are found, return a 404 response
    if (!questions || questions.length === 0) {
      return res
        .status(404)
        .json(
          formatResponse(
            false,
            "No questions found for the given criteria",
            null
          )
        );
    }

    // Return the questions
    return res.status(200).json(
      formatResponse(true, "Questions fetched successfully", {
        totalQuestions: questions.length,
        questions: questions,
      })
    );
  } catch (error) {
    console.error("Error in getQuestionsByCourseOrTopic:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Delete a Question (Only Admin)
export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;

    // Find and delete the question by its ID
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res
        .status(404)
        .json(formatResponse(false, "Question not found", null));
    }

    // Return success response
    return res
      .status(200)
      .json(formatResponse(true, "Question deleted successfully", null));
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Save Results
export async function saveResults(req, res) {
  console.log("Received request body:", JSON.stringify(req.body, null, 2));
  try {
    const { user, answers, timeTaken, quizType, course, topic } = req.body;

    // Log parsed data
    console.log("Parsed data:", {
      user,
      answers: answers.length,
      timeTaken,
      quizType,
      course,
      topic,
    });

    // Validate input
    if (
      !user ||
      !Array.isArray(answers) ||
      timeTaken === undefined ||
      !quizType
    ) {
      return res.status(400).json(formatResponse(false, "Invalid input data"));
    }

    // Check if user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    // Determine expected number of questions
    let expectedQuestions;
    if (quizType === "random") {
      expectedQuestions = 35;
    } else if (quizType === "all") {
      expectedQuestions = await Question.countDocuments();
    } else if (quizType === "filtered") {
      const filter = {};
      if (course) filter.course = course;
      if (topic) filter.topic = topic;

      if (Object.keys(filter).length === 0) {
        return res
          .status(400)
          .json(
            formatResponse(
              false,
              "At least one filter (course or topic) is required for filtered quiz type"
            )
          );
      }

      expectedQuestions = await Question.countDocuments(filter);
    } else {
      return res.status(400).json(formatResponse(false, "Invalid quiz type"));
    }

    // Check if all questions are answered
    if (answers.length !== expectedQuestions) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            `You must answer all ${expectedQuestions} questions before submitting.`
          )
        );
    }

    // Check if user has already attempted this quiz
    const existingResult = await Result.findOne({
      user: user,
      quizType: quizType,
    });
    if (existingResult && !userExists.isAllowedRetake) {
      return res
        .status(403)
        .json(
          formatResponse(
            false,
            "You have already attempted this quiz and are not allowed to retake it."
          )
        );
    }

    // Fetch all questions answered by the user
    const questionIds = answers.map((answer) => answer.question);
    const questions = await Question.find({ _id: { $in: questionIds } });

    // Check if all questions were found
    if (questions.length !== questionIds.length) {
      return res
        .status(404)
        .json(formatResponse(false, "One or more questions not found"));
    }

    // Calculate score and create answer objects
    let score = 0;
    const processedAnswers = answers.map((answer) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.question
      );
      const isCorrect = question.correctAnswerIndex === answer.selectedAnswer;
      if (isCorrect) score++;
      return {
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: isCorrect,
      };
    });

    const totalQuestions = answers.length;
    const percentageScore = (score / totalQuestions) * 100;

    // Prepare result data
    const resultData = {
      user,
      quizType,
      answers: processedAnswers,
      score,
      totalQuestions,
      percentageScore,
      timeTaken,
    };
    if (course) resultData.course = course;
    if (topic) resultData.topic = topic;

    // Update existing result or create new one
    let result;
    if (existingResult) {
      Object.assign(existingResult, resultData);
      result = await existingResult.save();
    } else {
      result = await Result.create(resultData);
    }

    return res
      .status(201)
      .json(formatResponse(true, "Result saved successfully", result));
  } catch (error) {
    console.error("Error in saveResults:", error);
    return res.status(500).json(
      formatResponse(false, "An error occurred while saving the results", {
        errorMessage: error.message,
        stack: error.stack,
      })
    );
  }
}

// Get All Results
export async function getAllResults(req, res) {
  try {
    // Fetch all results from the database
    const results = await Result.find().populate("user", "username email");

    // Get the total count of results in the database
    const totalResults = await Result.countDocuments();

    // If no results are found, return a 404 response
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, "No results found", null));
    }

    // Return the results and the total count
    return res.status(200).json(
      formatResponse(true, "Results fetched successfully", {
        totalResults,
        results,
      })
    );
  } catch (error) {
    console.error("Error in getAllResults:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Get Results by Student
export async function getResultsByStudent(req, res) {
  try {
    const { studentId } = req.params;

    // Check if user exists
    const userExists = await User.findById(studentId);
    if (!userExists) {
      return res.status(404).json(formatResponse(false, "Student not found"));
    }

    // Fetch results for the specific student
    const results = await Result.find({ user: studentId }).populate(
      "user",
      "username email"
    );

    // If no results are found, return a 404 response
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json(formatResponse(false, "No results found for this student", null));
    }

    // Return the results
    return res.status(200).json(
      formatResponse(true, "Results fetched successfully", {
        totalResults: results.length,
        results,
      })
    );
  } catch (error) {
    console.error("Error in getResultsByStudent:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}

// Clear Entire Database (Only Admin)
export async function clearDatabase(req, res) {
  try {
    // Clear all collections
    await Question.deleteMany({});
    await User.deleteMany({});
    await Result.deleteMany({});

    // Return success response
    return res
      .status(200)
      .json(formatResponse(true, "Database cleared successfully", null));
  } catch (error) {
    console.error("Error in clearDatabase:", error);
    return res.status(500).json(formatResponse(false, "Server error", error));
  }
}
