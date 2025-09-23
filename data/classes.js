const mongoose = require("mongoose");
const classes = [
  {
    _id: new mongoose.Types.ObjectId(),
    id: 1,
    code: "JSS 1",
    name: "JS 1 (Junior Secondary 1)",
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 2,
    code: "JSS 2",
    name: "JS 2 (Junior Secondary 2)",
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 3,
    code: "JSS 3",
    name: "JS 3 (Junior Secondary 3)",
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 4,
    code: "SSS 1",
    name: "SS 1 (Secondary Secondary 1)",
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 5,
    code: "SSS 2",
    name: "SS 2 (Secondary Secondary 2)",
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 6,
    code: "SSS 3",
    name: "SS 3 (Secondary Secondary 3)",
  },
];

module.exports = classes;
