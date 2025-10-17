const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  assignedSubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  classTeacher: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  adminKey: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
