const express = require("express");
const { deleteUser } = require("../admin/adminController");
const { protect } = require("../../../middlewares/Auth/authMiddleware");
const authRole = require("../../../middlewares/Auth/authRoleMiddleware");

const router = express.Router();

router.delete("/delete/:id", protect, authRole("admin"), deleteUser);

module.exports = router;
