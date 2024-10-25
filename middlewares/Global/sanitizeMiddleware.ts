import { Request, Response, NextFunction } from "express";

const sanitizeInput = (input: string): string => {
  return input.replace(/<\/?[^>]+(>|$)/g, ""); // Exemple simple pour enlever les balises HTML
};

const sanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    Object.keys(req.body).forEach((key: string) => {
      if (typeof req.body![key] === "string") {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};

export default sanitizeMiddleware;
