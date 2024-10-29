import User, { IUser, matchPassword } from "../../../models/UserModel"; // Utiliser l'importation ES6
import {
  generateMailToken,
  sendNewEmailVerification,
  sendPasswordChangeConfirmation,
} from "../../../services/emailService";
import { NextFunction, Request, Response } from "express";
import AppError from "../../../utils/appError";

const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Vérifiez d'abord si req.user est défini
  if (!req.user) {
    return next(new AppError("User not authenticated", 401));
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return next(new AppError("Server error while fetching user profile", 500));
  }
};

const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Typage des paramètres
  const {
    oldPassword,
    newPassword,
  }: { oldPassword: string; newPassword: string } = req.body; // Typage de la destructuration

  // Assurez-vous que les mots de passe sont fournis
  if (!oldPassword || !newPassword) {
    return next(new AppError("Both passwords are required", 400)); // Utilisation de la classe d'erreur personnalisée
  }

  try {
    // Trouver l'utilisateur à partir du token
    const user = await User.findById(req.user?.id); // Assurez-vous que req.user.id existe
    if (!user) {
      return next(new AppError("User not found", 404)); // Utilisation de la classe d'erreur personnalisée
    }

    // Vérifier si l'ancien mot de passe est correct
    const match = await matchPassword(user, oldPassword);
    if (!match) {
      return next(new AppError("Old password is incorrect", 401)); // Utilisation de la classe d'erreur personnalisée
    }

    // Mettre à jour le mot de passe
    user.password = newPassword; // Assurez-vous que vous avez une méthode pour cela
    user.tokenVersion += 1;
    await user.save();

    // Envoyer un email de confirmation de changement de mot de passe
    await sendPasswordChangeConfirmation(user.email);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error); // Log d'erreur pour le débogage
    return next(new AppError("Server error while updating password", 500)); // Utilisation de la classe d'erreur personnalisée
  }
};

const updateName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, name } = req.body;

  if (!email || !name) {
    return next(new AppError("Email and name fields are required", 400));
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { name },
      { new: true, runValidators: true }
    ).select("-password -_id");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({ message: "Name updated successfully", user });
  } catch (error) {
    console.error("Error updating user name:", error);
    return next(new AppError("Error updating user name", 500));
  }
};

const changeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { newEmail } = req.body;

  // Vérifiez que l'utilisateur est authentifié
  const user = req.user ?? ({} as IUser);

  try {
    // Vérifiez si l'e-mail est déjà pris
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new AppError("Email already in use", 400)); // Utilisation de la classe d'erreur personnalisée
    }

    // Générer un token de validation
    const newEmailToken = generateMailToken();
    user.newEmail = newEmail;
    user.newEmailToken = newEmailToken;
    user.newEmailVerified = false; // À valider par l'utilisateur
    user.newEmailTokenExpires = new Date(Date.now() + 3600000); // Expires in 1 hour
    await user.save();

    // Envoyer l'e-mail de validation
    await sendNewEmailVerification(newEmail, newEmailToken);

    res
      .status(200)
      .json({ message: "Verification email sent to new email address" });
  } catch (error) {
    console.error("Error changing email:", error); // Log d'erreur pour le débogage
    return next(new AppError("Error changing email", 500)); // Utilisation de la classe d'erreur personnalisée
  }
};

const verifyNewEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token, email } = req.query;

  // Vérification de la présence du token et de l'email
  if (!token || !email) {
    return next(new AppError("Token and email are required.", 400));
  }

  try {
    // Trouver l'utilisateur avec la nouvelle adresse e-mail et le token
    const user = await User.findOne({
      newEmail: email,
      newEmailToken: token,
      newEmailTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired token.", 400));
    }

    // Valider la nouvelle adresse e-mail
    user.email = user.newEmail ?? user.email; // Met à jour l'adresse e-mail principale
    user.newEmail = null; // Supprime la nouvelle adresse e-mail temporaire
    user.newEmailToken = null; // Supprime le token de validation
    user.newEmailTokenExpires = null; // Supprime l'expiration du token
    user.newEmailVerified = true; // Indique que l'e-mail a été vérifié
    await user.save();

    res.status(200).json({ message: "Email update confirmed successfully." });
  } catch (error) {
    console.error("Error verifying new email:", error);
    return next(new AppError("Server error. Please try again later.", 500));
  }
};

export {
  getUserProfile,
  updatePassword,
  updateName,
  changeEmail,
  verifyNewEmail,
};
