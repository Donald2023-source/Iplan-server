const { Router } = require("express");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const LessonPlan = require("../models/lessonPlan");
const classes = require("../data/classes");
const juniorSubjects = require("../data/juniorSubjects");
const seniorSubjects = require("../data/seniorSubjects");
const router = Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lesson_plans",
    allowedFormats: ["pdf"],
    resource_type: "raw",
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("lessonPlan"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    const { title, sessionId, termId, classId, subjectId, fullName, userId } =
      req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fileUrl = file.path;

    const existingPlan = await LessonPlan.findOne({
      sessionId,
      termId,
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "A lesson plan already exists",
      });
    }

    // Save lesson plan in DB
    const lessonPlan = new LessonPlan({
      title,
      file: fileUrl,
      sessionId,
      termId,
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      comments: [],
      uploadedBy: fullName,
      uploadDate: Date.now(),
      uploadedById: userId,
      status: "pending",
    });

    await lessonPlan.save();

    const classInfo = classes.find((c) => c.id === parseInt(classId));
    let subjectInfo;

    if (parseInt(classId) <= 3) {
      subjectInfo = juniorSubjects.find((s) => s.id === parseInt(subjectId));
    } else {
      subjectInfo = seniorSubjects.find((s) => s.id === parseInt(subjectId));
    }

    res.status(201).json({
      message: "Lesson plan uploaded successfully",
      success: true,
      lessonPlan: {
        ...lessonPlan.toObject(),
        classCode: classInfo ? classInfo.code : null,
        className: classInfo ? classInfo.name : null,
        subjectName: subjectInfo ? subjectInfo.name : null,
      },
    });
  } catch (error) {
    console.error("Error uploading lesson plan:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/:sessionId/terms/:termId/classes/:classId/lessonPlans",
  async (req, res) => {
    try {
      const { sessionId, termId, classId } = req.params;
      router.post(
        "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans",
        upload.single("lessonPlan"),
        async (req, res) => {
          try {
            const { title } = req.body;
            const file = req.file;

            if (!title || !file) {
              return res
                .status(400)
                .json({ message: "All fields are required" });
            }

            console.log("Title:", title);
            console.log("File:", file);
            console.log("File buffer length:", file.buffer.length); // Check buffer length

            // Handle file upload
            cloudinary.uploader
              .upload_stream(
                { resource_type: "auto", folder: "lesson_plans" },
                async (error, result) => {
                  if (error) {
                    console.error("Cloudinary upload error:", error);
                    return res.status(500).json({ error: error.message });
                  }

                  console.log("Cloudinary upload result:", result);

                  const lessonPlan = new LessonPlan({
                    title,
                    file: result.secure_url, // Store the file URL
                    sessionId: req.params.sessionId,
                    termId: req.params.termId,
                    classId: req.params.classId,
                    subjectId: parseInt(req.params.subjectId),
                    comments: [],
                  });

                  await lessonPlan.save();
                  res.status(201).json({
                    message: "Lesson plan uploaded successfully",
                    lessonPlan,
                  });
                }
              )
              .end(file.buffer);
          } catch (error) {
            console.error("Error uploading lesson plan:", error);
            res.status(500).json({ error: error.message });
          }
        }
      );

      const lessonPlans = await LessonPlan.find({
        sessionId: new mongoose.Types.ObjectId(sessionId),
        termId: new mongoose.Types.ObjectId(termId),
        classId: parseInt(classId),
      }).populate("sessionId termId classId subjectId comments", "name text");

      if (!lessonPlans.length) {
        return res
          .status(404)
          .json({ error: "No lesson plans found for the specified criteria" });
      }

      const updatedLessonPlans = lessonPlans.map((lessonPlan) => {
        const fileUrl = `${"https"}://${req.get("host")}/uploads/${
          lessonPlan.file
        }`;

        let subjectName = "Unknown Subject";
        const subjectId = lessonPlan.subjectId;

        if (parseInt(classId) >= 1 && parseInt(classId) <= 3) {
          const subject = juniorSubjects.find((sub) => sub.id === subjectId);
          if (subject) subjectName = subject.name;
        } else if (parseInt(classId) >= 4 && parseInt(classId) <= 6) {
          const subject = seniorSubjects.find((sub) => sub.id === subjectId);
          if (subject) subjectName = subject.name;
        }

        return {
          ...lessonPlan.toObject(),
          subjectName,
          fileUrl,
        };
      });

      res.status(200).json(updatedLessonPlans);
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/:classId/by-class", async (req, res) => {
  try {
    const lessonPlan = LessonPlan.findById({ classId: req?.params?.classId });
    return res.status(200).json({ success: true, lessonPlan: lessonPlan });
  } catch (error) {
    return res.status(400).json({ error: error, success: false });
  }
});

router.get("/get-all", async (req, res) => {
  try {
    const lessonPlans = await LessonPlan.find();

    if (!lessonPlans.length) {
      return res.status(404).json({ error: "No lesson plans found" });
    }

    const enrichedLessonPlans = lessonPlans.map((lessonPlan) => {
      const classInfo = classes.find((c) => c.id === lessonPlan.classId);
      let subjectInfo;

      if (lessonPlan.classId <= 3) {
        subjectInfo = juniorSubjects.find((s) => s.id === lessonPlan.subjectId);
      } else {
        subjectInfo = seniorSubjects.find((s) => s.id === lessonPlan.subjectId);
      }

      return {
        ...lessonPlan.toObject(),
        classCode: classInfo ? classInfo.code : null,
        className: classInfo ? classInfo.name : null,
        subjectName: subjectInfo ? subjectInfo.name : null,
      };
    });

    res.status(200).json(enrichedLessonPlans);
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  //   res.setHeader("Access-Control-Allow-Origin", "*");
  //   res.setHeader("Content-Disposition", "inline");
  res.setHeader("Content-Type", "application/pdf");

  try {
    const { sessionId, termId, classId, subjectId } = req.query;

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Type", "application/pdf");

    const lessonPlans = await LessonPlan.find({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      termId: new mongoose.Types.ObjectId(termId),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
    }).populate("sessionId termId classId comments", "name text");
    text;

    if (!lessonPlans.length) {
      return res
        .status(404)
        .json({ error: "No lesson plans found for the specified criteria" });
    }

    let subject;
    if (parseInt(classId) >= 1 && parseInt(classId) <= 3) {
      subject = juniorSubjects.find((sub) => sub.id === parseInt(subjectId));
    } else {
      subject = seniorSubjects.find((sub) => sub.id === parseInt(subjectId));
    }

    if (!subject) {
      subject = { name: "Unknown Subject" };
    }

    const updatedLessonPlans = lessonPlans.map((lessonPlan) => {
      const fileUrl = `${"https"}://${req.get("host")}/uploads/${
        lessonPlan.file
      }`;
      return {
        ...lessonPlan.toObject(),
        subjectName: subject.name,
        fileUrl,
      };
    });

    res.status(200).json(updatedLessonPlans);
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:sessionId/:termId/by-term", async (req, res) => {
  try {
    const { sessionId, termId } = req.params;

    const lessonPlans = await LessonPlan.find({
      sessionId,
      termId,
    });

    if (!lessonPlans.length) {
      return res
        .status(404)
        .json({ error: "No lesson plans found for this session/term" });
    }

    const enrichedLessonPlans = lessonPlans.map((lessonPlan) => {
      const classInfo = classes.find((c) => c.id === lessonPlan.classId);

      let subjectInfo;
      if (lessonPlan.classId <= 3) {
        subjectInfo = juniorSubjects.find((s) => s.id === lessonPlan.subjectId);
      } else {
        subjectInfo = seniorSubjects.find((s) => s.id === lessonPlan.subjectId);
      }

      return {
        ...lessonPlan.toObject(),
        classCode: classInfo ? classInfo.code : null,
        className: classInfo ? classInfo.name : null,
        subjectName: subjectInfo ? subjectInfo.name : null,
      };
    });

    res.status(200).json({ success: true, lessonPlans: enrichedLessonPlans });
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    res.status(400).json({ error: "Something went wrong" });
  }
});

router.put("/:id/update", upload.single("lessonPlan"), async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  console.log(id, file);

  try {
    const existingLessonPlan = await LessonPlan.findById(id);
    if (!existingLessonPlan) {
      return res.status(404).json({ error: "Lesson plan not found" });
    }

    if (file && existingLessonPlan.fileId) {
      try {
        await cloudinary.uploader.destroy(existingLessonPlan.fileId, {
          resource_type: "raw",
        });
      } catch (err) {
        console.error("Error deleting old file from Cloudinary:", err);
      }
    }

    const updateData = {};
    if (file) {
      updateData.file = file.path;
      updateData.fileId = file.filename;
      updateData.status = "pending";
      updateData.uploadDate = Date.now();
    }

    const updatedLessonPlan = await LessonPlan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Lesson plan file updated successfully",
      success: true,
      lessonPlan: updatedLessonPlan,
    });
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/update-status", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params; // ✅ correct param

    const allowedStatus = ["pending", "approved", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const lessonPlan = await LessonPlan.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!lessonPlan) {
      return res.status(404).json({ error: "Lesson plan not found" });
    }

    res.status(200).json({
      message: "Status updated!",
      success: true,
      lessonPlan,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || err });
  }
});

//delete Lesson Plan

router.delete("/:id/delete", async (req, res) => {
  try {
    const lessonPlan = await LessonPlan.findByIdAndDelete(req.params.id);
    if (!lessonPlan) {
      return res.status(404).json({ error: "Lesson plan not found" });
    }

    await cloudinary.uploader.destroy(lessonPlan.fileId);

    res.status(200).json({
      message: "Lesson plan and associated file deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
