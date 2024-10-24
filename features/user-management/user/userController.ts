import User, { IUser, matchPassword } from "../../../models/UserModel"; // Utiliser l'importation ES6
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
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
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
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};

export { getUserProfile, updatePassword };
