// server/services/emailService.js
const axios = require("axios");

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
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// ✅ Reusable email sender (using Brevo HTTP API)
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  console.log(`📧 Sending email to: ${to}`);

  const payload = {
    sender: {
      name: academyName,
      email: process.env.EMAIL_FROM,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  // Attach PDFs if provided
  if (attachments.length > 0) {
    payload.attachment = attachments.map((att) => ({
      name: att.filename,
      content: att.content.toString("base64"),
    }));
  }

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(`✅ Email sent to ${to} | MessageId: ${response.data.messageId}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error(`❌ Failed to send email to ${to}:`, errMsg);
    throw new Error(errMsg);
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

// ---------------------------
// WELCOME EMAIL
// ---------------------------
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: `Welcome to ${academyName}! 🎉`,
    html: welcomeEmailTemplate(user.name),
  });
};

// ---------------------------
// PURCHASE CONFIRMATION
// ---------------------------
const sendPurchaseConfirmation = async (user, order) => {
  await sendEmail({
    to: user.email,
    subject: `Payment Confirmed — ${academyName}`,
    html: purchaseConfirmationTemplate(user.name, order),
  });
};

// ---------------------------
// ADMISSION LETTER
// ---------------------------
const sendAdmissionLetterEmail = async (user, order, pdfBuffer) => {
  await sendEmail({
    to: user.email,
    subject: `Your Admission Letter — ${academyName}`,
    html: admissionLetterEmailTemplate(user.name, order),
    attachments: [
      {
        filename: `Admission_Letter_${user.name.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

// ---------------------------
// CERTIFICATE
// ---------------------------
const sendCertificateEmail = async (user, course, certificate, pdfBuffer) => {
  await sendEmail({
    to: user.email,
    subject: `🎓 Your Certificate for "${course.title}" — ${academyName}`,
    html: certificateEmailTemplate(user, course, certificate),
    attachments: [
      {
        filename: `Certificate_${course.title.replace(/\s+/g, "_")}_${user.name.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

// ---------------------------
// CONTACT EMAILS
// ---------------------------
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

// ---------------------------
// PASSWORD RESET
// ---------------------------
const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: `Password Reset Request — ${academyName}`,
    html: passwordResetTemplate(user.name, resetUrl),
  });
};

// ---------------------------
// NEWSLETTER
// ---------------------------
const sendNewsletterConfirmation = async (email) => {
  await sendEmail({
    to: email,
    subject: `You're subscribed! — ${academyName}`,
    html: newsletterConfirmationTemplate(),
  });
};

// ✅ Export all
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