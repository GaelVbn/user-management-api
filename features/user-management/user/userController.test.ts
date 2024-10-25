import request from "supertest";
import app from "../../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateToken } from "../../Auth/authController";
import User, { IUser, matchPassword } from "../../../models/UserModel"; // Assurez-vous que le modèle User est bien typé
import { MongoMemoryServer } from "mongodb-memory-server";

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

// Test de la mise à jour du mot de passe
describe("PUT /users/update-password", () => {
  let token: string;
  let user: IUser;

  beforeEach(async () => {
    // Crée un utilisateur et récupère le token
    const userResponse = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "oldpassword123",
    });

    user = userResponse.body;
    expect(user).toHaveProperty("token");
    token = user.token;
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

    // Vérifie que le mot de passe a bien été mis à jour
    const updatedUser = await User.findOne({ email: "testuser@example.com" });
    const isMatch = await matchPassword(updatedUser, "newpassword123");
    expect(isMatch).toBe(true);
  });

  it("should return 401 if old password is incorrect", async () => {
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

// Test du profil utilisateur
describe("GET /users/profile", () => {
  let token: string;
  let user: IUser;

  beforeEach(async () => {
    // Créer un utilisateur via la route d'inscription et récupérer le token
    const userResponse = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    user = userResponse.body;
    expect(user).toHaveProperty("token"); // Vérifier que le token est présent dans la réponse
    token = user.token;
  });

  it("should return the user's profile when authenticated", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", user.name);
    expect(res.body).toHaveProperty("email", user.email);
  });

  it("should return 401 if the user is not authenticated", async () => {
    const res = await request(app).get("/users/profile");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token, authorization denied");
  });
});
