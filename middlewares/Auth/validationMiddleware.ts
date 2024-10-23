import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "../../features/Auth/validations"; // Mettez à jour le chemin selon votre structure

const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    // Si une erreur est détectée, renvoie une réponse et arrête l'exécution
    res.status(400).json({ message: error.details[0].message });
    return; // Assurez-vous d'ajouter ce return pour éviter d'exécuter `next()` si une erreur se produit
  }
  next(); // Continuez vers le prochain middleware si tout va bien
};

const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    // Si une erreur est détectée, renvoie une réponse et arrête l'exécution
    res.status(400).json({ message: error.details[0].message });
    return; // Assurez-vous d'ajouter ce return pour éviter d'exécuter `next()` si une erreur se produit
  }
  next(); // Continuez vers le prochain middleware si tout va bien
};

export { validateRegister, validateLogin };
