// const crypto = require("crypto");
// const User = require("../models/User");
// const generateToken = require("../utils/generateToken");
// const {
//   sendVerificationEmail,
//   sendWelcomeEmail,
//   sendPasswordResetEmail,
// } = require("../services/emailService");

// // @desc    Register user
// // @route   POST /api/auth/register
// exports.register = async (req, res, next) => {
//   try {
//     const { name, email, phone, password } = req.body;

//     // Check existing user
//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "An account with this email already exists",
//       });
//     }

//     // Create user
//     const user = await User.create({ name, email, phone, password });

//     // Generate email verification token
//     const verificationToken = user.generateEmailVerificationToken();
//     await user.save({ validateBeforeSave: false });

//     // Send verification email
//     try {
//       await sendVerificationEmail(user, verificationToken);
//     } catch (emailErr) {
//       console.error("Verification email failed:", emailErr.message);
//     }

//     // Generate JWT
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         isEmailVerified: user.isEmailVerified,
//       },
//       message: "Account created! Please check your email to verify.",
//     });
//   } catch (error) {
//     console.error("resendVerification error:", error);
//     next(error);
//   }
// };



// // @desc    Login user
// // @route   POST /api/auth/login
// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // Find user with password
//     const user = await User.findOne({ email }).select("+password");
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     // Compare password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         isEmailVerified: user.isEmailVerified,
//         purchasedCourses: user.purchasedCourses,
//       },
//     });
//   } catch (error) {
//     console.error("resendVerification error:", error);
//     next(error);
//   }
// };

// // @desc    Get current user
// // @route   GET /api/auth/me
// exports.getMe = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id).populate(
//       "purchasedCourses",
//       "title slug thumbnail courseType"
//     );

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Verify email
// // @route   GET /api/auth/verify-email/:token
// exports.verifyEmail = async (req, res, next) => {
//   try {
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const user = await User.findOne({
//       emailVerificationToken: hashedToken,
//       emailVerificationExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired verification link",
//       });
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpire = undefined;
//     await user.save({ validateBeforeSave: false });

//     // Send welcome email
//     try {
//       await sendWelcomeEmail(user);
//     } catch (emailErr) {
//       console.error("Welcome email failed:", emailErr.message);
//     }

//     res.status(200).json({
//       success: true,
//       message: "Email verified successfully!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Resend verification email
// // @route   POST /api/auth/resend-verification
// // @desc    Resend verification email
// // @route   POST /api/auth/resend-verification
// exports.resendVerification = async (req, res, next) => {
//   try {
//     console.log("🔄 Resend verification called");

//     const user = req.user;
//     console.log("User from req.user:", user ? user._id : "undefined");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Please login to resend verification email",
//       });
//     }

//     if (user.isEmailVerified) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already verified",
//       });
//     }

//     // Generate token
//     console.log("Generating verification token...");
//     const verificationToken = user.generateEmailVerificationToken();
//     console.log("Token generated successfully");

//     await user.save({ validateBeforeSave: false });
//     console.log("User saved successfully");

//     // Send email
//     console.log(`Sending verification email to ${user.email}...`);
//     try {
//       await sendVerificationEmail(user, verificationToken);
//       console.log("✅ Email sent successfully");
//     } catch (emailErr) {
//       console.error("❌ Email sending failed:", emailErr.message);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to send verification email. Please try again later.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Verification email has been sent successfully",
//     });
//   } catch (error) {
//     console.error("❌ resendVerification ERROR:", error);
//     next(error);
//   }
// };






// exports.forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       // Don't reveal if user exists
//       return res.status(200).json({
//         success: true,
//         message: "If an account exists with that email, a reset link has been sent",
//       });
//     }

//     const resetToken = user.generateResetPasswordToken();
//     await user.save({ validateBeforeSave: false });

//     try {
//       await sendPasswordResetEmail(user, resetToken);
//     } catch (emailErr) {
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;
//       await user.save({ validateBeforeSave: false });

//       return res.status(500).json({
//         success: false,
//         message: "Failed to send reset email. Please try again.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "If an account exists with that email, a reset link has been sent",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Reset password
// // @route   POST /api/auth/reset-password/:token
// exports.resetPassword = async (req, res, next) => {
//   try {
//     const { password } = req.body;

//     if (!password || password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired reset link",
//       });
//     }

//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Password reset successful. You can now log in.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Update profile
// // @route   PUT /api/auth/update-profile
// exports.updateProfile = async (req, res, next) => {
//   try {
//     const { name, phone } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { name, phone },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       user,
//       message: "Profile updated",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Change password
// // @route   PUT /api/auth/change-password
// exports.changePassword = async (req, res, next) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!newPassword || newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "New password must be at least 6 characters",
//       });
//     }

//     const user = await User.findById(req.user._id).select("+password");

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Current password is incorrect",
//       });
//     }

//     user.password = newPassword;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Password changed successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// Helper to build full URLs
const buildUrl = (path) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${clientUrl}${path}`;
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create user
    const user = await User.create({ name, email, phone, password });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // ✅ Build full verification URL
    const verifyUrl = buildUrl(`/verify-email/${verificationToken}`);

    // Send verification email
    try {
      await sendVerificationEmail(user, verifyUrl);
      console.log(`✅ Verification email sent to ${user.email}`);
    } catch (emailErr) {
      console.error("❌ Verification email failed:", emailErr.message);
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      message: "Account created! Please check your email to verify.",
    });
  } catch (error) {
    console.error("register error:", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        purchasedCourses: user.purchasedCourses,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "purchasedCourses",
      "title slug thumbnail courseType"
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailErr) {
      console.error("❌ Welcome email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    console.log("🔄 Resend verification called");

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Please login to resend verification email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // ✅ Build full URL
    const verifyUrl = buildUrl(`/verify-email/${verificationToken}`);

    console.log(`Sending verification email to ${user.email}...`);

    try {
      await sendVerificationEmail(user, verifyUrl);
      console.log("✅ Email sent successfully");
    } catch (emailErr) {
      console.error("❌ Email sending failed:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email has been sent successfully",
    });
  } catch (error) {
    console.error("❌ resendVerification ERROR:", error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email, a reset link has been sent",
      });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // ✅ Build full URL
    const resetUrl = buildUrl(`/reset-password/${resetToken}`);

    try {
      await sendPasswordResetEmail(user, resetUrl);
      console.log(`✅ Reset email sent to ${user.email}`);
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("❌ Reset email failed:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a reset link has been sent",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user,
      message: "Profile updated",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};