const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority",
      family: 4,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    if (error.message.includes("ECONNREFUSED") || error.message.includes("querySrv")) {
      console.error("DNS/Network issue - check DNS (use 8.8.8.8), firewall, Atlas whitelist.");
    }
    process.exit(1);
  }
};

module.exports = connectDB;