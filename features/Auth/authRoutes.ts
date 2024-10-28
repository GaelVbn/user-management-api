import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "./authController";
import {
  validateRegister,
  validateLogin,
} from "../../middlewares/Auth/validationMiddleware";
import sanitizeMiddleware from "../../middlewares/Global/sanitizeMiddleware";
import loginLimiter from "../../middlewares/Auth/loginLimiterMiddleware";

const router = express.Router();

// Route pour enregistrer un nouvel utilisateur
router.post("/register", sanitizeMiddleware, validateRegister, registerUser);

// Route pour vérifier l'email
router.get("/verify-email", verifyEmail);

// Route pour connecter un utilisateur
router.post(
  "/login",
  loginLimiter,
  sanitizeMiddleware,
  validateLogin,
  loginUser
);

// route pour mot de passe oublié
router.post("/forgot-password", forgotPassword);

// route pour réinitialiser le mot de passe
router.put("/reset-password", resetPassword);

export default router; // Utilisation de l'export par défaut
