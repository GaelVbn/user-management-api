import express from "express";
import {
  deleteUser,
  getAllUsers,
  updateUser,
  adminResetPassword,
  adminResetEmail,
} from "./adminController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import sanitizeMiddleware from "../../../middlewares/Global/sanitizeMiddleware";
import authRole from "../../../middlewares/Admin/authRoleMiddleware";
import { morganMiddleware } from "../../../middlewares/Global/logger";

const router = express.Router();

// Route pour supprimer un utilisateur par ID
router.delete(
  "/delete",
  morganMiddleware,
  protect,
  authRole("admin"),
  sanitizeMiddleware,
  deleteUser
);

// Route pour lister tout les utilisateurs
router.get(
  "/getAllUsers",
  morganMiddleware,
  protect,
  authRole("admin"),
  sanitizeMiddleware,
  getAllUsers
);

// Route permet de changer le nom ou le role d'un utilisateur
router.put(
  "/updateUser",
  morganMiddleware,
  protect,
  authRole("admin"),
  sanitizeMiddleware,
  updateUser
);

// Route permet d'envoyer un mail de réinitialisation du mot de passe utilisateur sur son nouveau mail
router.post(
  "/admin-Reset-Password",
  morganMiddleware,
  protect,
  authRole("admin"),
  sanitizeMiddleware,
  adminResetPassword
);

// Route pour demander un changement d'email
router.put(
  "/admin-reset-email",
  morganMiddleware,
  protect,
  authRole("admin"),
  sanitizeMiddleware,
  adminResetEmail
);

export default router; // Utilisation de l'export par défaut
