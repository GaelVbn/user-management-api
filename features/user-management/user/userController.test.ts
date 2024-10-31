import request from "supertest";
import app from "../../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
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

// Test de la mise a jour du nom d'utilisateur
describe("PUT /users/updateName", () => {
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

  it("should update the name of the current user", async () => {
    const res = await request(app)
      .put("/users/updateName")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "testuser@example.com",
        name: "Updated Name",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Name updated successfully");

    const updatedUser = await User.findOne({ email: "testuser@example.com" });
    expect(updatedUser?.name).toBe("Updated Name");
  });

  it("should return 401 if the email is not the current user's", async () => {
    const res = await request(app)
      .put("/users/updateName")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "wrongemail@example.com",
        name: "Updated Name",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "User not found");
  });
});

describe("PUT /users/change-email", () => {
  let userToken: string;
  let user: IUser;

  beforeEach(async () => {
    // Créer un utilisateur de test et obtenir le token
    const userResponse = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    user = userResponse.body;
    expect(user).toHaveProperty("token");
    userToken = user.token;
  });

  it("should send verification email for changing email", async () => {
    const res = await request(app)
      .put("/users/change-email")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        newEmail: "new-email@example.com",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Verification email sent to new email address"
    );

    const updatedUser = await User.findOne({ email: "testuser@example.com" });
    expect(updatedUser?.newEmail).toBe("new-email@example.com");
    expect(updatedUser?.newEmailVerified).toBe(false);
  });

  it("should return 400 if email is already in use", async () => {
    // Créer un autre utilisateur avec le même e-mail
    await request(app).post("/auth/register").send({
      name: "Another User",
      email: "new-email@example.com",
      password: "password123",
    });

    const res = await request(app)
      .put("/users/change-email")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        newEmail: "new-email@example.com",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Email already in use");
  });
});

describe("POST /users/verify-new-email", () => {
  let userToken: string;
  let user: any;
  let newEmail: string;

  beforeEach(async () => {
    // Créez un utilisateur test et obtenez le token
    const userResponse = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });

    userToken = userResponse.body.token;

    // Demandez la route 'changeEmail'
    await request(app)
      .put("/users/change-email")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        newEmail: "new-email@example.com",
      });

    // Récupère l'utilisateur directement depuis la base de données pour accéder au mailToken
    user = await User.findOne({ email: "testuser@example.com" });

    newEmail = "new-email@example.com";
  });

  it("should verify new email with the mailToken", async () => {
    // Exécute la requête avec le mailToken et l'email
    const res = await request(app).post(
      `/users/verify-new-email?token=${user.newEmailToken}&email=${newEmail}`
    );

    // Vérifie les réponses attendues
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty(
      "message",
      "Email update confirmed successfully."
    );

    // Vérifie que l'utilisateur est bien marqué comme vérifié dans la base de données
    const verifiedUser = await User.findOne({ email: "new-email@example.com" });
    expect(verifiedUser?.newEmailVerified).toBe(true);
    expect(verifiedUser?.newEmailToken).toBeNull(); // Vérifie que le token est supprimé
  });

  it("should throw an error if there is no mailtoken", async () => {
    // Essayer de lancer la requête sans le mailToken
    const res = await request(app).post(`/users/verify-new-email`).send({
      email: newEmail,
    });

    // Vérifie les réponses attendues
    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty("message", "Token and email are required.");
  });
});
