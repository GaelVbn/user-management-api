const request = require("supertest");
const app = require("../app"); // Ton fichier app.js où tu configures Express
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { generateToken } = require("../controllers/userController");
const User = require("../models/User");
dotenv.config();

beforeAll(async () => {
  // Connection à une base de données de test
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  // Après les tests, on ferme la connexion.
  await mongoose.connection.close();
});

// Test de la route d'inscription
describe("POST /users/register", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/users/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("email", "testuser@example.com");
  });

  it("should return 400 if all fields are empty", async () => {
    const res = await request(app).post("/users/register").send({
      name: "",
      email: "",
      password: "",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "All fields are required");
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app).post("/users/register").send({
      name: "Test User",
      email: "emailinvalid", // Invalid email format
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Invalid email format");
  });

  it("should return 400 if user already exists", async () => {
    // First, register a user
    await request(app).post("/users/register").send({
      name: "Existing User",
      email: "existinguser@example.com",
      password: "password123",
    });

    // Now try to register the same user again
    const res = await request(app).post("/users/register").send({
      name: "Existing User",
      email: "existinguser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "User already exists");
  });
});

// Test de la route login
describe("POST /users/login", () => {
  it("should login the user", async () => {
    const res = await request(app).post("/users/login").send({
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should return 401 if email does not exist", async () => {
    const res = await request(app).post("/users/login").send({
      email: "nonexistentuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty(
      "message",
      "Email or password is incorrect"
    );
  });

  it("should return 401 if password is incorrect", async () => {
    const res = await request(app).post("/users/login").send({
      email: "testuser@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty(
      "message",
      "Email or password is incorrect"
    );
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app).post("/users/login").send({
      password: "password123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Email is required");
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app).post("/users/login").send({
      email: "testuser@example.com",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Password is required");
  });
});

// Get user Profile
describe.only("GET /users/profile", () => {
  it("Should return the user profile", async () => {
    // Login pour obtenir le token
    const loginRes = await request(app).post("/users/login").send({
      email: "testuser@example.com",
      password: "password123",
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("email");
  });

  it("Should return 401 if token is missing", async () => {
    const res = await request(app).get("/users/profile");

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty(
      "message",
      "No token, authorization denied"
    );
  });

  it("Should return 401 if token is invalid", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", "Bearer invalid_token");

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message", "Token is not valid");
  });
});

describe("PUT /users/update-password", () => {
  let token; // Pour stocker le token JWT
  let user;

  beforeAll(async () => {
    // Créer un utilisateur pour les tests
    user = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password: "oldpassword123",
    });

    // Générer un token pour l'utilisateur
    token = generateToken(user._id);
  });

  afterAll(async () => {
    // Supprimer l'utilisateur après les tests
    await User.deleteMany({});
  });

  it("should update the password successfully", async () => {
    const res = await request(app)
      .put("/users/update-password") // Utilisez PUT ici
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "oldpassword123",
        newPassword: "newpassword123",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Password updated successfully");

    // Vérifier que le mot de passe a été mis à jour
    const updatedUser = await User.findById(user._id);
    const isMatch = await updatedUser.matchPassword("newpassword123");
    expect(isMatch).toBe(true);
  });

  it("should return 400 if oldPassword or newPassword is not provided", async () => {
    const res = await request(app)
      .put("/users/update-password") // Utilisez PUT ici
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "",
        newPassword: "newpassword123",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "Both passwords are required");
  });

  it("should return 401 if old password is incorrect", async () => {
    const res = await request(app)
      .put("/users/update-password") // Utilisez PUT ici
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "wrongpassword",
        newPassword: "newpassword123",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message", "Old password is incorrect");
  });
});

// afterEach(async () => {
//   await mongoose.connection.db.dropDatabase(); // Supprime les données après chaque test
// });
