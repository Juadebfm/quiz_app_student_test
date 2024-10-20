const Question = require("../models/Question");
const { questionValidation } = require("../validation/questionValidation");
const {
  quizSubmissionValidation,
} = require("../validation/questionValidation");
const QuizResult = require("../models/QuizResults");
const UserStats = require("../models/UserStats");

// Add Questions
exports.addQuestion = async (req, res) => {
  // Validate the data
  const { error } = questionValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { topic, questionText, options, correctAnswerIndex } = req.body;

    // Check if the question already exists
    const existingQuestion = await Question.findOne({ questionText, options });

    if (existingQuestion) {
      return res.status(400).json({ message: "This question already exists." });
    }

    // Ensure correctAnswerIndex is within bounds
    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return res.status(400).json({ message: "Invalid correctAnswerIndex" });
    }

    // Save the correct answer using the index provided
    const correctAnswer = options[correctAnswerIndex];

    const newQuestion = new Question({
      topic,
      questionText: questionText,
      options,
      correctAnswerIndex,
      createdBy: req.userId, // Tracking who created the question
    });

    const savedQuestion = await newQuestion.save();

    // Return both the message, saved question, and the correct answer value
    res.status(201).json({
      message: "Question added successfully",
      question: {
        ...savedQuestion.toObject(),
        correctAnswer, // Add the correct answer value
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit Questions
exports.editQuestion = async (req, res) => {
  // Validate the data
  const { error } = questionValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { questionId } = req.params; // Get the question ID from the URL
    const { topic, question, options, correctAnswerIndex } = req.body;

    // Ensure correctAnswerIndex is within bounds
    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return res.status(400).json({ message: "Invalid correctAnswerIndex" });
    }

    // Find the question by ID and update it
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        topic,
        questionText: question,
        options,
        correctAnswerIndex,
        createdBy: req.userId, // Track who is editing the question
      },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Return the updated question along with a success message
    res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Questions
exports.getQuestions = async (req, res) => {
  try {
    // Get the topics from query parameters (e.g., ?topic=HTML,CSS)
    const topics = req.query.topic ? req.query.topic.split(",") : [];
    // Get the correct answer index from query parameters (if needed)
    const correctAnswerIndex = req.query.correctAnswerIndex
      ? parseInt(req.query.correctAnswerIndex)
      : undefined;

    // Create a filter for the query
    const filter = {};

    // If topics are provided, filter by them
    if (topics.length > 0) {
      filter.topic = { $in: topics };
    }

    // If correctAnswerIndex is provided, filter by it
    if (correctAnswerIndex !== undefined) {
      filter.correctAnswerIndex = correctAnswerIndex;
    }

    // Fetch questions based on the filter
    const questions = await Question.find(filter);

    // Return questions and the count
    res.status(200).json({
      message: "Questions retrieved successfully",
      questionCount: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get A Random
exports.getRandomQuestions = async (req, res) => {
  try {
    const { count = 5 } = req.query; // Get the number of questions to retrieve, default to 5
    const questions = await Question.aggregate([
      { $sample: { size: parseInt(count) } },
    ]); // Get random questions from MongoDB

    // Shuffle the questions array
    const shuffledQuestions = shuffleArray(questions);

    res.status(200).json({
      message: "Random questions retrieved successfully",
      questions: shuffledQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit Quiz
exports.submitQuiz = async (req, res) => {
  const { answers } = req.body;
  const userId = req.userId;

  try {
    // Check user's submission attempts for today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const userResult = await QuizResult.findOne({ userId });

    if (userResult) {
      const attemptsToday = userResult.attempts.filter(
        (attempt) =>
          attempt.createdAt >= startOfDay && attempt.createdAt < endOfDay
      ).length;

      if (attemptsToday >= 3) {
        return res.status(403).json({
          message:
            "You have exceeded the maximum number of attempts for today.",
        });
      }
    }

    // Fetch the questions
    const questionIds = answers.map((answer) => answer.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== answers.length) {
      return res
        .status(400)
        .json({ message: "Some question IDs are invalid." });
    }

    // Calculate score and create detailed results
    let score = 0;
    const detailedResults = answers.map((answer) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId
      );
      const isCorrect =
        question && answer.userAnswer === question.correctAnswerIndex;
      if (isCorrect) score++;
      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        correctAnswer: question ? question.correctAnswerIndex : null,
        isCorrect,
      };
    });

    // Calculate percentage score
    const percentageScore = (score / questions.length) * 100;

    // Create or update the quiz result
    const newAttempt = {
      answers: detailedResults,
      score,
      totalQuestions: questions.length,
      percentageScore: percentageScore.toFixed(2),
      createdAt: new Date(),
    };

    const updatedResult = await QuizResult.findOneAndUpdate(
      { userId },
      {
        $push: { attempts: newAttempt },
      },
      { upsert: true, new: true }
    );

    const attemptsToday = updatedResult.attempts.filter(
      (attempt) =>
        attempt.createdAt >= startOfDay && attempt.createdAt < endOfDay
    ).length;

    res.status(200).json({
      message: "Quiz submitted successfully.",
      score,
      totalQuestions: questions.length,
      answeredQuestions: answers.length,
      percentageScore: percentageScore.toFixed(2),
      attemptsRemaining: Math.max(0, 3 - attemptsToday),
      attemptNumber: attemptsToday,
    });
  } catch (error) {
    console.error("Error in submitQuiz:", error);
    res
      .status(500)
      .json({ message: "An error occurred while submitting the quiz." });
  }
};

// NUKE
exports.nuke = async (req, res) => {
  const { agreed } = req.query; // Get the "agreed" parameter from the query

  // Check if the "agreed" parameter is present and set to 'true'
  if (agreed !== "true") {
    return res
      .status(400)
      .json({ message: "You must agree to delete all questions." });
  }

  try {
    // Delete all questions
    await Question.deleteMany({});
    return res
      .status(200)
      .json({ message: "All questions have been deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
// Function to shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}
