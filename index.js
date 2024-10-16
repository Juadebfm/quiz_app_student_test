import express from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "dotenv";
import router from "./router/route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import connect from "./database/conn.js";
import authRoutes from "./router/authRoute.js";

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
config();

app.use("/api", router);
app.use("/api/auth", authRoutes);

// Add error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 3002;

connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server Connected To http://localhost:${port}`);
      });
    } catch (error) {
      console.log(error, "Error Encountered");
    }
  })
  .catch((error) => {
    console.log("Invalid Database Connection");
  });
