// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//       maxlength: 100,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
//     },
//     phone: {
//       type: String,
//       default: "",
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: [6, "Password must be at least 6 characters"],
//       select: false,
//     },
//     role: {
//       type: String,
//       enum: ["student", "admin"],
//       default: "student",
//     },
//     avatar: {
//       type: String,
//       default: "",
//     },
//     isEmailVerified: {
//       type: Boolean,
//       default: false,
//     },
//     emailVerificationToken: String,
//     emailVerificationExpire: Date,
//     resetPasswordToken: String,
//     resetPasswordExpire: Date,
//     purchasedCourses: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Course",
//       },
//     ],
//   },
//   { timestamps: true }
// );

// // Hash password before save
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(12);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Generate email verification token
// userSchema.methods.generateEmailVerificationToken = function () {
//   const token = crypto.randomBytes(32).toString("hex");
//   this.emailVerificationToken = crypto
//     .createHash("sha256")
//     .update(token)
//     .digest("hex");
//   this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//   return token;
// };

// // Generate password reset token
// userSchema.methods.generateResetPasswordToken = function () {
//   const token = crypto.randomBytes(32).toString("hex");
//   this.resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(token)
//     .digest("hex");
//   this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
//   return token;
// };

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // important: you must .select("+password") when logging in
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    avatar: {
      type: String,
      default: "",
    },

    userId: {
  type: String,
  unique: true,
  required: true,
  default: () => crypto.randomBytes(8).toString("hex"),
},
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    purchasedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

// Hash password before save (FIXED: async hook without next)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

module.exports = mongoose.model("User", userSchema);