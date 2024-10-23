import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

// Limiteur de requêtes pour les connexions
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par fenêtre
  message:
    "Trop de tentatives de connexion de cette IP, veuillez réessayer après 15 minutes.",
});

// Exportation du middleware
export default loginLimiter;
