const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// Connexion utilisateur
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Email or password is incorrect" });
  }
};

// Récupérer le profil utilisateur
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

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

// DELETE A USER
const deleteUser = async (req, res) => {
  const { id } = req.params; // Récupérer l'ID de l'utilisateur à supprimer

  try {
    const user = await User.findByIdAndDelete(id); // Supprimer l'utilisateur

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PASSWORD
const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Assurez-vous que les mots de passe sont fournis
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both passwords are required" });
  }

  // Trouver l'utilisateur à partir du token
  const user = await User.findById(req.user.id); // Assurez-vous que req.user.id existe

  // Vérifier si l'ancien mot de passe est correct
  const match = await user.matchPassword(oldPassword);
  if (!match) {
    return res.status(401).json({ message: "Old password is incorrect" });
  }

  // Mettre à jour le mot de passe
  user.password = newPassword; // Assurez-vous que vous avez une méthode pour cela
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  deleteUser,
  updatePassword,
  generateToken,
};
