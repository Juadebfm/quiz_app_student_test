import { Router } from "express";
import * as controller from "../controllers/controller.js";
import { validateQuestion, validateResult } from "../middleware/validate.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = Router();
router.post(
  "/questions",
  protect,
  restrictTo("admin"),
  controller.insertQuestions
);

router.put(
  "/questions/:id",
  protect,
  restrictTo("admin"),
  controller.editQuestion
);

router.get("/questions/get_questions", protect, controller.getAllQuestions);
router.get("/questions/random", protect, controller.getRandomQuestions);
router.get(
  "/questions/search",
  protect,
  controller.getQuestionsByCourseOrTopic
);

router.delete(
  "/questions/:id",
  protect,
  restrictTo("admin"),
  controller.deleteQuestion
);

router.get("/results", protect, restrictTo("admin"), controller.getAllResults);
router.get(
  "/results/student/:studentId",
  protect,
  controller.getResultsByStudent
);

router.post("/results", protect, controller.saveResults);

router.delete(
  "/clear-database",
  protect,
  restrictTo("admin"),
  controller.clearDatabase
);

export default router;
