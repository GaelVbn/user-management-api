import express from "express";
import { deleteUser, getAllUsers, updateUserRole } from "./adminController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import authRole from "../../../middlewares/Admin/authRoleMiddleware";

const router = express.Router();

// Route pour supprimer un utilisateur par ID
router.delete("/delete/:id", protect, authRole("admin"), deleteUser);

// Route pour lister tout les utilisateurs
router.get("/getAllUsers", protect, authRole("admin"), getAllUsers);

// Route permet de changer le role d'un utilisateur
router.put("/updateUserRole/:id", protect, authRole("admin"), updateUserRole);

export default router; // Utilisation de l'export par défaut
