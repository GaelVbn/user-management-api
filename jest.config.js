module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/", // Ignore par défaut
  ],
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
