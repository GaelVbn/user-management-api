import express, { Request, Response } from "express";
import connectDB from "./config/database"; // Assurez-vous que le fichier de configuration est également converti en TS
import dotenv from "dotenv";
import { IUser } from "./models/UserModel"; // Assurez-vous que le modèle User est bien typé
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Interface Request : IUser
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Middleware
app.use(express.json()); // Pour traiter les JSON
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", require("./features/Auth/authRoutes").default); // Ajouter .default pour le module ES
app.use(
  "/users",
  require("./features/user-management/user/userRoutes").default
); // Ajouter .default pour le module ES
app.use(
  "/admin",
  require("./features/user-management/admin/adminRoutes").default
); // Ajouter .default pour le module ES

const PORT = process.env.PORT || 3001;

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Exporter l'application pour les tests
export default app;
