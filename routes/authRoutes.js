const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const ADMIN_KEY = "SCAHS23";

router.get("/verify", async (req, res) => {
  const token = req.cookies.auth_token;
  res.json({ token: token });
});
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.cookie("auth_token", newUser._id.toString(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      message: "Signup successful. You are now logged in.",
      status: "success",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.cookie("auth_token", user._id.toString(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { password: _, ...withoutPassword } = user.toObject();
    res.status(201).json({
      message: "Log in successfull",
      user: withoutPassword,
      status: "success",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin sign-up
router.post("/admin/signup", async (req, res) => {
  const { fullName, email, password, adminKey } = req.body;

  console.log("Received adminKey:", adminKey);
  console.log("Expected ADMIN_KEY:", ADMIN_KEY);

  if (!fullName || !email || !password || !adminKey) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (adminKey !== ADMIN_KEY) {
    return res.status(400).json({ message: "Invalid admin key" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: "admin",
      adminKey,
    });

    res.cookie("auth_token", newAdmin._id.toString(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { password: _, ...withoutPassword } = newAdmin.toObject();
    return res.status(201).json({
      admin: withoutPassword,
      message: "Admin account created successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/admin/login", async (req, res) => {
  const { email, password, adminKey } = req.body;

  console.log("Received adminKey:", adminKey);
  console.log("Expected ADMIN_KEY:", ADMIN_KEY);

  if (!email || !password || !adminKey) {
    return res
      .status(400)
      .json({ message: "Email, password, and admin key are required" });
  }

  if (adminKey !== ADMIN_KEY) {
    return res.status(400).json({ message: "Invalid admin key" });
  }

  try {
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.cookie("auth_token", admin._id.toString(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const { password: _, ...withoutPassword } = admin.toObject();
    return res.status(200).json({
      admin: withoutPassword,
      message: "Login Successful",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(400).json({ message: "No active session found" });
  }
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",

  });
  res.status(200).json({ message: "Logged out successfully", success:true });
});

module.exports = router;
