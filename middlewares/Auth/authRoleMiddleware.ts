import { Request, Response, NextFunction } from "express";

const authRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Vérifie si l'utilisateur est authentifié et a le rôle requis
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: "Accès interdit" });
      return; // Ajoutez un return pour ne pas continuer l'exécution
    }
    next(); // Passe au middleware suivant si l'accès est autorisé
  };
};

export default authRole; // Utilisation de l'export par défaut
