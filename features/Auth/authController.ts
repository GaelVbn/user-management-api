import User, { IUser } from "../../models/UserModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import {
  generateMailToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../services/emailService";
import AppError from "../../utils/appError";
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

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Typage des paramètres
    const {
      name,
      email,
      password,
      role,
    }: { name: string; email: string; password: string; role?: string } =
      req.body; // Typage de la destructuration

    if (!name || !email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError("Invalid email format", 400));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError("User already exists", 400));
    }

    // Générer un mailToken pour la vérification
    const mailToken = generateMailToken();

    // Vérifier que le rôle est valide
    const validRoles = ["user", "admin"];
    const userRole = validRoles.includes(role!) ? role : "user"; // `!` pour indiquer que `role` peut être undefined

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      isVerified: false,
      mailToken,
    });

    // Envoyer l'email de vérification
    await sendVerificationEmail(email, mailToken);

    // Répondre avec les détails de l'utilisateur et le message de confirmation
    res.status(201).json({
      name: user.name,
      email: user.email,
      message: "User registered. Please verify your email.",
      token: generateToken(user._id.toString(), user), // Convertir en chaîne de caractères
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token, email } = req.query;

  try {
    // Vérifiez que le token et l'email sont présents
    if (!token || !email) {
      return next(new AppError("Token and email are required", 400));
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email, mailToken: token });
    if (!user) {
      return next(new AppError("Invalid or expired token", 400));
    }

    // Vérifiez et activez l'utilisateur
    user.isVerified = true;
    user.mailToken = null; // Supprimez le token après vérification
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    // Passer l'erreur au middleware d'erreur
    next(error);
  }
};

const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Typage des paramètres
  const { email, password }: { email: string; password: string } = req.body;

  try {
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString(), user), // Convertir en chaîne de caractères
      });
    } else {
      return next(new AppError("Email or password is incorrect", 401));
    }
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  try {
    // Vérifiez si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Générer un token de réinitialisation
    const resetToken = generateMailToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure d'expiration
    await user.save();

    // Utiliser le service d'email pour envoyer l'email de réinitialisation
    await sendPasswordResetEmail(email, resetToken);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    // Gérer les erreurs, par exemple d'envoi d'email ou autres
    if (error instanceof AppError) {
      return next(error);
    }
    console.error("Error in forgotPassword:", error);
    next(new AppError("Failed to send password reset email", 500));
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token, email } = req.query;
  const { newPassword } = req.body;

  try {
    if (!token || !email || !newPassword) {
      return next(
        new AppError("Token, email, and new password are required.", 400)
      );
    }

    // Trouvez l'utilisateur à partir de l'email
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError("Invalid or expired token", 400));
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    next(new AppError("Server error while resetting password", 500));
  }
};

export {
  registerUser,
  loginUser,
  generateToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
