const express = require("express");
const session = require("express-session"); // Correct import for express-session
const MongoStore = require("connect-mongo");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 4000;

const session = require("express-session");
const MongoStore = require("connect-mongo");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: "1172",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://donalddyusuf:orVEZja4ABJlb5ZP@st-christophers.trvhc.mongodb.net/?retryWrites=true&w=majority",
    }),
    cookie: { secure: true, maxAge: 60000 },
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
