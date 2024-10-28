import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../../models/UserModel";

const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        tokenVersion: number;
      };

      const user = await User.findById(decoded.id).select("-password");

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        res.status(401).json({ message: "Token is not valid or has expired" });
        return;
      }

      req.user = user as IUser;
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
