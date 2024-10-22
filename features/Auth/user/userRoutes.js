const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
} = require("./userController");
const { protect } = require("../../../middlewares/Auth/authMiddleware");
const {
  validateRegister,
  validateLogin,
} = require("../../../middlewares/Auth/validationMiddleware");
const loginLimiter = require("../../../middlewares/Auth/loginLimiterMiddleware");

const router = express.Router();

router.post("/register", validateRegister, registerUser);

router.post("/login", loginLimiter, validateLogin, loginUser);

router.get("/profile", protect, getUserProfile);

router.put("/update-password", protect, updatePassword);

module.exports = router;
