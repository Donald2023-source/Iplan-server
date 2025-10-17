const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();

const ADMIN_KEY = "SCAHS23";

require("dotenv").config();

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
      sameSite: "lax",
      secure: false,
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

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://192.168.0.237:3000/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Iplan Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Iplan Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    res.status(200).json({
      message: "Password reset link sent to your email",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  console.log("newPass", newPassword);

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in.",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(400).json({ message: "No active session found" });
    }
    res.clearCookie("auth_token", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    res.status(200).json({ message: "Logged out successfully", success: true });
  } catch (error) {
    res.json(400).json({ error: error.message });
  }
});

module.exports = router;
