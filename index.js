const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/authRoutes");
const subjectRoute = require("./routes/subjectRoute");
const sessionRoutes = require("./routes/sessionRoutes");
const lessonPlanRoute = require("./routes/lessonPlanRoute");
const commentRoutes = require("./routes/commentRoutes");
const assignSubject = require("./routes/AssignSubject");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./config/cloudinaryConfig");
const cookieParser = require("cookie-parser");
const RequestMiddleware = require("./middlewares/requestMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lesson_plans",
    allowedFormats: ["pdf"],
  },
});
const upload = multer({ storage: storage });
dotenv.config();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://iplan-frontend.onrender.com"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "someRandomSessionSecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI ||
        "mongodb+srv://donalddyusuf:orVEZja4ABJlb5ZP@st-christophers.trvhc.mongodb.net/?retryWrites=true&w=majority",
      collectionName: "sessions",
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

require("./auth/passport");

mongoose
  .connect(
    process.env.MONGOD_URL ||
      "mongodb+srv://donalddyusuf:orVEZja4ABJlb5ZP@st-christophers.trvhc.mongodb.net/?retryWrites=true&w=majority", //'mongodb://127.0.0.1:27017/st_christophers'

    {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/class", RequestMiddleware, subjectRoute);
app.use("/api/lesson-plan", RequestMiddleware, lessonPlanRoute);
app.use("/api/session", RequestMiddleware, sessionRoutes);
app.use("/api/comments", RequestMiddleware, commentRoutes);
app.use("/assign", assignSubject);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
