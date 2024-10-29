// middleware/Global/logger.ts
import winston from "winston";
import morgan from "morgan";
import path from "path";

// Configuration du logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs", "combined.log"),
      maxsize: 1000000, // 1 Mo
      maxFiles: 5, // Garder 5 fichiers de log
    }),
    new winston.transports.Console(),
  ],
});

// Middleware de logging avec Morgan
const morganMiddleware = morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()), // Log dans Winston
  },
});

// Exporter le middleware et le logger
export { morganMiddleware, logger };
