const express = require("express");
const User = require("../models/User");
const classes = require("../data/classes");

const router = express.Router();

router.post("/subject", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const teacher = await User.findById(userId);
    if (!teacher) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ teacher, message: "teacher found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/class", async (req, res) => {
  try {
    const { userId, classId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const teacher = await User.findById(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const matchClass = classes.find((item) => item.id === parseInt(classId));

    if (!matchClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    teacher.classTeacher = matchClass;
    await teacher.save();

    res.json({
      message: "Class assigned successfully",
      assignedClass: matchClass,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
