const User = require("../models/User");

const authMiddleWare = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.json({ message: "Token expired" });
    }

    const user = await User.findOne(token);
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Something went wrong" });
  }
};

module.exports = authMiddleWare;
