const express = require("express");
const connectDB = require("./config/database");
const dotenv = require("dotenv");
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Pour traiter les JSON

// Routes
app.use("/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 3001;

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Exporter l'application pour les tests
module.exports = app;
