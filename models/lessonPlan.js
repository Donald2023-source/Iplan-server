const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LessonPlanSchema = new Schema({
  title: { type: String, required: true },
  file: { type: String, required: true },
  fileId: { type: String },
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  termId: { type: Schema.Types.ObjectId, ref: "Term", required: true },
  classId: { type: Number, required: true },
  subjectId: { type: Number, required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  uploadedBy: { type: String, required: true },
  uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("LessonPlan", LessonPlanSchema);
