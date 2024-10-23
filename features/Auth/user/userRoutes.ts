import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
} from "./userController";
import { protect } from "../../../middlewares/Auth/authMiddleware";
import {
  validateRegister,
  validateLogin,
} from "../../../middlewares/Auth/validationMiddleware";
import loginLimiter from "../../../middlewares/Auth/loginLimiterMiddleware";

const router = express.Router();

// Route pour enregistrer un nouvel utilisateur
router.post("/register", validateRegister, registerUser);

// Route pour connecter un utilisateur
router.post("/login", loginLimiter, validateLogin, loginUser);

// Route pour récupérer le profil de l'utilisateur
router.get("/profile", protect, getUserProfile);

// Route pour mettre à jour le mot de passe de l'utilisateur
router.put("/update-password", protect, updatePassword);

export default router; // Utilisation de l'export par défaut
