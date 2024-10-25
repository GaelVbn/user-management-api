import express from "express";
import { deleteUser, getAllUsers } from "./adminController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import authRole from "../../../middlewares/Admin/authRoleMiddleware";

const router = express.Router();

// Route pour supprimer un utilisateur par ID
router.delete("/delete/:id", protect, authRole("admin"), deleteUser);

// Route pour lister tout les utilisateurs
router.get("/getAllUsers", protect, authRole("admin"), getAllUsers);

export default router; // Utilisation de l'export par défaut
