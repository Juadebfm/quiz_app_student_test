import express from "express";
import {
  register,
  login,
  protect,
  restrictTo,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Protected routes example
router.get("/admin-only", protect, restrictTo("admin"), (req, res) => {
  res.json(formatResponse(true, "Welcome to the admin area"));
});

export default router;
