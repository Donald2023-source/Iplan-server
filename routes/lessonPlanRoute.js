const { Router } = require("express");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const LessonPlan = require("../models/lessonPlan");
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

    const lessonPlan = new LessonPlan({
      title,
      file: fileUrl,
      sessionId: sessionId,
      termId: termId,
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      comments: [],
      uploadedBy: fullName,
      uploadDate: Date.now(),
      uploadedById: userId,
      status: "pending",
    });

    await lessonPlan.save();
    res.status(201).json({
      message: "Lesson plan uploaded successfully",
      lessonPlan,
      success: true,
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


router.get("/get-all", async (req, res) => {
  try {
    const lessonPlans = await LessonPlan.find();

    if (!lessonPlans.length) {
      return res.status(404).json({ error: "No lesson plans found" });
    }

    res.status(200).json(lessonPlans);
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

router.put(
  "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans/:lessonPlanId",
  upload.single("lessonPlan"),
  async (req, res) => {
    try {
      const { lessonPlanId } = req.params;
      const { title } = req.body;
      const file = req.file;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Find the existing lesson plan
      const existingLessonPlan = await LessonPlan.findById(lessonPlanId);
      if (!existingLessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }

      // Delete the old file if a new file is uploaded
      if (file && existingLessonPlan.file) {
        const oldFilePath = `./uploads/${existingLessonPlan.file}`;
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Error deleting old file:", err);
        });
      }

      // Update the lesson plan with the new data
      const updateData = { title };
      if (file) {
        updateData.file = file.filename; // Store new file name
      }

      const updatedLessonPlan = await LessonPlan.findByIdAndUpdate(
        lessonPlanId,
        updateData,
        { new: true, runValidators: true }
      );
      res.status(200).json(updatedLessonPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put("/lessonPlanId/update-status", async (req, res) => {
  try {
    const { status } = req.body;
    const { lessonPlanId } = req.params;

    const allowedStatus = ["Pending", "approved", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const lessonPlan = await LessonPlan.findByIdAndUpdate(
      lessonPlanId,
      { status },
      { new: true, validators: true }
    );
    res
      .status(201)
      .json({ message: "Status updated!", success: "true", lessonPlan });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

//delete Lesson Plan

router.delete(
  "/:sessionId/terms/:termId/classes/:classId/subjects/:subjectId/lessonPlans/:lessonPlanId",
  async (req, res) => {
    try {
      const lessonPlan = await LessonPlan.findByIdAndDelete(
        req.params.lessonPlanId
      );
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }

      // Delete the file from Cloudinary
      await cloudinary.uploader.destroy(lessonPlan.fileId); // Cloudinary file ID

      res.status(200).json({
        message: "Lesson plan and associated file deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
