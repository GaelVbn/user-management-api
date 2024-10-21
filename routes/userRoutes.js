const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  deleteUser,
  updatePassword,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const {
  validateRegister,
  validateLogin,
} = require("../middlewares/validationMiddleware");
const loginLimiter = require("../middlewares/loginLimiterMiddleware");
const authRole = require("../middlewares/authRoleMiddleware");

const router = express.Router();

router.post("/register", validateRegister, registerUser);

router.post("/login", loginLimiter, validateLogin, loginUser);

router.get("/profile", protect, getUserProfile);

router.delete("/delete/:id", protect, authRole("admin"), deleteUser);

router.put("/update-password", protect, updatePassword);

module.exports = router;
