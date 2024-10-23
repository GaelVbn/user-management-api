import { Request, Response } from "express"; // Importer les types Request et Response
import User from "../UserModel"; // Utiliser l'importation ES6

// DELETE A USER
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres de la fonction
  const { id } = req.params; // Récupérer l'ID de l'utilisateur à supprimer

  try {
    const user = await User.findByIdAndDelete(id); // Supprimer l'utilisateur

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return; // Assurer que la fonction se termine après avoir envoyé une réponse
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Ajout d'un log d'erreur pour le débogage
    res.status(500).json({ message: "Server error" });
  }
};

export { deleteUser }; // Exporter la fonction pour l'utiliser ailleurs
