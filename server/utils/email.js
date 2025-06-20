// src/utils/email.js
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { log } from "./logger.js";

export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const USER_NAME = process.env.USER_NAME || "KnowBloom Team";
const LOGO_URL = "https://knowbloom.onrender.com/logo.png";

// create a single Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // helpful in dev
  },
});

// verify SMTP connection on startup
transporter.verify((err) => {
  if (err) console.error("SMTP connection error:", err);
  else log("SMTP ready to send messages");
});

// ──────────────────────────────────────────────────────────────────────────────
//                                   TEMPLATES
// ──────────────────────────────────────────────────────────────────────────────

const otpTemplate = (userName, otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>OTP Verification</title></head>
<body style="background:#f4f6fb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(30,58,138,0.09);margin:40px 0;">
        <tr><td align="center" style="padding:36px 0 18px;">
         <img
  src="${LOGO_URL}"
  width="300"
  height="300"
  alt="Logo"
  style="
    display:block;
    margin:0 auto 18px;
    width:300px;
    height:auto;
    border-radius:12px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
  "
/>

          <h2 style="margin:0;font-family:'Segoe UI',Arial,sans-serif;color:#1e3a8a;font-weight:700;font-size:22px;letter-spacing:0.5px;">
            Welcome to KnowBloom Platform!
          </h2>
        </td></tr>
        <tr><td style="padding:0 36px 28px;font-family:'Segoe UI',Arial,sans-serif;color:#222;font-size:16px;">
          <p style="margin:0 0 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="margin:0 0 16px;">Thank you for signing up! Please use the OTP below to verify your email address:</p>
          <p style="text-align:center;margin:28px 0;">
            <span style="display:inline-block;font-size:28px;letter-spacing:10px;background:#e0e7ff;padding:14px 32px;border-radius:8px;color:#2563eb;font-weight:700;box-shadow:0 1px 4px rgba(30,58,138,0.07);border:1px solid #dbeafe;">
              ${otp}
            </span>
          </p>
          <p style="margin:0 0 16px;color:#666;">This OTP will expire in 30 seconds. If you didn't request this, please ignore this email.</p>
          <p style="margin:30px 0 0;color:#1e293b;">Cheers,<br>The KnowBloom Team</p>
        </td></tr>
        <tr><td style="padding:22px 36px 0;font-size:12px;color:#94a3b8;text-align:center;">
          Questions? <a href="mailto:knowbloom.team@gmail.com" style="color:#2563eb;text-decoration:none;">knowbloom.team@gmail.com</a>
          <br><br>&copy; ${new Date().getFullYear()} KnowBloom Team. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const passwordResetTemplate = (userName, otp, resetLink) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Reset Your Password</title></head>
<body style="background:#f4f6fb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(30,58,138,0.09);margin:40px 0;">
        <tr><td align="center" style="padding:36px 0 18px;">
          <img
  src="${LOGO_URL}"
  width="300"
  height="300"
  alt="Logo"
  style="
    display:block;
    margin:0 auto 18px;
    width:300px;
    height:auto;
    border-radius:12px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
  "
/>

          <h2 style="margin:0;font-family:'Segoe UI',Arial,sans-serif;color:#1e3a8a;font-weight:700;font-size:22px;letter-spacing:0.5px;">
            Reset Your Password
          </h2>
        </td></tr>
        <tr><td style="padding:0 36px 28px;font-family:'Segoe UI',Arial,sans-serif;color:#222;font-size:16px;">
          <p style="margin:0 0 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="margin:0 0 14px;">We received a request to reset your password.</p>
          <p style="margin:0 0 14px;">Click the button below to reset your password:</p>
          <p style="text-align:center;margin:18px 0;">
            <a href="${resetLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:13px 36px;border-radius:8px;display:inline-block;font-size:16px;font-weight:600;box-shadow:0 1px 4px rgba(37,99,235,0.07);">
              Reset Password
            </a>
          </p>
          <p style="margin:0 0 16px;color:#666;">This OTP will expire in 30 seconds. If you didn't request this, you can safely ignore this email.</p>
          <p style="margin:30px 0 0;color:#1e293b;">Regards,<br>The KnowBloom Team</p>
        </td></tr>
        <tr><td style="padding:22px 36px 0;font-size:12px;color:#94a3b8;text-align:center;">
          Questions? <a href="mailto:knowbloom.team@gmail.com" style="color:#2563eb;text-decoration:none;">knowbloom.team@gmail.com</a>
          <br><br>&copy; ${new Date().getFullYear()} KnowBloom Team. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// invoice PDF generator
function generateInvoicePDF({
  invoiceNumber,
  purchaseDate,
  userName,
  courseTitle,
  amountPaid,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // HEADER
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor("#333333")
        .text("KnowBloom Academy", { align: "left" });
      doc
        .strokeColor("#dddddd")
        .lineWidth(1)
        .moveTo(50, 100)
        .lineTo(545, 100)
        .stroke();

      // BILL TO & DETAILS
      const detailsTop = 120;
      doc
        .fontSize(10)
        .fillColor("#333333")
        .font("Helvetica-Bold")
        .text("Bill To:", 50, detailsTop);
      doc.font("Helvetica").text(userName, 50, detailsTop + 15);

      doc
        .font("Helvetica-Bold")
        .text("Invoice #:", 350, detailsTop)
        .font("Helvetica")
        .text(invoiceNumber, 420, detailsTop);
      doc
        .text("Date:", 350, detailsTop + 15)
        .text(purchaseDate, 420, detailsTop + 15);

      doc
        .strokeColor("#dddddd")
        .lineWidth(1)
        .moveTo(50, detailsTop + 50)
        .lineTo(545, detailsTop + 50)
        .stroke();

      // TABLE HEADER
      const tableTop = detailsTop + 70;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#333333")
        .text("Description", 50, tableTop)
        .text("Qty", 300, tableTop, { width: 50, align: "right" })
        .text("Unit Price (₹)", 350, tableTop, { width: 100, align: "right" })
        .text("Amount (₹)", 450, tableTop, { width: 100, align: "right" });
      doc
        .strokeColor("#bbbbbb")
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      // ROW
      const rowTop = tableTop + 25;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#555555")
        .text(courseTitle, 50, rowTop)
        .text("1", 300, rowTop, { width: 50, align: "right" })
        .text(amountPaid.toFixed(2), 350, rowTop, {
          width: 100,
          align: "right",
        })
        .text(amountPaid.toFixed(2), 450, rowTop, {
          width: 100,
          align: "right",
        });
      doc
        .strokeColor("#dddddd")
        .lineWidth(1)
        .moveTo(50, rowTop + 20)
        .lineTo(545, rowTop + 20)
        .stroke();

      // TOTALS
      const subtotalTop = rowTop + 40;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#333333")
        .text("Subtotal", 350, subtotalTop, { width: 100, align: "right" })
        .text(amountPaid.toFixed(2), 450, subtotalTop, {
          width: 100,
          align: "right",
        });
      doc
        .fontSize(12)
        .text("Total", 350, subtotalTop + 20, { width: 100, align: "right" })
        .text(amountPaid.toFixed(2), 450, subtotalTop + 20, {
          width: 100,
          align: "right",
        });

      // FOOTER
      const footerTop = subtotalTop + 60;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#777777")
        .text(
          "If you have any questions about this invoice, please contact us at:",
          50,
          footerTop,
          { align: "center", width: 495 }
        )
        .moveDown(0.5)
        .text("knowbloom.team@gmail.com | +91-70430-41962", {
          align: "center",
          width: 495,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────────
//                              SEND FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

export async function sendOtpEmail(email, otp, userName = "User") {
  const mailOptions = {
    from: `${USER_NAME} <${EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Hello ${userName},\n\nYour OTP code is ${otp}. It expires in 30 seconds.`,
    html: otpTemplate(userName, otp),
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(
  email,
  resetLink,
  otp,
  userName = "User"
) {
  const mailOptions = {
    from: `${USER_NAME} <${EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    text: `Hello ${userName},\n\nYou requested a password reset.\nReset link: ${resetLink}`,
    html: passwordResetTemplate(userName, otp, resetLink),
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPurchaseConfirmationEmail({
  toEmail,
  userName,
  courseTitle,
  amountPaid,
  invoiceNumber,
  purchaseDate,
}) {
  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber,
    purchaseDate,
    userName,
    courseTitle,
    amountPaid,
  });

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Congrats on Enrolling!</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
        <tr><td style="background:#1e3a8a;padding:24px 0;text-align:center;border-radius:12px 12px 0 0;">
                 <img
  src="${LOGO_URL}"
  width="300"
  height="300"
  alt="Logo"
  style="
    display:block;
    margin:0 auto 18px;
    width:300px;
    height:auto;
    border-radius:12px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
  "
/>

          <h1 style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:26px;color:#fff;font-weight:700;letter-spacing:1px;">
            🎉 Welcome to KnowBloom Academy!
          </h1>
        </td></tr>
        <tr><td style="background:#fff;padding:34px 38px 32px 38px;font-family:'Segoe UI',Arial,sans-serif;color:#222;border-bottom:1px solid #eaeaea;">
          <p style="margin:0 0 18px;font-size:17px;line-height:1.6;">Hi <strong>${userName}</strong>,</p>
          <p style="margin:0 0 18px;font-size:17px;line-height:1.6;">
            Congratulations on enrolling in <strong>${courseTitle}</strong>! We’re thrilled to have you on board.
          </p>
          <p style="margin:0 0 26px;font-size:17px;line-height:1.6;">
            Please find your invoice attached as a PDF.
          </p>
          <p style="margin:28px 0 0;font-size:17px;line-height:1.6;">
            Happy learning!<br/><span style="color:#2563eb;">The KnowBloom Team</span>
          </p>
        </td></tr>
        <tr><td style="background:#f4f6fb;padding:22px 38px;font-family:'Segoe UI',Arial,sans-serif;color:#94a3b8;font-size:13px;text-align:center;border-radius:0 0 12px 12px;">
          <p style="margin:0;">Need help? Contact us at <a href="mailto:knowbloom.team@gmail.com" style="color:#2563eb;text-decoration:none;">knowbloom.team@gmail.com</a></p>
          <p style="margin:10px 0 0;">&copy; ${new Date().getFullYear()} KnowBloom Academy. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  await transporter.sendMail({
    from: `${USER_NAME} <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Invoice for ${courseTitle} Enrollment`,
    text: `Hi ${userName}, your invoice is attached.`,
    html: htmlTemplate,
    attachments: [{ filename: "invoice.pdf", content: pdfBuffer }],
  });
}

export async function sendCourseInformationEmail({
  toEmail,
  userName,
  courseTitle,
  infoHtml,
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Course Update</title></head>
<body style="background:#f4f6fb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(30,58,138,0.09);margin:40px 0;">
        <tr><td align="center" style="padding:32px 0 12px;">
              <img
  src="${LOGO_URL}"
  width="300"
  height="300"
  alt="Logo"
  style="
    display:block;
    margin:0 auto 18px;
    width:300px;
    height:auto;
    border-radius:12px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
  "
/>

          <h2 style="margin:0;font-family:'Segoe UI',Arial,sans-serif;color:#1e3a8a;font-weight:700;font-size:22px;letter-spacing:0.5px;">
            Course Update
          </h2>
        </td></tr>
        <tr><td style="padding:0 32px 28px;font-family:'Segoe UI',Arial,sans-serif;color:#222;font-size:16px;">
          <p style="margin:0 0 16px;">Hi <strong>${userName}</strong>,</p>
          ${infoHtml}
          <p style="margin:30px 0 0;color:#1e293b;">Regards,<br/>The KnowBloom Team</p>
        </td></tr>
        <tr><td style="padding:20px 32px 0;font-size:12px;color:#94a3b8;text-align:center;">
          Questions? <a href="mailto:knowbloom.team@gmail.com" style="color:#2563eb;text-decoration:none;">knowbloom.team@gmail.com</a>
          <br><br>&copy; ${new Date().getFullYear()} KnowBloom Team. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  await transporter.sendMail({
    from: `${USER_NAME} <${EMAIL_USER}>`,
    to: toEmail,
    subject: `Update on your course: ${courseTitle}`,
    html,
  });
}

export async function sendContactEmail({ name, email, message }) {
  const mailOptions = {
    // Send from your verified Gmail account (not spoofing the user's address)
    from: `"KnowBloom Website" <${EMAIL_USER}>`,
    // When you click “Reply” in your inbox, it will go to the user’s email
    replyTo: `"${name}" <${email}>`,
    to: "knowbloom.team@gmail.com",
    subject: `Contact Form Submission from ${name}`,

    // Plain-text fallback
    text: `Hello KnowBloom Team,

You have received a new message from ${name} (${email}):

${message}

—
Sent via KnowBloom Contact Form`,

    // HTML body
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height:1.5; color: #333;">
        <p>Hello KnowBloom Team,</p>
        <p>
          You have received a new message via the contact form on your website:
        </p>
        <table cellpadding="4" cellspacing="0" style="border:1px solid #ddd; margin:10px 0;">
          <tr>
            <td><strong>Name:</strong></td>
            <td>${name}</td>
          </tr>
          <tr>
            <td><strong>Email:</strong></td>
            <td><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td valign="top"><strong>Message:</strong></td>
            <td>${message.replace(/\n/g, "<br/>")}</td>
          </tr>
        </table>
        <p>Regards,<br/>KnowBloom Website</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}