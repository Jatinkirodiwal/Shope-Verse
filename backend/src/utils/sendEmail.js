const nodemailer = require("nodemailer");

const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;
  const emailHost = (EMAIL_HOST || "").trim();

  if (!emailHost || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const isGmail = ["gmail", "google", "smtp.gmail.com"].includes(emailHost.toLowerCase());
  const password = isGmail ? EMAIL_PASS.replace(/\s/g, "") : EMAIL_PASS;

  if (isGmail && ["gmail", "google"].includes(emailHost.toLowerCase())) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: password
      }
    });
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: Number(EMAIL_PORT),
    secure: EMAIL_SECURE === "true",
    auth: {
      user: EMAIL_USER,
      pass: password
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "ShopVerse <no-reply@shopverse.local>",
    to,
    subject,
    text,
    html
  });

  if (info.message && !process.env.EMAIL_HOST) {
    console.log("Email transport is not configured. Generated email:", info.message.toString());
  }
};

module.exports = sendEmail;
