const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite chaque IP à 5 requêtes par fenêtre
  message:
    "Trop de tentatives de connexion de cette IP, veuillez réessayer après 15 minutes.",
});

module.exports = loginLimiter;
