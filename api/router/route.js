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
export default router;
