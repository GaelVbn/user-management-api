const request = require("supertest");
const app = require("../../../../app"); // Ton fichier app.js où tu configures Express
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../../UserModel");
const { generateToken } = require("../../user/userController");
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
  await User.deleteMany({});
});

// Tests pour la route DELETE
describe("DELETE /admin/delete/:id", () => {
  it("should allow an admin to delete a normal user", async () => {
    // Créer un utilisateur normal
    const normalUser = await request(app).post("/users/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    // Créer un utilisateur admin
    const adminUser = await request(app).post("/users/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(adminUser.body._id);

    const res = await request(app)
      .delete(`/admin/delete/${normalUser.body._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    // Vérifier que l'utilisateur normal a été supprimé
    const deletedUser = await User.findById(normalUser.body._id);
    expect(deletedUser).toBeNull(); // L'utilisateur ne devrait plus exister
  });
});

describe("DELETE /admin/delete/:id", () => {
  it("should have an error if not an admin wants to detele a user", async () => {
    // Créer un utilisateur normal
    const normalUser = await request(app).post("/users/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    // Créer un utilisateur admin
    const adminUser = await request(app).post("/users/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
    });

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(adminUser.body._id);

    const res = await request(app)
      .delete(`/admin/delete/${normalUser.body._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
  });
});
