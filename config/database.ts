import mongoose from "mongoose"; // Utilisation d'importation ES6
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
  // Typage de la fonction
  try {
    await mongoose.connect(process.env.MONGO_URI as string); // Assurez-vous que MONGO_URI est une chaîne
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB; // Exporter la fonction pour l'utiliser ailleurs
