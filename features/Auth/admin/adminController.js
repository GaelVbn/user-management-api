const User = require("../UserModel");

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

module.exports = {
  deleteUser,
};
