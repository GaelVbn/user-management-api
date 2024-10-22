const request = require("supertest");
const app = require("../app"); // Ton fichier app.js où tu configures Express
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { generateToken } = require("../controllers/userController");
const User = require("../models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");
dotenv.config();

let mongoServer;

beforeAll(async () => {
  // Fermer toute connexion active existante
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Assurez-vous que la collection d'utilisateurs est vide avant chaque test
  console.log("Cleaning up database...");
  await User.deleteMany({});
  console.log("Database cleaned");
});

jest.setTimeout(10000);

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
    expect(res.body).toHaveProperty(
      "message",
      '"name" cannot be an empty field'
    );
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app).post("/users/register").send({
      name: "Test User",
      email: "emailinvalid", // Invalid email format
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", '"email" must be a valid email');
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
  beforeEach(async () => {
    // Crée un utilisateur dans la base de données avant chaque test de connexion
    await request(app).post("/users/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });
  });

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
    expect(res.body).toHaveProperty("message", '"email" is a required field');
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app).post("/users/login").send({
      email: "testuser@example.com",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty(
      "message",
      '"password" is a required field'
    );
  });
});

// Get user Profile
describe("GET /users/profile", () => {
  let token; // Pour stocker le token JWT

  beforeEach(async () => {
    // Crée un utilisateur pour les tests
    const res = await request(app).post("/users/register").send({
      name: "TestUser",
      email: "jest@test.com",
      password: "password123",
    });

    // Vérifie que l'utilisateur a bien été créé
    expect(res.statusCode).toEqual(201); // Assure que l'utilisateur est enregistré

    // Login pour obtenir le token
    const loginRes = await request(app).post("/users/login").send({
      email: "jest@test.com",
      password: "password123",
    });

    token = loginRes.body.token; // Récupérer le token
  });

  it("Should return the user profile", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("email");
    expect(res.body.email).toEqual("jest@test.com"); // Vérifie que l'email est correct
  });

  it("Should return 401 if token is missing", async () => {
    const res = await request(app).get("/users/profile");

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty(
      "message",
      "No token, authorization denied"
    );
  });
});

describe("PUT /users/update-password", () => {
  let token; // Pour stocker le token JWT
  let user;

  beforeEach(async () => {
    // Créer un utilisateur pour les tests
    user = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password: "oldpassword123",
    });

    // Générer un token pour l'utilisateur
    token = generateToken(user._id);
  });

  it("should update the password successfully", async () => {
    const res = await request(app)
      .put("/users/update-password")
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

  // Ajoutez des tests pour les scénarios d'échec, par exemple :
  it("should return 400 if old password is incorrect", async () => {
    const res = await request(app)
      .put("/users/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "wrongoldpassword",
        newPassword: "newpassword123",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("message", "Old password is incorrect");
  });
});
