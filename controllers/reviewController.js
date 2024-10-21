const UserStats = require("../models/UserStats");
const { reviewSessionValidation } = require("../validation/reviewValidation");

exports.addReviewSession = async (req, res) => {
  // Validate the data
  const { error } = reviewSessionValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { userId, scores, notes } = req.body;

    // Find the user stats or create a new one if it doesn't exist
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      userStats = new UserStats({ userId });
    }

    // Add the new review session
    const newReviewSession = {
      scores,
      notes,
      reviewedBy: req.userId, // Assuming you have middleware that sets req.userId
    };

    userStats.reviewSessions.push(newReviewSession);

    await userStats.save();

    res.status(201).json({
      message: "Review session added successfully",
      reviewSession: newReviewSession,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
