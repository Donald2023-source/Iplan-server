const express = require("express");
const Comment = require("../models/comment");
const LessonPlan = require("../models/lessonPlan");
const router = express.Router();

router.post("/add",  async (req, res) => {
  try {
    const { text, lessonPlanId } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const lessonPlan = await LessonPlan.findById(lessonPlanId).populate(
      "comments"
    );

    if (!lessonPlan) {
      return res.status(404).json({ error: "Lesson Plan not found" });
    }

    if (lessonPlan.comments.length > 0) {
      return res
        .status(400)
        .json({ error: "This lesson plan already has a comment" });
    }

    const comment = new Comment({
      text,
      lessonPlan: lessonPlanId,
    });

    await comment.save();

    lessonPlan.comments.push(comment._id);
    await lessonPlan.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:lessonPlanId/get-comment", async (req, res) => {
  try {
    const { lessonPlanId } = req.params;
    if (!lessonPlanId) {
      return res.status(400).json({ message: "No lesson plan Id found" });
    }

    // ✅ Populate the comments with their text (and other fields if needed)
    const lessonPlan = await LessonPlan.findById(lessonPlanId).populate({
      path: "comments",
      select: "text createdAt updatedAt", // Add any fields you want
    });

    if (!lessonPlan) {
      return res.status(404).json({ message: "Lesson Plan not found" });
    }

    res.status(200).json(lessonPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/update-comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text and author are required" });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { text },
      { new: true, runValidators: true }
    );
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
