const mongoose = require("mongoose");
const QuizResult = require("../models/QuizResults");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

async function migrateUserDetails() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all quiz results without user details
    const results = await QuizResult.find({ userDetails: { $exists: false } });
    console.log(`Found ${results.length} results to update`);

    let updated = 0;
    let failed = 0;

    for (const result of results) {
      try {
        const user = await User.findById(result.userId);
        if (user) {
          await QuizResult.findByIdAndUpdate(result._id, {
            $set: {
              userDetails: {
                username: user.username,
                email: user.email,
                studentId: user.studentId,
              },
            },
          });
          updated++;
        } else {
          failed++;
          console.log(`No user found for ID: ${result.userId}`);
        }
      } catch (error) {
        failed++;
        console.error(`Error updating result ${result._id}:`, error);
      }
    }

    console.log(`Migration complete. Updated: ${updated}, Failed: ${failed}`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateUserDetails();
