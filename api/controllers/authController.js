import User from "../models/user.schema.js";
import jwt from "jsonwebtoken";
import { formatResponse } from "../utils/responseFormatter.js";
import {
  validateRegister,
  validateLogin,
} from "../middleware/userValidation.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const register = [
  validateRegister,
  async (req, res, next) => {
    try {
      const { username, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json(formatResponse(false, "User already exists"));
      }

      // Create new user
      const newUser = await User.create({
        username,
        email,
        password,
        role: role === "admin" ? "admin" : "student", // Ensure only valid roles are set
      });

      // Generate token
      const token = signToken(newUser._id);

      // Remove password from output
      newUser.password = undefined;

      res.status(201).json(
        formatResponse(true, "User registered successfully", {
          token,
          user: newUser,
        })
      );
    } catch (error) {
      next(error);
    }
  },
];

export const login = [
  validateLogin,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Check if user exists && password is correct
      const user = await User.findOne({ email }).select("+password");

      if (!user || !(await user.correctPassword(password, user.password))) {
        return res
          .status(401)
          .json(formatResponse(false, "Incorrect email or password"));
      }

      // If everything ok, send token to client
      const token = signToken(user._id);

      // Remove password from output
      user.password = undefined;

      res
        .status(200)
        .json(formatResponse(true, "Logged in successfully", { token, user }));
    } catch (error) {
      next(error);
    }
  },
];

export const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json(
          formatResponse(
            false,
            "You are not logged in! Please log in to get access."
          )
        );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res
        .status(401)
        .json(
          formatResponse(
            false,
            "The user belonging to this token no longer exists."
          )
        );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json(
          formatResponse(
            false,
            "You do not have permission to perform this action"
          )
        );
    }
    next();
  };
};
