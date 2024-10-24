import express from "express";
import { deleteUser } from "./adminController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import authRole from "../../../middlewares/Auth/authRoleMiddleware";

const router = express.Router();

// Route pour supprimer un utilisateur par ID
router.delete("/delete/:id", protect, authRole("admin"), deleteUser);

export default router; // Utilisation de l'export par défaut
