// // server/services/emailService.js
// const nodemailer = require("nodemailer");
// const {
//   verificationEmailTemplate,
//   welcomeEmailTemplate,
//   purchaseConfirmationTemplate,
//   admissionLetterEmailTemplate,
//   certificateEmailTemplate,
//   contactConfirmationTemplate,
//   adminContactNotificationTemplate,
//   passwordResetTemplate,
//   newsletterConfirmationTemplate,
// } = require("./emailTemplates");

// const academyName = process.env.ACADEMY_NAME || "Tech Academy";

// // ✅ Single reusable transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: parseInt(process.env.EMAIL_PORT || "587"),
//   secure: process.env.EMAIL_PORT === "465",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ✅ Reusable send helper
// const sendEmail = async ({ to, subject, html, attachments = [] }) => {
//   await transporter.sendMail({
//     from: `"${academyName}" <${process.env.EMAIL_FROM}>`,
//     to,
//     subject,
//     html,
//     attachments,
//   });
// };

// // ---------------------------
// // VERIFICATION EMAIL
// // ---------------------------
// const sendVerificationEmail = async (user, verifyUrl) => {
//   await sendEmail({
//     to: user.email,
//     subject: `Verify your email — ${academyName}`,
//     html: verificationEmailTemplate(user.name, verifyUrl),
//   });
// };

// // ---------------------------
// // WELCOME EMAIL
// // ---------------------------
// const sendWelcomeEmail = async (user) => {
//   await sendEmail({
//     to: user.email,
//     subject: `Welcome to ${academyName}! 🎉`,
//     html: welcomeEmailTemplate(user.name),
//   });
// };

// // ---------------------------
// // PURCHASE CONFIRMATION
// // ---------------------------
// const sendPurchaseConfirmation = async (user, order) => {
//   await sendEmail({
//     to: user.email,
//     subject: `Payment Confirmed — ${academyName}`,
//     html: purchaseConfirmationTemplate(user.name, order),
//   });
// };

// // ---------------------------
// // ADMISSION LETTER EMAIL
// // ---------------------------
// const sendAdmissionLetterEmail = async (user, order, pdfBuffer) => {
//   await sendEmail({
//     to: user.email,
//     subject: `Your Admission Letter — ${academyName}`,
//     html: admissionLetterEmailTemplate(user.name, order),
//     attachments: [
//       {
//         filename: `Admission_Letter_${user.name.replace(/\s+/g, "_")}.pdf`,
//         content: pdfBuffer,
//         contentType: "application/pdf",
//       },
//     ],
//   });
// };

// // ---------------------------
// // CERTIFICATE EMAIL ✅ NEW
// // ---------------------------
// const sendCertificateEmail = async (user, course, certificate, pdfBuffer) => {
//   await sendEmail({
//     to: user.email,
//     subject: `🎓 Your Certificate for "${course.title}" — ${academyName}`,
//     html: certificateEmailTemplate(user, course, certificate),
//     attachments: [
//       {
//         filename: `Certificate_${course.title.replace(/\s+/g, "_")}_${user.name.replace(/\s+/g, "_")}.pdf`,
//         content: pdfBuffer,
//         contentType: "application/pdf",
//       },
//     ],
//   });
// };

// // ---------------------------
// // CONTACT EMAILS
// // ---------------------------
// const sendContactConfirmation = async (contact) => {
//   await sendEmail({
//     to: contact.email,
//     subject: `We received your message — ${academyName}`,
//     html: contactConfirmationTemplate(contact),
//   });
// };

// const sendAdminContactNotification = async (contact) => {
//   await sendEmail({
//     to: process.env.ADMIN_EMAIL,
//     subject: `New Contact Form: ${contact.subject}`,
//     html: adminContactNotificationTemplate(contact),
//   });
// };

// // ---------------------------
// // PASSWORD RESET
// // ---------------------------
// const sendPasswordResetEmail = async (user, resetUrl) => {
//   await sendEmail({
//     to: user.email,
//     subject: `Password Reset Request — ${academyName}`,
//     html: passwordResetTemplate(user.name, resetUrl),
//   });
// };

