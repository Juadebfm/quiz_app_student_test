const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  registerValidation,
  loginValidation,
} = require("../validation/userValidation");

exports.register = async (req, res) => {
  // Validate the request body
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // Check if the user already exists by email or username
    const emailExists = await User.findOne({ email: req.body.email });
    const usernameExists = await User.findOne({ username: req.body.username });
    if (emailExists)
      return res.status(400).json({ message: "Email already exists" });
    if (usernameExists)
      return res.status(400).json({ message: "Username already exists" });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user, including the isAdmin field
    const user = new User({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      isAdmin: req.body.isAdmin || false, // Use the value from the request or default to false
    });

    const savedUser = await user.save();
    res
      .status(201)
      .json({ message: "User created successfully", user: savedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  // Validate the data before logging in a user
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create and assign a token with role
    const token = jwt.sign(
      {
        id: user._id,
        role: user.isAdmin ? "admin" : "user", // Assuming isAdmin is a field in your User schema
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
