import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../../features/Auth/UserModel";

const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Vérification de l'autorisation dans l'en-tête de la requête
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      // Récupérer l'utilisateur du token
      req.user = (await User.findById(decoded.id).select("-password")) as IUser;

      next();
    } catch (error) {
      res.status(401).json({ message: "Token is not valid" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
  }
};

export { protect }; // Utilisation de l'export nommé
