import User, { IUser, matchPassword } from "../../models/UserModel"; // Utiliser l'importation ES6
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
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()), // Convertir en chaîne de caractères
    });
  } else {
    res.status(401).json({ message: "Email or password is incorrect" });
  }
};

export { registerUser, loginUser, generateToken }; // Exportation des fonctions
