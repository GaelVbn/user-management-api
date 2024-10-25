import { Request, Response } from "express";
import User from "../../../models/UserModel";

// DELETE A USER
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres de la fonction
  const { email } = req.body; // Récupérer l'email de l'utilisateur à supprimer

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const user = await User.findOneAndDelete(email); // Supprimer l'utilisateur

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return; // Assurer que la fonction se termine après avoir envoyé une réponse
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Ajout d'un log d'erreur pour le débogage
    res.status(500).json({ message: "Server error" });
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
  res: Response
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
      res.status(404).json({
        message: "No users found on this page",
        users: [],
        totalUsers,
        totalPages,
        currentPage: pageNumber,
      });
      return; // On retourne `void`, ce `return` arrête juste l'exécution
    }

    // Réponse en cas de succès
    res.status(200).json({
      users,
      totalUsers,
      totalPages,
      currentPage: pageNumber,
    });
    return; // Même ici pour stopper après avoir envoyé la réponse
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
    return; // Idem en cas d'erreur
  }
};

const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const { email, role } = req.body;

  // Vérification des paramètres requis
  if (!email || !role) {
    res.status(400).json({ message: "Email and role are required" });
    return;
  }

  try {
    // Mise à jour du rôle de l'utilisateur par email
    const user = await User.findOneAndUpdate(
      { email }, // Critère de recherche
      { role },
      { new: true }
    ).select("-password -_id");

    // Vérifier si l'utilisateur a été trouvé et mis à jour
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Répondre avec succès
    res.status(200).json({
      message: "User role updated successfully",
      user: user,
    });
  } catch (err) {
    console.error("Error updating user role:", err); // Log d'erreur pour le débogage
    res.status(500).json({ message: "Server error" });
  }
};

export { deleteUser, getAllUsers, updateUserRole };
