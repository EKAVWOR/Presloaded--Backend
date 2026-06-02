// server/services/emailTemplates.js
const academyName = process.env.ACADEMY_NAME || "Tech Academy";

const baseStyles = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
`;

const headerHTML = `
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px;">${academyName}</h1>
  </div>
`;

const footerHTML = `
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
    <p>© ${new Date().getFullYear()} ${academyName}. All rights reserved.</p>
    <p>${process.env.ACADEMY_ADDRESS || ""}</p>
  </div>
`;

const buttonStyle = `
  display: inline-block;
  background: #61e546;
  color: white;
  padding: 14px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
`;

// ---------------------------
// VERIFICATION EMAIL
// ---------------------------
const verificationEmailTemplate = (name, verifyUrl) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
    <p style="color: #4b5563; line-height: 1.7;">Hi ${name},</p>
    <p style="color: #4b5563; line-height: 1.7;">
      Thanks for creating an account with ${academyName}! Please verify your email address
      by clicking the button below.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="${buttonStyle}">Verify Email</a>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">
      This link expires in 24 hours. If you didn't create an account, you can ignore this email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
      Link: ${verifyUrl}
    </p>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// WELCOME EMAIL
// ---------------------------
const welcomeEmailTemplate = (name) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}! 🎉</h2>
    <p style="color: #4b5563; line-height: 1.7;">
      Your email has been verified. You're all set to explore our courses and start your tech journey!
    </p>
    <p style="color: #4b5563; line-height: 1.7;">Here's what you can do next:</p>
    <ul style="color: #4b5563; line-height: 2;">
      <li>Browse our offline and online courses</li>
      <li>Enrol in a programme that suits your goals</li>
      <li>Get certified and land your dream tech role</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/courses" style="${buttonStyle}">Browse Courses</a>
    </div>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// PURCHASE CONFIRMATION
// ---------------------------
const purchaseConfirmationTemplate = (name, order) => {
  const courseRows = order.courses
    .map(
      (c) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${c.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">
            ₦${Number(c.price).toLocaleString()}
          </td>
        </tr>`
    )
    .join("");

  return `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Payment Confirmed ✅</h2>
    <p style="color: #4b5563;">Hi ${name},</p>
    <p style="color: #4b5563; line-height: 1.7;">
      Your payment has been received and your enrolment is confirmed! Here's a summary:
    </p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="color: #6b7280; margin: 0 0 5px;">
        <strong>Reference:</strong> ${order.paystackReference}
      </p>
      <p style="color: #6b7280; margin: 0;">
        <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 10px; text-align: left; color: #374151;">Course</th>
          <th style="padding: 10px; text-align: right; color: #374151;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${courseRows}
        <tr style="background: #eef2ff;">
          <td style="padding: 12px; font-weight: bold; color: #4f46e5;">Total</td>
          <td style="padding: 12px; font-weight: bold; text-align: right; color: #4f46e5;">
            ₦${Number(order.totalAmount).toLocaleString()}
          </td>
        </tr>
      </tbody>
    </table>
    <p style="color: #4b5563; line-height: 1.7;">
      Your admission letter will be sent shortly as a separate email with a PDF attachment.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/dashboard" style="${buttonStyle}">Go to Dashboard</a>
    </div>
  </div>
  ${footerHTML}
</div>
`;
};

// ---------------------------
// ADMISSION LETTER EMAIL
// ---------------------------
const admissionLetterEmailTemplate = (name) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Your Admission Letter 🎓</h2>
    <p style="color: #4b5563;">Dear ${name},</p>
    <p style="color: #4b5563; line-height: 1.7;">
      Congratulations! Your admission letter is attached to this email as a PDF.
      Please download and keep it for your records.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #166534; margin: 0;">
        📎 <strong>Attachment:</strong> Admission_Letter_${name.replace(/\s+/g, "_")}.pdf
      </p>
    </div>
    <p style="color: #4b5563; line-height: 1.7;">
      Please present this letter on your first day. If you have questions,
      don't hesitate to reach out.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/dashboard" style="${buttonStyle}">View Dashboard</a>
    </div>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// CERTIFICATE EMAIL ✅ NEW