// // ---------------------------
// // NEWSLETTER
// // ---------------------------
// const sendNewsletterConfirmation = async (email) => {
//   await sendEmail({
//     to: email,
//     subject: `You're subscribed! — ${academyName}`,
//     html: newsletterConfirmationTemplate(),
//   });
// };

// // ✅ Single export at bottom
// module.exports = {
//   sendVerificationEmail,
//   sendWelcomeEmail,
//   sendPurchaseConfirmation,
//   sendAdmissionLetterEmail,
//   sendCertificateEmail,
//   sendContactConfirmation,
//   sendAdminContactNotification,
//   sendPasswordResetEmail,
//   sendNewsletterConfirmation,
// };

// server/services/emailService.js
const nodemailer = require("nodemailer");
const {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  purchaseConfirmationTemplate,
  admissionLetterEmailTemplate,
  certificateEmailTemplate,
  contactConfirmationTemplate,
  adminContactNotificationTemplate,
  passwordResetTemplate,
  newsletterConfirmationTemplate,
} = require("./emailTemplates");

const academyName = process.env.ACADEMY_NAME || "Tech Academy";

// ✅ Validate env vars at startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL_USER or EMAIL_PASS is missing in .env");
} else {
  console.log("✅ Email credentials loaded:", process.env.EMAIL_USER);
}

// ✅ Single reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true only for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify connection at startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter failed:", err.message);
  } else {
    console.log("✅ Email transporter ready to send mail");
  }
});

// ✅ Reusable send helper with logging
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    console.log(`📧 Sending email to: ${to}`);

    const info = await transporter.sendMail({
      from: `"${academyName}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

// ---------------------------
// VERIFICATION EMAIL
// ---------------------------
const sendVerificationEmail = async (user, verifyUrl) => {
  await sendEmail({
    to: user.email,
    subject: `Verify your email — ${academyName}`,
    html: verificationEmailTemplate(user.name, verifyUrl),
  });
};

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: `Welcome to ${academyName}! 🎉`,
    html: welcomeEmailTemplate(user.name),
  });
};

const sendPurchaseConfirmation = async (user, order) => {
  await sendEmail({
    to: user.email,
    subject: `Payment Confirmed — ${academyName}`,
    html: purchaseConfirmationTemplate(user.name, order),
  });
};

const sendAdmissionLetterEmail = async (user, order, pdfBuffer) => {
  await sendEmail({
    to: user.email,
    subject: `Your Admission Letter — ${academyName}`,
    html: admissionLetterEmailTemplate(user.name, order),
    attachments: [
      {
        filename: `Admission_Letter_${user.name.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

const sendCertificateEmail = async (user, course, certificate, pdfBuffer) => {
  await sendEmail({
    to: user.email,
    subject: `🎓 Your Certificate for "${course.title}" — ${academyName}`,
    html: certificateEmailTemplate(user, course, certificate),
    attachments: [
      {
        filename: `Certificate_${course.title.replace(/\s+/g, "_")}_${user.name.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};

const sendContactConfirmation = async (contact) => {
  await sendEmail({
    to: contact.email,
    subject: `We received your message — ${academyName}`,
    html: contactConfirmationTemplate(contact),
  });
};

const sendAdminContactNotification = async (contact) => {
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Form: ${contact.subject}`,
    html: adminContactNotificationTemplate(contact),
  });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: `Password Reset Request — ${academyName}`,
    html: passwordResetTemplate(user.name, resetUrl),
  });
};

const sendNewsletterConfirmation = async (email) => {
  await sendEmail({
    to: email,
    subject: `You're subscribed! — ${academyName}`,
    html: newsletterConfirmationTemplate(),
  });
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPurchaseConfirmation,
  sendAdmissionLetterEmail,
  sendCertificateEmail,
  sendContactConfirmation,
  sendAdminContactNotification,
  sendPasswordResetEmail,
  sendNewsletterConfirmation,
};