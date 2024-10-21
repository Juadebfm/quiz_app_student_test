const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const { addReviewSession } = require("../controllers/reviewController");

// Add this new route
router.post("/review_student", authenticate, isAdmin, addReviewSession);

module.exports = router;