// ---------------------------
const certificateEmailTemplate = (user, course, certificate) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1e1b4b; margin-top: 0;">🎓 Congratulations, ${user.name}!</h2>
    <p style="color: #4b5563; line-height: 1.7;">
      We are proud to inform you that you have successfully completed the course
      and your certificate has been issued. Please find your certificate attached
      to this email.
    </p>

    <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 13px; color: #6366f1; font-weight: bold; letter-spacing: 1px; margin: 0 0 8px;">
        CERTIFICATE NO: ${certificate.certificateNumber}
      </p>
      <p style="font-size: 18px; color: #1e1b4b; font-weight: bold; margin: 0 0 8px;">
        ${course.title}
      </p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Issued on ${new Date(certificate.issuedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>

    <p style="color: #4b5563; line-height: 1.7;">
      You can verify your certificate online using the certificate number above.
      Share your achievement with the world!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${process.env.CLIENT_URL}/certificate/${certificate.certificateNumber}"
        style="${buttonStyle}"
      >
        View Certificate Online
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px;">
      Your certificate PDF is also attached to this email for your records.
    </p>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// CONTACT CONFIRMATION
// ---------------------------
const contactConfirmationTemplate = (contact) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">We Received Your Message 📩</h2>
    <p style="color: #4b5563;">Hi ${contact.name},</p>
    <p style="color: #4b5563; line-height: 1.7;">
      Thank you for reaching out! We've received your message and will get back
      to you within 24-48 hours.
    </p>
    <div style="background: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0;">
      <p style="color: #6b7280; margin: 0 0 5px;">
        <strong>Subject:</strong> ${contact.subject}
      </p>
      <p style="color: #6b7280; margin: 0; font-style: italic;">"${contact.message}"</p>
    </div>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// ADMIN CONTACT NOTIFICATION
// ---------------------------
const adminContactNotificationTemplate = (contact) => `
<div style="${baseStyles}">
  <div style="background: #dc2626; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
  </div>
  <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p><strong>Name:</strong> ${contact.name}</p>
    <p><strong>Email:</strong> ${contact.email}</p>
    <p><strong>Subject:</strong> ${contact.subject}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left: 3px solid #4f46e5; padding-left: 12px; color: #555; margin: 10px 0;">
      ${contact.message}
    </blockquote>
    <p style="color: #999; font-size: 12px;">Received: ${new Date().toLocaleString()}</p>
  </div>
</div>
`;

// ---------------------------
// PASSWORD RESET
// ---------------------------
const passwordResetTemplate = (name, resetUrl) => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #4b5563;">Hi ${name},</p>
    <p style="color: #4b5563; line-height: 1.7;">
      You requested a password reset. Click the button below to set a new password.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">
      This link expires in 30 minutes. If you didn't request this, please ignore this email.
    </p>
    <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
      Link: ${resetUrl}
    </p>
  </div>
  ${footerHTML}
</div>
`;

// ---------------------------
// NEWSLETTER CONFIRMATION
// ---------------------------
const newsletterConfirmationTemplate = () => `
<div style="${baseStyles}">
  ${headerHTML}
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">You're Subscribed! 🎉</h2>
    <p style="color: #4b5563; line-height: 1.7;">
      You've been successfully subscribed to the ${academyName} newsletter.
      You'll receive updates on new courses, events, and tech news.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/courses" style="${buttonStyle}">Explore Courses</a>
    </div>
  </div>
  ${footerHTML}
</div>
`;

// ✅ Single export
module.exports = {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  purchaseConfirmationTemplate,
  admissionLetterEmailTemplate,
  certificateEmailTemplate,
  contactConfirmationTemplate,
  adminContactNotificationTemplate,
  passwordResetTemplate,
  newsletterConfirmationTemplate,
};