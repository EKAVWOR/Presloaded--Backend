// middleware/validators.js
const { validationResult, body } = require("express-validator");

// Middleware to check validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Validators
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidation,
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

const contactValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  handleValidation,
];

// Course Validation - WITHOUT duration
const courseValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("courseType")
    .isIn(["online", "offline"])
    .withMessage("Course type must be online or offline"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  // Duration removed completely
  handleValidation,
];

const orderValidation = [
  body("courses")
    .isArray({ min: 1 })
    .withMessage("At least one course is required"),
  body("totalAmount").isNumeric().withMessage("Total amount is required"),
  body("paystackReference")
    .trim()
    .notEmpty()
    .withMessage("Payment reference is required"),
  handleValidation,
];

module.exports = {
  registerValidation,
  loginValidation,
  contactValidation,
  courseValidation,
  orderValidation,
  handleValidation,
};