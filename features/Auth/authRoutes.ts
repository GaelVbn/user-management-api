import express from "express";
import { registerUser, loginUser } from "./authController";
import {
  validateRegister,
  validateLogin,
} from "../../middlewares/Auth/validationMiddleware";
import sanitizeMiddleware from "../../middlewares/Global/sanitizeMiddleware";
import loginLimiter from "../../middlewares/Auth/loginLimiterMiddleware";

const router = express.Router();

// Route pour enregistrer un nouvel utilisateur
router.post("/register", sanitizeMiddleware, validateRegister, registerUser);

// Route pour connecter un utilisateur
router.post(
  "/login",
  loginLimiter,
  sanitizeMiddleware,
  validateLogin,
  loginUser
);

export default router; // Utilisation de l'export par défaut
