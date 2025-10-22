const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const Session = require("../models/Session");
const Term = require("../models/Term");
const LessonPlan = require("../models/lessonPlan");
const Subject = require("../models/Subjects");
const Comment = require("../models/comment");
const classes = require("../data/classes");
const juniorSubjects = require("../data/juniorSubjects");
const seniorSubjects = require("../data/seniorSubjects");
const RequestMiddleware = require("../middlewares/requestMiddleware");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }
    const newSession = new Session({ name });
    await newSession.save();
    res
      .status(201)
      .json({ message: "New session Created", newSession, success: true });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      success: false,
    });
  }
});

router.get("/", RequestMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong", error: error.message });
  }
});

router.get("/:id", RequestMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json({
      session: session,
      message: "Sesssion updated successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Term routes
router.post("/create-term", async (req, res) => {
  const { sessionId, name, startDate, endDate } = req.body;
  if (!sessionId || !name || !endDate || !startDate) {
    res.status(404).json({ message: "All fields required", success: false });
    return;
  }
  try {
    const existingTerm = Term.findOne({ name });
    if (existingTerm) {
      res.status(400).json({
        message: "You already have a term with this name",
        status: 400,
        success: false,
      });
      return;
    }
    const term = new Term({ name, sessionId, startDate, endDate });
    await term.save();
    res
      .status(201)
      .json({ message: "New term created SuccessFully", term, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/term/:id/update", async (req, res) => {
  const { name, startDate, endDate, sessionId } = req.body;
  console.log(req.body);
  try {
    if (!name || !startDate || !endDate || !sessionId) {
      return res
        .status(400)
        .json({ message: "All fields required", success: false });
    }
    console.log(req.body);

    const term = await Term.findByIdAndUpdate(
      req?.params?.id,
      { name, startDate, endDate },
      { new: true, runValidators: true }
    );

    if (!term) {
      return res
        .status(404)
        .json({ message: "Term not found", success: false });
    }

    res.status(200).json({
      message: "Term updated successfully",
      success: true,
      term,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

router.get("/:sessionId/terms", async (req, res) => {
  try {
    const terms = await Term.find({ sessionId: req.params.sessionId });
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/term/delete", async (req, res) => {
  const { sessionId, termId } = req.body;

  if (!sessionId || !termId) {
    res.status(404).json({ message: "All fields required", stauts: "false" });
  }
  try {
    const renderId = termId;
    const term = await Term.findByIdAndDelete(renderId);
    if (!term) {
      return res.status(404).json({ error: "Term not found" });
    }
    res.status(200).json({ message: "Term deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:sessionId/delete", async (req, res) => {
  const { sessionId } = req.params;
  const { name } = req.body;

  try {
    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found", success: false });
    }

    await Term.deleteMany({ sessionId });
    res.status(200).json({ message: "Session deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});


module.exports = router;
