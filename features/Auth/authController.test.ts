import request from "supertest";
import app from "../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateToken } from "./authController";
import User, { IUser } from "../../models/UserModel"; // Assurez-vous que le modèle User est bien typé
import { MongoMemoryServer } from "mongodb-memory-server";
import { App } from "supertest/types";

dotenv.config();

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
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
  await User.deleteMany({});
});

jest.setTimeout(10000);

describe("POST /auth/register", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("email", "testuser@example.com");
  });

  it("should return 400 if all fields are empty", async () => {
    const res = await request(app).post("/auth/register").send({
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
    const res = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "emailinvalid", // Invalid email format
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", '"email" must be a valid email');
  });

  it("should return 400 if user already exists", async () => {
    await request(app).post("/auth/register").send({
      name: "Existing User",
      email: "existinguser@example.com",
      password: "password123",
    });

    const res = await request(app).post("/auth/register").send({
      name: "Existing User",
      email: "existinguser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "User already exists");
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });
  });

  it("should login the user", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should return 401 if email does not exist", async () => {
    const res = await request(app).post("/auth/login").send({
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
    const res = await request(app).post("/auth/login").send({
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
    const res = await request(app).post("/auth/login").send({
      password: "password123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", '"email" is a required field');
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "testuser@example.com",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty(
      "message",
      '"password" is a required field'
    );
  });
});

describe("GET /auth/verifyEmail", () => {
  let user: any;

  beforeEach(async () => {
    // Créez un utilisateur test
    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    // Récupère l'utilisateur directement depuis la base de données pour accéder au mailToken
    user = await User.findOne({ email: "testuser@example.com" });
  });

  it("should verify email with the mailToken", async () => {
    // Exécute la requête avec le mailToken et l'email
    const res = await request(app).get(
      `/auth/verify-email?token=${user.mailToken}&email=${user.email}`
    );

    // Vérifie les réponses attendues
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("message", "Email verified successfully");

    // Vérifie que l'utilisateur est bien marqué comme vérifié dans la base de données
    const verifiedUser = await User.findOne({ email: "testuser@example.com" });
    expect(verifiedUser?.isVerified).toBe(true);
    expect(verifiedUser?.mailToken).toBeNull(); // Vérifie que le token est supprimé
  });

  it("should throw an error if there is no mailtoken", async () => {
    // Essayer de lancer la requête sans le mailToken
    const res = await request(app).get(
      `/auth/verify-email?email=${user.email}`
    );

    // Vérifie les réponses attendues
    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty("message", "Token and email are required");
  });
});
