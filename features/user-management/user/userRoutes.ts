import express from "express";
import {
  getUserProfile,
  updatePassword,
  updateName,
  changeEmail,
  verifyNewEmail,
} from "./userController";
import sanitizeMiddleware from "../../../middlewares/Global/sanitizeMiddleware";
import { protect } from "../../../middlewares/Auth/authMiddleware";

const router = express.Router();

// Route pour récupérer le profil de l'utilisateur
router.get("/profile", protect, getUserProfile);

// Route pour mettre à jour le mot de passe de l'utilisateur
router.put("/update-password", protect, sanitizeMiddleware, updatePassword);

// Route pour mettre à jour le nom
router.put("/updateName", protect, sanitizeMiddleware, updateName);

// Route pour demander un changement d'email
router.put("/change-email", protect, sanitizeMiddleware, changeEmail);

// Route pour verifier la nouvelle adresse mail
router.post("/verify-new-email", sanitizeMiddleware, verifyNewEmail);

export default router; // Utilisation de l'export par défaut
