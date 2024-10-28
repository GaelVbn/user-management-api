import User, { IUser, matchPassword } from "../../models/UserModel"; // Utiliser l'importation ES6
import crypto from "crypto";
import jwt from "jsonwebtoken"; // Importation ES6
import bcrypt from "bcryptjs"; // Importation ES6
import { Request, Response } from "express"; // Importation des types Request et Response
import nodemailer from "nodemailer";
import {
  generateMailToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../services/emailService";
import dotenv from "dotenv";
dotenv.config();

// Générer un token JWT
function generateToken(id: string, user: IUser): string {
  // Typage du paramètre et du retour
  return jwt.sign(
    { id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
}

const registerUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const {
    name,
    email,
    password,
    role,
  }: { name: string; email: string; password: string; role?: string } =
    req.body; // Typage de la destructuration

  if (!name || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Invalid email format" });
    return;
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  //Générer un mailToken pour la vérification
  const mailToken = generateMailToken();

  // Vérifier que le rôle est valide
  const validRoles = ["user", "admin"];
  const userRole = validRoles.includes(role!) ? role : "user"; // `!` pour indiquer que `role` peut être undefined

  const user: IUser = await User.create({
    name,
    email,
    password,
    role: userRole,
    isVerified: false,
    mailToken,
  });

  // Envoyer l'email de vérification
  await sendVerificationEmail(email, mailToken);

  if (user) {
    res.status(201).json({
      name: user.name,
      email: user.email,
      message: "User registered. Please verify your email.",
      token: generateToken(user._id.toString(), user), // Convertir en chaîne de caractères
    });
    return;
  } else {
    res.status(400).json({ message: "Invalid user data" });
    return;
  }
};

// Contrôleur verifyEmail
const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token, email } = req.query;

  try {
    const user = await User.findOne({ email, mailToken: token });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Vérifiez et activez l'utilisateur
    user.isVerified = true;
    user.mailToken = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Connexion utilisateur
const loginUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const { email, password }: { email: string; password: string } = req.body; // Typage de la destructuration

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  if (!password) {
    res.status(400).json({ message: "Password is required" });
    return;
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString(), user), // Convertir en chaîne de caractères
    });
    return;
  } else {
    res.status(401).json({ message: "Email or password is incorrect" });
    return;
  }
};

// mot de passe oublié
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Vérifiez si l'utilisateur existe
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Générer un token de réinitialisation
  const resetToken = generateMailToken();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure d'expiration
  await user.save();

  // Utiliser le service d'email pour envoyer l'email de réinitialisation
  try {
    await sendPasswordResetEmail(email, resetToken);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, email, newPassword } = req.body;

  // Vérifiez que tous les paramètres sont fournis
  if (!token || !email || !newPassword) {
    res
      .status(400)
      .json({ message: "Token, email and new password are required." });
    return;
  }

  // Trouvez l'utilisateur à partir de l'email
  const user = await User.findOne({
    email,
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400).json({ message: "Invalid or expired token" });
    return;
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  user.resetPasswordToken = undefined; // Invalider le token après utilisation
  user.resetPasswordExpires = undefined; // Invalider l'expiration
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully." });
};

export {
  registerUser,
  loginUser,
  generateToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
}; // Exportation des fonctions
