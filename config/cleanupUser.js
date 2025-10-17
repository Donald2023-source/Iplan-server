const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function cleanUsers() {
  try {
    console.log("🔗 Connecting to:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB:", conn.connection.name);

    const users = await User.find({});
    console.log(`🔍 Found ${users.length} users to clean.`);

    if (users.length === 0) {
      console.log("⚠️ No users found. You may be connected to a different DB.");
      process.exit(0);
    }

    const ops = users.map((user) => {
      const fullName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Unknown User";
      return {
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: { fullName },
            $unset: { firstName: "", lastName: "" },
          },
        },
      };
    });

    await User.bulkWrite(ops);
    console.log("✅ Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
}

cleanUsers();
