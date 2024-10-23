import request from "supertest";
import app from "../../../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../UserModel";
import { generateToken } from "../../user/userController";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

let mongoServer: MongoMemoryServer;

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
  await User.deleteMany({});
});

// Tests pour la route DELETE
describe("DELETE /admin/delete/:id", () => {
  it("should allow an admin to delete a normal user", async () => {
    // Créer un utilisateur normal
    const normalUserResponse = await request(app).post("/users/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    const normalUser = normalUserResponse.body;

    // Créer un utilisateur admin
    const adminUserResponse = await request(app).post("/users/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const adminUser = adminUserResponse.body;

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(adminUser._id);

    const res = await request(app)
      .delete(`/admin/delete/${normalUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Assurez-vous que `res.statusCode` est bien typé
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    // Vérifier que l'utilisateur normal a été supprimé
    const deletedUser = await User.findById(normalUser._id);
    expect(deletedUser).toBeNull(); // L'utilisateur ne devrait plus exister
  });
});

describe("DELETE /admin/delete/:id", () => {
  it("should return an error if a non-admin tries to delete a user", async () => {
    // Créer un utilisateur normal
    const normalUserResponse = await request(app).post("/users/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    const normalUser = normalUserResponse.body;

    // Créer un utilisateur non-admin
    const nonAdminUserResponse = await request(app)
      .post("/users/register")
      .send({
        name: "Non Admin User",
        email: "nonadmin@test.com",
        password: "nonadminpassword123",
      });

    const nonAdminUser = nonAdminUserResponse.body;

    // Générer un token pour l'utilisateur non-admin
    const nonAdminToken = generateToken(nonAdminUser._id);

    const res = await request(app)
      .delete(`/admin/delete/${normalUser._id}`)
      .set("Authorization", `Bearer ${nonAdminToken}`);

    expect(res.statusCode).toBe(403);
  });
});
