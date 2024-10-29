import User, { IUser, matchPassword } from "../../../models/UserModel"; // Utiliser l'importation ES6
import {
  generateMailToken,
  sendNewEmailVerification,
  sendPasswordChangeConfirmation,
} from "../../../services/emailService";
import { Request, Response } from "express"; // Importation des types Request et Response

// Typage de la fonction en tant que RequestHandler
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  // Vérifiez d'abord si req.user est défini
  if (!req.user) {
    res.status(401).json({ message: "User not authenticated" });
    return; // Sortir pour ne pas continuer à exécuter le code
  }

  const user = await User.findById(req.user.id); // Assurez-vous que req.user.id existe

  if (user) {
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    return;
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// UPDATE PASSWORD
const updatePassword = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const {
    oldPassword,
    newPassword,
  }: { oldPassword: string; newPassword: string } = req.body; // Typage de la destructuration

  // Assurez-vous que les mots de passe sont fournis
  if (!oldPassword || !newPassword) {
    res.status(400).json({ message: "Both passwords are required" });
    return;
  }

  // Trouver l'utilisateur à partir du token
  const user = await User.findById(req.user?.id); // Assurez-vous que req.user.id existe
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  // Vérifier si l'ancien mot de passe est correct
  const match = await matchPassword(user, oldPassword);
  if (!match) {
    res.status(401).json({ message: "Old password is incorrect" });
    return;
  }

  // Mettre à jour le mot de passe
  user.password = newPassword; // Assurez-vous que vous avez une méthode pour cela
  user.tokenVersion += 1;
  await user.save();

  // Envoyer un email de confirmation de changement de mot de passe
  await sendPasswordChangeConfirmation(user.email);

  res.status(200).json({ message: "Password updated successfully" });
  return;
};

const updateName = async (req: Request, res: Response): Promise<void> => {
  const { email, name } = req.body;

  if (!email || !name) {
    res.status(400).json({ message: "Email and name fields are required" });
    return;
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { name },
      { new: true, runValidators: true }
    ).select("-password -_id");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "Name updated successfully", user });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user name" });
  }
};

const changeEmail = async (req: Request, res: Response): Promise<void> => {
  const { newEmail } = req.body;

  // Vérifiez que l'utilisateur est authentifié
  const user = req.user ?? ({} as IUser);

  // Vérifiez si l'e-mail est déjà pris
  const emailExists = await User.findOne({ email: newEmail });
  if (emailExists) {
    res.status(400).json({ message: "Email already in use" });
    return;
  }

  // Générer un token de validation
  const newEmailToken = generateMailToken();
  user.newEmail = newEmail;
  user.newEmailToken = newEmailToken;
  user.newEmailVerified = false; // À valider par l'utilisateur
  await user.save();

  // Envoyer l'e-mail de validation
  sendNewEmailVerification(newEmail, newEmailToken);

  res
    .status(200)
    .json({ message: "Verification email sent to new email address" });
};

const verifyNewEmail = async (req: Request, res: Response): Promise<void> => {
  const { token, email } = req.query;

  // Trouver l'utilisateur avec la nouvelle adresse e-mail et le token
  const user = await User.findOne({ newEmail: email, newEmailToken: token });
  if (!user) {
    res.status(400).json({ message: "Invalid or expired token" });
    return;
  }

  // Valider la nouvelle adresse e-mail
  user.email = user.newEmail ?? user.email; // Mettez à jour l'adresse e-mail principale
  user.newEmail = null; // Supprimez l'ancienne adresse e-mail
  user.newEmailToken = null; // Supprimez le token de validation
  user.newEmailVerified = true; // Indique que l'e-mail a été vérifié
  await user.save();

  res.status(200).json({ message: "Email address updated successfully" });
};

export {
  getUserProfile,
  updatePassword,
  updateName,
  changeEmail,
  verifyNewEmail,
};
