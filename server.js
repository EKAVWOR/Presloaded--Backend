// // server/server.js
// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const cookieParser = require("cookie-parser");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");

// const connectDB = require("./config/db");
// const errorHandler = require("./middleware/errorHandler");

// // Load env vars FIRST before anything else
// dotenv.config();

// // Connect to database
// connectDB();

// const app = express();

// const isDev = process.env.NODE_ENV === "development";

// /* ---------------- SECURITY ---------------- */

// app.use(helmet());

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   })
// );

// // General rate limiter
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: isDev ? 10000 : 500,
//   message: {
//     success: false,
//     message: "Too many requests, please try again later",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use("/api/", limiter);

// // Auth rate limiter
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: isDev ? 1000 : 20,
//   message: {
//     success: false,
//     message: "Too many login attempts, please try again later",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipSuccessfulRequests: true,
// });

// /* ---------------- MIDDLEWARE ---------------- */

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// /* ---------------- ROUTES ---------------- */

// // ✅ All routes required and registered BEFORE app.listen
// const authRoutes = require("./routes/authRoutes");
// const courseRoutes = require("./routes/courseRoutes");
// const orderRoutes = require("./routes/orderRoutes");
// const contactRoutes = require("./routes/contactRoutes");
// const newsletterRoutes = require("./routes/newsletterRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const enrollmentRoutes = require("./routes/enrollmentRoutes"); // ✅ moved here

// app.use("/api/auth", authLimiter, authRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/newsletter", newsletterRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/enrollments", enrollmentRoutes); // ✅ moved here

// /* ---------------- HEALTH CHECK ---------------- */

// app.get("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Server is running",
//     timestamp: new Date(),
//   });
// });

// /* ---------------- 404 ---------------- */

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// /* ---------------- ERROR HANDLER ---------------- */

// app.use(errorHandler);

// /* ---------------- START SERVER ---------------- */

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(
//     `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
//   );
// });

// server/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars FIRST
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ✅ FIX 1 — trust proxy MUST be before everything else
app.set("trust proxy", 1);

const isDev = process.env.NODE_ENV === "development";

/* ---------------- SECURITY ---------------- */

app.use(helmet());

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// ✅ FIX 2 — add validate to BOTH rate limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // ✅ fixes Render error
});

app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false }, // ✅ fixes Render error
});

/* ---------------- MIDDLEWARE ---------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const adminRoutes = require("./routes/adminRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/enrollments", enrollmentRoutes);

/* ---------------- HEALTH CHECK ---------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

/* ---------------- 404 ---------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ---------------- ERROR HANDLER ---------------- */

app.use(errorHandler);

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});