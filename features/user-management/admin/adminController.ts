import { Request, Response, NextFunction } from "express";
import User from "../../../models/UserModel";
import {
  generateMailToken,
  sendNewEmailVerification,
  sendPasswordResetEmail,
} from "../../../services/emailService";
import AppError from "../../../utils/appError";

const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  try {
    const user = await User.findOneAndDelete({ email });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    next(new AppError("Server error while deleting user", 500));
  }
};

// Définir une interface pour typer req.query
interface GetAllUsersQuery {
  role?: string;
  name?: string;
  email?: string;
  sortBy?: string;
  order?: "asc" | "desc"; // Limiter à "asc" ou "desc"
  page?: string; // Ce sera une chaîne, car toutes les query params sont en string
  limit?: string;
}
// Get All Users + Pagination and Filters
const getAllUsers = async (
  req: Request<{}, {}, {}, GetAllUsersQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      role,
      name,
      email,
      sortBy = "createdAt",
      order = "asc",
      page = "1", // req.query renvoie des chaînes
      limit = "10",
    } = req.query;

    // Construction de la requête de recherche
    let query: any = {};
    if (role) {
      query.role = role;
    }
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Conversion des paramètres de pagination et tri
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const sortOrder: 1 | -1 = order === "desc" ? -1 : 1;
    const sortQuery = { [sortBy as string]: sortOrder };

    // Recherche des utilisateurs dans la base de données
    const users = await User.find(query)
      .select("-password -_id")
      .sort(sortQuery)
      .skip(skip)
      .limit(pageSize);

    // Comptage total des utilisateurs
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / pageSize);

    // Si aucun utilisateur n'est trouvé sur la page demandée
    if (users.length === 0) {
      return next(new AppError("No users found on this page", 404));
    }

    // Réponse en cas de succès
    res.status(200).json({
      users,
      totalUsers,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(new AppError("Server error while fetching users", 500));
  }
};

const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, field, value } = req.body;

  if (!email || !field || !value) {
    return next(new AppError("Email, field, and value are required", 400));
  }

  try {
    // Création d'un objet pour mettre à jour l'utilisateur
    const updateData: { [key: string]: any } = {};
    updateData[field] = value;

    // Mise à jour de l'utilisateur par email
    const user = await User.findOneAndUpdate({ email }, updateData, {
      new: true,
    }).select("-password -_id");

    // Vérifier si l'utilisateur a été trouvé et mis à jour
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Répondre avec succès
    res.status(200).json({
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } updated successfully`,
      user,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return next(new AppError("Server error while updating user", 500));
  }
};

const adminResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, newEmail } = req.body;

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

    // Envoyer l'email de réinitialisation
    await sendPasswordResetEmail(newEmail, resetToken);

    res
      .status(200)
      .json({ message: "Password reset email sent to the new email" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return next(new AppError("Server error while resetting password", 500));
  }
};

const adminResetEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, newEmail } = req.body;

  try {
    // Vérifiez si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Vérifiez si l'e-mail est déjà pris
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return next(new AppError("Email already in use", 400));
    }

    const newEmailToken = generateMailToken();
    user.newEmail = newEmail;
    user.newEmailToken = newEmailToken;
    user.newEmailVerified = false;
    user.newEmailTokenExpires = new Date(Date.now() + 3600000); // Expiration dans 1 heure
    await user.save();

    await sendNewEmailVerification(newEmail, newEmailToken);

    res
      .status(200)
      .json({ message: "Email verification sent to the new email address" });
  } catch (error) {
    console.error("Error resetting email:", error);
    return next(new AppError("Server error while resetting email", 500));
  }
};

export {
  deleteUser,
  getAllUsers,
  updateUser,
  adminResetPassword,
  adminResetEmail,
};
