import express from "express";
import { deleteUser, getAllUsers, updateUser } from "./adminController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import authRole from "../../../middlewares/Admin/authRoleMiddleware";

const router = express.Router();

// Route pour supprimer un utilisateur par ID
router.delete("/delete", protect, authRole("admin"), deleteUser);

// Route pour lister tout les utilisateurs
router.get("/getAllUsers", protect, authRole("admin"), getAllUsers);

// Route permet de changer le nom ou le role d'un utilisateur
router.put("/updateUser", protect, authRole("admin"), updateUser);

export default router; // Utilisation de l'export par défaut
