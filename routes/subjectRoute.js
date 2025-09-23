const { Router } = require("express");
const classes = require("../data/classes");
const juniorSubjects = require("../data/juniorSubjects");
const seniorSubjects = require("../data/seniorSubjects");
const router = Router();
router.get("/", async (req, res) => {
  try {
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:classId/get-all-subjects", (req, res) => {
  const classId = parseInt(req.params.classId, 10);
  let subjects;
  if (classId >= 1 && classId <= 3) {
    subjects = juniorSubjects;
  } else if (classId >= 4 && classId <= 6) {
    subjects = seniorSubjects;
  } else {
    return res.status(400).json({ error: "Invalid class ID" });
  }
  res.status(200).json(subjects);
});

module.exports = router;
