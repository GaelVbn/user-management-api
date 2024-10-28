// emailService.ts
import nodemailer from "nodemailer";
import crypto from "crypto";

const generateMailToken = () => crypto.randomBytes(32).toString("hex");

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fonction générique pour envoyer des emails
const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

// Fonction pour envoyer un email de vérification
const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}&email=${email}`;
  const htmlContent = `<p>Click on the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`;
  await sendEmail(email, "Please verify your email", htmlContent);
};

// Fonction pour envoyer un email de confirmation après changement de mot de passe
const sendPasswordChangeConfirmation = async (email: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Password Has Been Changed",
    html: `<p>Your password was recently updated. If you did not make this change, please contact support immediately.</p>`,
  };
  await transporter.sendMail(mailOptions);
};

// Fonction pour envoyer un email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}&email=${email}`;
  const htmlContent = `<p>Click on the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`;
  await sendEmail(email, "Password Reset Request", htmlContent);
};

export {
  generateMailToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
};
