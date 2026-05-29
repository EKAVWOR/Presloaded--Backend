// server/services/pdfService.js
const PDFDocument = require("pdfkit");
const { formatPrice, formatDate } = require("../utils/helpers");

// ============================================================
// EXISTING — Admission Letter (unchanged)
// ============================================================
const generateAdmissionLetter = (user, order, courses) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const academyName = process.env.ACADEMY_NAME || "Tech Academy";
      const academyAddress = process.env.ACADEMY_ADDRESS || "";
      const academyEmail = process.env.ACADEMY_EMAIL || "";
      const academyPhone = process.env.ACADEMY_PHONE || "";

      doc
        .fillColor("#4f46e5")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(academyName, { align: "center" });

      doc
        .fontSize(10)
        .fillColor("#666666")
        .font("Helvetica")
        .text(academyAddress, { align: "center" })
        .text(`${academyEmail} | ${academyPhone}`, { align: "center" });

      doc.moveDown(0.5);

      doc
        .strokeColor("#4f46e5")
        .lineWidth(2)
        .moveTo(60, doc.y)
        .lineTo(535, doc.y)
        .stroke();

      doc.moveDown(1.5);

      doc
        .fontSize(10)
        .fillColor("#333333")
        .font("Helvetica")
        .text(`Date: ${formatDate(new Date())}`, { align: "right" });

      doc.text(`Ref: ${order.paystackReference || order._id}`, { align: "right" });

      doc.moveDown(1.5);

      doc
        .fontSize(20)
        .fillColor("#4f46e5")
        .font("Helvetica-Bold")
        .text("LETTER OF ADMISSION", { align: "center" });

      doc.moveDown(1.5);

      doc
        .fontSize(12)
        .fillColor("#333333")
        .font("Helvetica")
        .text(`Dear ${user.name},`);

      doc.moveDown(0.8);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          `We are delighted to inform you that your application and payment for the following course(s) at ${academyName} have been received and approved.`,
          { lineGap: 4 }
        );

      doc.moveDown(1);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text("Enrolled Course(s):");

      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.rect(60, tableTop, 475, 25).fill("#f3f4f6");

      doc
        .fontSize(10)
        .fillColor("#333333")
        .font("Helvetica-Bold")
        .text("S/N", 70, tableTop + 7, { width: 30 })
        .text("Course Title", 110, tableTop + 7, { width: 250 })
        .text("Amount", 370, tableTop + 7, { width: 100, align: "right" });

      let rowY = tableTop + 30;

      courses.forEach((course, i) => {
        if (i % 2 === 0) {
          doc.rect(60, rowY - 5, 475, 22).fill("#fafafa");
        }

        doc
          .fontSize(10)
          .fillColor("#333333")
          .font("Helvetica")
          .text(`${i + 1}`, 70, rowY, { width: 30 })
          .text(course.title, 110, rowY, { width: 250 })
          .text(formatPrice(course.price), 370, rowY, { width: 100, align: "right" });

        rowY += 22;
      });

      doc.rect(60, rowY - 3, 475, 25).fill("#e0e7ff");

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text("Total Paid:", 110, rowY + 3, { width: 250 })
        .text(formatPrice(order.totalAmount), 370, rowY + 3, { width: 100, align: "right" });

      doc.y = rowY + 40;

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text("Student Details:");

      doc.moveDown(0.5);

      const details = [
        ["Name", user.name],
        ["Email", user.email],
        ["Phone", user.phone || "N/A"],
        ["Payment Ref", order.paystackReference || order._id.toString()],
        ["Payment Date", formatDate(order.createdAt)],
      ];

      details.forEach(([label, value]) => {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#555555")
          .text(`${label}: `, { continued: true })
          .font("Helvetica")
          .fillColor("#333333")
          .text(value);
        doc.moveDown(0.2);
      });

      doc.moveDown(1);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text("Important Information:");

      doc.moveDown(0.5);

      const infos = [
        "Please present this letter on your first day of training.",
        "Arrive at least 30 minutes before the scheduled start time.",
        "Bring a valid ID and a laptop (if applicable).",
        "Contact us if you have any questions or require special arrangements.",
      ];

      infos.forEach((info) => {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#333333")
          .text(`•  ${info}`, { lineGap: 3 });
      });

      doc.moveDown(1.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#333333")
        .text(
          "We look forward to welcoming you and wish you a rewarding learning experience.",
          { lineGap: 4 }
        );

      doc.moveDown(1.5);

      doc.font("Helvetica").text("Warm regards,");
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fillColor("#4f46e5").text("The Admissions Team");
      doc.font("Helvetica").fillColor("#333333").text(academyName);

      const footerY = doc.page.height - 80;
      doc
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .moveTo(60, footerY)
        .lineTo(535, footerY)
        .stroke();

      doc
        .fontSize(8)
        .fillColor("#999999")
        .text(
          `This is a computer-generated document. | ${academyName} | ${academyEmail}`,
          60,
          footerY + 10,
          { align: "center", width: 475 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================================
// NEW — Course Completion Certificate
// ============================================================
const generateCertificate = (user, course, { certificateNumber, completedAt }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape", // ✅ Landscape for certificate
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const academyName = process.env.ACADEMY_NAME || "Tech Academy";
      const academyEmail = process.env.ACADEMY_EMAIL || "";
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ===== Background =====
      doc.rect(0, 0, pageWidth, pageHeight).fill("#fafafa");

      // ===== Outer Border =====
      doc
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .lineWidth(3)
        .strokeColor("#4f46e5")
        .stroke();

      // ===== Inner Border =====
      doc
        .rect(28, 28, pageWidth - 56, pageHeight - 56)
        .lineWidth(1)
        .strokeColor("#a5b4fc")
        .stroke();

      // ===== Top Accent Bar =====
      doc
        .rect(20, 20, pageWidth - 40, 8)
        .fill("#4f46e5");

      // ===== Bottom Accent Bar =====
      doc
        .rect(20, pageHeight - 28, pageWidth - 40, 8)
        .fill("#4f46e5");

      // ===== Academy Name =====
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text(academyName.toUpperCase(), 0, 55, {
          align: "center",
          width: pageWidth,
          characterSpacing: 3,
        });

      // ===== Certificate Title =====
      doc
        .fontSize(36)
        .font("Helvetica-Bold")
        .fillColor("#1e1b4b")
        .text("CERTIFICATE", 0, 95, { align: "center", width: pageWidth });

      doc
        .fontSize(16)
        .font("Helvetica")
        .fillColor("#6366f1")
        .text("OF COMPLETION", 0, 138, {
          align: "center",
          width: pageWidth,
          characterSpacing: 4,
        });

      // ===== Divider =====
      const dividerY = 170;
      doc
        .moveTo(pageWidth / 2 - 100, dividerY)
        .lineTo(pageWidth / 2 + 100, dividerY)
        .strokeColor("#a5b4fc")
        .lineWidth(1)
        .stroke();

      // ===== Presented To =====
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text("This is to certify that", 0, 188, {
          align: "center",
          width: pageWidth,
        });

      // ===== Student Name =====
      doc
        .fontSize(32)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text(user.name, 0, 210, { align: "center", width: pageWidth });

      // ===== Underline Name =====
      const nameWidth = Math.min(user.name.length * 16, 400);
      const nameX = (pageWidth - nameWidth) / 2;
      doc
        .moveTo(nameX, 248)
        .lineTo(nameX + nameWidth, 248)
        .strokeColor("#4f46e5")
        .lineWidth(1)
        .stroke();

      // ===== Completion Text =====
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text("has successfully completed the course", 0, 260, {
          align: "center",
          width: pageWidth,
        });

      // ===== Course Title =====
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor("#1e1b4b")
        .text(course.title, 80, 282, {
          align: "center",
          width: pageWidth - 160,
        });

      // ===== Instructor =====
      if (course.instructor) {
        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor("#6b7280")
          .text(`Instructor: ${course.instructor}`, 0, 320, {
            align: "center",
            width: pageWidth,
          });
      }

      // ===== Bottom Section =====
      const bottomY = pageHeight - 120;

      // Date (left)
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text("DATE OF COMPLETION", 80, bottomY, { width: 180, align: "center" });

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#4f46e5")
        .text(formatDate(completedAt), 80, bottomY + 18, { width: 180, align: "center" });

      doc
        .moveTo(80, bottomY + 40)
        .lineTo(260, bottomY + 40)
        .strokeColor("#d1d5db")
        .lineWidth(1)
        .stroke();

      // Academy Seal (center)
      const sealX = pageWidth / 2;
      const sealY = bottomY + 10;

      doc
        .circle(sealX, sealY, 30)
        .lineWidth(2)
        .strokeColor("#4f46e5")
        .stroke();

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text(academyName.toUpperCase(), sealX - 25, sealY - 8, { width: 50, align: "center" });

      doc
        .fontSize(6)
        .font("Helvetica")
        .fillColor("#6366f1")
        .text("VERIFIED", sealX - 15, sealY + 2, { width: 30, align: "center" });

      // Director signature (right)
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text("AUTHORIZED SIGNATURE", pageWidth - 260, bottomY, {
          width: 180,
          align: "center",
        });

      doc
        .moveTo(pageWidth - 260, bottomY + 40)
        .lineTo(pageWidth - 80, bottomY + 40)
        .strokeColor("#d1d5db")
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(`Director, ${academyName}`, pageWidth - 260, bottomY + 46, {
          width: 180,
          align: "center",
        });

      // ===== Certificate Number =====
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text(
          `Certificate No: ${certificateNumber} | Verify at: ${academyEmail}`,
          0,
          pageHeight - 42,
          { align: "center", width: pageWidth }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateAdmissionLetter, generateCertificate };