// models/Term.js
const mongoose = require("mongoose");

const termSchema = new mongoose.Schema({
  name: String,
  startDate: String,
  endDate: String,
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
});

module.exports = mongoose.model("Term", termSchema);
