import request from "supertest";
import app from "../../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../../models/UserModel";
import { generateToken } from "../../Auth/authController";
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

afterEach(async () => {
  // Assurez-vous que la collection d'utilisateurs est vide avant chaque test
  await User.deleteMany({});
});

// Tests pour la route DELETE
describe("DELETE /admin/delete/:id", () => {
  it("should allow an admin to delete a normal user", async () => {
    // Créer un utilisateur normal
    const normalUserResponse = await request(app).post("/auth/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    const normalUser = normalUserResponse.body;

    // Créer un utilisateur admin
    const adminUserResponse = await request(app).post("/auth/register").send({
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
    const normalUserResponse = await request(app).post("/auth/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
    });

    const normalUser = normalUserResponse.body;

    // Créer un utilisateur non-admin
    const nonAdminUserResponse = await request(app)
      .post("/auth/register")
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

// test GetAllUser
describe("GET /admin/getAllUsers", () => {
  it("should get list of users if admin", async () => {
    const adminUser = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const admin = adminUser.body;

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(admin._id);

    const res = await request(app)
      .get(`/admin/getAllUsers`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
  });
  it("should get an error if users is not admin", async () => {
    const adminUser = await request(app).post("/auth/register").send({
      name: "User",
      email: "user@test.com",
      password: "adminpassword123",
      role: "user",
    });

    const user = adminUser.body;

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(user._id);

    const res = await request(app)
      .get(`/admin/getAllUsers`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });
});

describe("GET /admin/getAllUsers?page=1&limit=10", () => {
  beforeAll(async () => {
    // Créez 10 utilisateurs pour le test
    await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const response = await request(app)
          .post("/auth/register")
          .send({
            name: `User ${index + 1}`,
            email: `user${index + 1}@test.com`,
            password: "password123",
            role: "user",
          });
      })
    );
  });

  afterEach(async () => {
    // Nettoyer la base de données après chaque test si nécessaire
    await User.deleteMany({});
  });

  it("should give 10 users for the 1st page", async () => {
    const adminUser = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const admin = adminUser.body;

    // Générer un token pour l'utilisateur admin
    const adminToken = generateToken(admin._id);

    const res = await request(app)
      .get(`/admin/getAllUsers?page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(10); // Vérifier le nombre d'utilisateurs
    res.body.users.forEach((user: any) => {
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      // Ajoutez d'autres assertions selon les propriétés attendues
    });
  });
});

describe("GET /admin/getAllUsers with filters", () => {
  let adminToken: string;

  beforeEach(async () => {
    // Créer un utilisateur admin pour chaque test
    const adminUser = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    adminToken = generateToken(adminUser.body._id);

    // Créer des utilisateurs de test avec différents rôles, noms et emails
    await Promise.all([
      request(app).post("/auth/register").send({
        name: "Alice",
        email: "alice@test.com",
        password: "password",
        role: "user",
      }),
      request(app).post("/auth/register").send({
        name: "Bob",
        email: "bob@test.com",
        password: "password",
        role: "admin",
      }),
      request(app).post("/auth/register").send({
        name: "Charlie",
        email: "charlie@test.com",
        password: "password",
        role: "user",
      }),
      request(app).post("/auth/register").send({
        name: "David",
        email: "david@test.com",
        password: "password",
        role: "admin",
      }),
    ]);
  });

  afterEach(async () => {
    // Nettoyer la base de données après chaque test
    await User.deleteMany({});
  });

  it("should filter users by role", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?role=user`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(2); // Alice et Charlie
  });

  it("should filter users by name", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?name=Alice`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(1); // Uniquement Alice
    expect(res.body.users[0].name).toBe("Alice");
  });

  it("should filter users by email", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?email=bob@test.com`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(1); // Uniquement Bob
    expect(res.body.users[0].email).toBe("bob@test.com");
  });

  it("should sort users by name in ascending order", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?sortBy=name&order=asc`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(5);
    expect(res.body.users[0].name).toBe("Admin User");
  });

  it("should sort users by email in descending order", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?sortBy=email&order=desc`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.users.length).toBe(5);
    expect(res.body.users[0].email).toBe("david@test.com");
  });
});
