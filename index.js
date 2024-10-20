const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const quizRoutes = require("./routes/quizRoute");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
