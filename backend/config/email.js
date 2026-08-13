const nodemailer = require("nodemailer");

// Payments and file storage each get their own small config module that
// degrades gracefully when unconfigured (see stripe.js, cloudinary.js) -
// email follows the same pattern. When SMTP credentials are present, real
// mail goes out. When they're not, the email content is logged to the
// console instead so local development and demos never require a mail
// provider to exercise the password-reset flow end to end.
const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Sends an email, or logs it to the console if SMTP isn't configured.
 * @param {{to: string, subject: string, html: string, text?: string}} opts
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log("\n========== EMAIL (SMTP not configured - logging instead) ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html.replace(/<[^>]+>/g, " "));
    console.log("=====================================================================\n");
    return { mocked: true };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || '"Affiliate Marketplace Pro" <no-reply@marketplacepro.test>',
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendEmail, isEmailConfigured: isConfigured };
