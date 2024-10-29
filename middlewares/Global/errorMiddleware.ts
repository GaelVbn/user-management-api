import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/appError"; // Assurez-vous d'importer votre classe AppError

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Log de l'erreur

  // Vérifiez si l'erreur est une instance d'AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Pour les autres erreurs, retournez un message générique
  const status = err.status || 500; // Par défaut, 500 si aucun statut n'est défini
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
};

export default errorMiddleware;
