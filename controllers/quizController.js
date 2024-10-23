const Question = require("../models/Question");
const { questionValidation } = require("../validation/questionValidation");
const {
  quizSubmissionValidation,
} = require("../validation/questionValidation");
const QuizResult = require("../models/QuizResults");
const UserStats = require("../models/UserStats");
const User = require("../models/User"); // Add this at the top of your file

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
    // Get user details first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Rest of your existing validation logic...
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Prepare user details object
    const userDetails = {
      username: user.username,
      email: user.email,
      fullName: user.fullName, // If you have these fields in your User model
      studentId: user.studentId,
    };

    // Calculate scores and create new attempt...
    const newAttempt = {
      answers: detailedResults,
      score,
      totalQuestions: questions.length,
      percentageScore: percentageScore.toFixed(2),
      createdAt: new Date(),
    };

    // Update or create quiz result with user details
    const updatedResult = await QuizResult.findOneAndUpdate(
      { userId },
      {
        $set: { userDetails }, // Add/update user details
        $push: { attempts: newAttempt },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Return response with user details included
    res.status(200).json({
      message: "Quiz submitted successfully.",
      userDetails: updatedResult.userDetails,
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

// Add new endpoints for retrieving quiz results

// Assuming you have a User model imported

// Get results for a specific user
exports.getUserQuizResults = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;

    const results = await QuizResult.findOne({ userId })
      .populate("userId", "username email")
      .select("userDetails attempts userId")
      .lean();

    if (!results) {
      return res
        .status(404)
        .json({ message: "No quiz results found for this user" });
    }

    // Get the last attempt and calculate percentage
    const lastAttempt = results.attempts[results.attempts.length - 1] || null;
    const lastScore = lastAttempt
      ? {
          score: lastAttempt.score,
          totalQuestions: lastAttempt.totalQuestions,
          percentage: (
            (lastAttempt.score / lastAttempt.totalQuestions) *
            100
          ).toFixed(2),
          attemptDate: lastAttempt.createdAt,
        }
      : null;

    res.status(200).json({
      success: true,
      userDetails: {
        ...results.userDetails,
        username: results.userId?.username,
        email: results.userId?.email,
      },
      lastScore,
      attempts: results.attempts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quiz results", error: error.message });
  }
};

// Get all quiz results (for admin/teacher)
exports.getAllQuizResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.email) {
      filters["userId.email"] = new RegExp(req.query.email, "i");
    }
    if (req.query.username) {
      filters["userId.username"] = new RegExp(req.query.username, "i");
    }

    const results = await QuizResult.find(filters)
      .populate("userId", "username email")
      .select("userDetails attempts userId")
      .sort({ "attempts.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await QuizResult.countDocuments(filters);

    // Map the results to include user details and last score
    const formattedResults = results.map((result) => {
      const lastAttempt = result.attempts[result.attempts.length - 1] || null;
      const lastScore = lastAttempt
        ? {
            score: lastAttempt.score,
            totalQuestions: lastAttempt.totalQuestions,
            percentage: (
              (lastAttempt.score / lastAttempt.totalQuestions) *
              100
            ).toFixed(2),
            attemptDate: lastAttempt.createdAt,
          }
        : null;

      return {
        ...result,
        userDetails: {
          ...result.userDetails,
          username: result.userId?.username,
          email: result.userId?.email,
        },
        lastScore,
        totalAttempts: result.attempts.length,
        averageScore:
          result.attempts.length > 0
            ? (
                result.attempts.reduce(
                  (acc, curr) => acc + (curr.score / curr.totalQuestions) * 100,
                  0
                ) / result.attempts.length
              ).toFixed(2)
            : null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedResults.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      results: formattedResults,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quiz results", error: error.message });
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
