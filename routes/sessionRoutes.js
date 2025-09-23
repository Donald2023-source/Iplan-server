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
    res.status(201).json({ message: "New session Created", newSession });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
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

router.get("/:id", async (req, res) => {
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
    res.status(200).json(session);
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
  const { sessionId, name } = req.body;
  if ((!sessionId, !name)) {
    res.status(404).json({ message: "All fields required", success: "false" });
    return;
  }
  try {
    const term = new Term({ name, sessionId });
    await term.save();
    res.status(201).json({ message: "New term created SuccessFully", term });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Add a comment to a lesson plan
router.post(
  "/:sessionId/terms/:termId/classes/:classId/lessonPlans/:lessonPlanId/comments",
  async (req, res) => {
    try {
      const { lessonPlanId } = req.params;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Comment text is required" });
      }

      const lessonPlan = await LessonPlan.findById(lessonPlanId);

      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson Plan not found" });
      }

      const comment = new Comment({ text, lessonPlan: lessonPlanId }); // Set lessonPlan reference here
      await comment.save();

      lessonPlan.comments.push(comment._id);
      await lessonPlan.save();

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Fetch comments for a specific lesson plan
router.get(
  "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans/:lessonPlanId/comments",
  async (req, res) => {
    try {
      const { lessonPlanId } = req.params;
      const lessonPlan = await LessonPlan.findById(lessonPlanId).populate(
        "comments",
        "text"
      ); // Ensure comments are populated with their text
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }

      res.status(200).json(lessonPlan.comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update a comment
router.put(
  "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans/:lessonPlanId/comments/:commentId",
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const { text, author } = req.body;

      if (!text || !author) {
        return res.status(400).json({ error: "Text and author are required" });
      }

      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { text, author },
        { new: true, runValidators: true }
      );
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      res.status(200).json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete a comment
router.delete(
  "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans/:lessonPlanId/comments/:commentId",
  async (req, res) => {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findByIdAndDelete(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Also remove the comment from the lesson plan's comments array
      await LessonPlan.findByIdAndUpdate(req.params.lessonPlanId, {
        $pull: { comments: commentId },
      });

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
