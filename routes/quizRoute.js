const express = require("express");
const {
  addQuestion,
  getQuestions,
  editQuestion,
  getRandomQuestions,
  submitQuiz,
  nuke,
  getUserQuizResults,
  getAllQuizResults,
} = require("../controllers/quizController");
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const router = express.Router();

router.post("/add", authenticate, isAdmin, addQuestion);
router.put("/edit/:questionId", authenticate, isAdmin, editQuestion);
router.get("/questions", authenticate, getQuestions);
router.get("/random", authenticate, getRandomQuestions);
router.post("/submit", authenticate, submitQuiz);
router.delete("/nuke_questions", authenticate, isAdmin, nuke);
// New routes for retrieving results
router.get("/results/user/:userId?", authenticate, getUserQuizResults);
router.get("/results/all", authenticate, isAdmin, getAllQuizResults);

module.exports = router;
