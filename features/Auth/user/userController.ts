import User, { IUser, matchPassword } from "../UserModel"; // Utiliser l'importation ES6
import jwt from "jsonwebtoken"; // Importation ES6
import bcrypt from "bcryptjs"; // Importation ES6
import { Request, Response } from "express"; // Importation des types Request et Response

// Générer un token JWT
function generateToken(id: string): string {
  // Typage du paramètre et du retour
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "1h" }); // Ajout de `!` pour indiquer que JWT_SECRET ne sera pas `undefined`
}

const registerUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const {
    name,
    email,
    password,
    role,
  }: { name: string; email: string; password: string; role?: string } =
    req.body; // Typage de la destructuration

  if (!name || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Invalid email format" });
    return;
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  // Vérifier que le rôle est valide
  const validRoles = ["user", "admin"];
  const userRole = validRoles.includes(role!) ? role : "user"; // Utiliser `!` pour indiquer que `role` peut être undefined

  const user: IUser = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()), // Convertir en chaîne de caractères
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// Connexion utilisateur
const loginUser = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const { email, password }: { email: string; password: string } = req.body; // Typage de la destructuration

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  if (!password) {
    res.status(400).json({ message: "Password is required" });
    return;
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()), // Convertir en chaîne de caractères
    });
  } else {
    res.status(401).json({ message: "Email or password is incorrect" });
  }
};

// Typage de la fonction en tant que RequestHandler
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  // Vérifiez d'abord si req.user est défini
  if (!req.user) {
    res.status(401).json({ message: "User not authenticated" });
    return; // Sortir pour ne pas continuer à exécuter le code
  }

  const user = await User.findById(req.user.id); // Assurez-vous que req.user.id existe

  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// UPDATE PASSWORD
const updatePassword = async (req: Request, res: Response): Promise<void> => {
  // Typage des paramètres
  const {
    oldPassword,
    newPassword,
  }: { oldPassword: string; newPassword: string } = req.body; // Typage de la destructuration

  // Assurez-vous que les mots de passe sont fournis
  if (!oldPassword || !newPassword) {
    res.status(400).json({ message: "Both passwords are required" });
    return;
  }

  // Trouver l'utilisateur à partir du token
  const user = await User.findById(req.user?.id); // Assurez-vous que req.user.id existe
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  // Vérifier si l'ancien mot de passe est correct
  const match = await matchPassword(user, oldPassword);
  if (!match) {
    res.status(401).json({ message: "Old password is incorrect" });
    return;
  }

  // Mettre à jour le mot de passe
  user.password = newPassword; // Assurez-vous que vous avez une méthode pour cela
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
  generateToken,
}; // Exportation des fonctions
