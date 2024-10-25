import request from "supertest";
import app from "../../../app"; // Ton fichier app.ts où tu configures Express
import mongoose from "mongoose";
import dotenv from "dotenv";
import User, { IUser } from "../../../models/UserModel";
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
describe("DELETE /admin/delete", () => {
  let normalUserToken: string;
  let adminUserToken: string;

  beforeAll(async () => {
    // Créer un utilisateur normal
    const normalUserResponse = await request(app).post("/auth/register").send({
      name: "Normal User",
      email: "normal@test.com",
      password: "password123",
      role: "user",
    });

    // Récupérer le token pour l'utilisateur normal (en cas de besoin dans d'autres tests)
    normalUserToken = normalUserResponse.body.token;

    // Créer un utilisateur admin
    const adminUserResponse = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    // Récupérer le token pour l'utilisateur admin
    adminUserToken = adminUserResponse.body.token;
  });

  it("should allow an admin to delete a normal user", async () => {
    // Suppression de l'utilisateur normal en tant qu'admin
    const res = await request(app)
      .delete(`/admin/delete`)
      .set("Authorization", `Bearer ${adminUserToken}`) // Utiliser le token de l'admin
      .send({
        email: "normal@test.com",
      });

    // Vérifier le statut de la réponse et le message
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");

    // Vérifier que l'utilisateur a été supprimé de la base de données
    const deletedUser = await User.findOne({ email: "normal@test.com" });
    expect(deletedUser).toBeNull();
  });

  it("should return 403 if a non-admin user tries to delete another user", async () => {
    // Tentative de suppression par un utilisateur non-admin
    const res = await request(app)
      .delete(`/admin/delete`)
      .set("Authorization", `Bearer ${normalUserToken}`) // Utiliser le token d'un non-admin
      .send({
        email: "normal@test.com",
      });

    // Vérifier que la réponse est 403 Forbidden
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });

  it("should return 404 if the user to delete does not exist", async () => {
    // Tentative de suppression d'un utilisateur inexistant
    const res = await request(app)
      .delete(`/admin/delete`)
      .set("Authorization", `Bearer ${adminUserToken}`)
      .send({
        email: "emailnonexist@gmail.com",
      });

    // Vérifier que la réponse est 403 Not Found
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });
});

// test GetAllUser
describe("GET /admin/getAllUsers", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Créer un utilisateur admin
    const adminUserResponse = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const adminUser = adminUserResponse.body;
    expect(adminUser).toHaveProperty("token");
    adminToken = adminUser.token;

    // Créer un utilisateur normal
    const userResponse = await request(app).post("/auth/register").send({
      name: "Normal User",
      email: "user@test.com",
      password: "password123",
      role: "user",
    });

    const user = userResponse.body;
    expect(user).toHaveProperty("token");
    userToken = user.token;
  });

  it("should get list of users if requester is admin", async () => {
    // Demander la liste des utilisateurs en tant qu'admin
    const res = await request(app)
      .get(`/admin/getAllUsers`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Vérifier que la requête réussit et renvoie une liste
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("should return 403 error if requester is not admin", async () => {
    // Tenter d'accéder à la liste des utilisateurs en tant qu'utilisateur non-admin
    const res = await request(app)
      .get(`/admin/getAllUsers`)
      .set("Authorization", `Bearer ${userToken}`);

    // Vérifier que la requête est interdite
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });
});

describe("GET /admin/getAllUsers?page=1&limit=10", () => {
  let adminToken: string;

  beforeAll(async () => {
    // Créez 10 utilisateurs pour le test
    await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        await request(app)
          .post("/auth/register")
          .send({
            name: `User ${index + 1}`,
            email: `user${index + 1}@test.com`,
            password: "password123",
            role: "user",
          });
      })
    );

    // Créer un utilisateur admin et obtenir le token
    const adminUserResponse = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const admin = adminUserResponse.body;
    expect(admin).toHaveProperty("token");
    adminToken = admin.token; // Stocker le token pour les tests suivants
  });

  afterEach(async () => {
    // Nettoyer la base de données après chaque test
    await User.deleteMany({});
  });

  it("should give 10 users for the 1st page", async () => {
    const res = await request(app)
      .get(`/admin/getAllUsers?page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Vérifiez que le statut est 200 et que le corps de la réponse contient les utilisateurs attendus
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(res.body.users.length).toBe(10); // Vérifiez le nombre d'utilisateurs
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
    // Créer un utilisateur admin pour chaque test et récupérer le token
    const adminUserResponse = await request(app).post("/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    const adminUser = adminUserResponse.body;
    expect(adminUser).toHaveProperty("token");
    adminToken = adminUser.token;

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

describe("PUT /admin/updateUserRole", () => {
  let normalUserToken: string;
  let adminUserToken: string;

  beforeAll(async () => {
    // Créer un utilisateur normal
    const normalUserResponse = await request(app).post("/auth/register").send({
      name: "User Normal",
      email: "normal-user@test.com",
      password: "password123",
      role: "user",
    });

    // Générer un token pour l'utilisateur normal
    normalUserToken = normalUserResponse.body.token; // Assurez-vous que le token est dans la réponse

    // Créer un utilisateur admin
    const adminUserResponse = await request(app).post("/auth/register").send({
      name: "User Admin",
      email: "admin-user@test.com",
      password: "adminpassword123",
      role: "admin",
    });

    // Générer un token pour l'utilisateur admin
    adminUserToken = adminUserResponse.body.token; // Assurez-vous que le token est dans la réponse
  });

  it("should update the role of a user", async () => {
    // Mise à jour du rôle de l'utilisateur normal en admin
    const res = await request(app)
      .put(`/admin/updateUserRole`) // Utilisez l'ID récupéré
      .set("Authorization", `Bearer ${adminUserToken}`) // Le token admin
      .send({
        email: "normal-user@test.com",
        role: "admin",
      });

    // Vérifiez que la réponse est correcte
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "User role updated successfully"
    );

    // Vérifiez que l'utilisateur a bien été mis à jour
    const updatedUser = await User.findOne({ email: "normal-user@test.com" });
    expect(updatedUser?.role).toBe("admin");
  });

  it("should return 403 if the user does not exist", async () => {
    const res = await request(app)
      .put(`/admin/updateUserRole`) // Un ID fictif
      .set("Authorization", `Bearer ${adminUserToken}`)
      .send({
        email: "not-user-exist@test.com",
        role: "admin",
      });

    expect(res.statusCode).toBe(403); // Vérifiez que la réponse est 404 Not Found
    expect(res.body).toHaveProperty("message", "Forbidden");
  });

  it("should return 403 if not authorized", async () => {
    const normalUser = await User.findOne({ email: "normal-user@test.com" });
    // Créer un utilisateur non-admin
    const nonAdminUserResponse = await request(app)
      .post("/auth/register")
      .send({
        name: "Non Admin User",
        email: "non-admin@test.com",
        password: "password123",
      });

    const nonAdminUserToken = nonAdminUserResponse.body.token; // Token de l'utilisateur non-admin

    // Essayer de mettre à jour le rôle de l'utilisateur normal avec un utilisateur non-admin
    const res = await request(app)
      .put(`/admin/updateUserRole`)
      .set("Authorization", `Bearer ${nonAdminUserToken}`) // Token non-admin
      .send({
        email: "non-admin@test.com",
        role: "admin",
      });

    expect(res.statusCode).toBe(403); // Vérifiez que la réponse est 403 Forbidden
    expect(res.body).toHaveProperty("message", "Forbidden");
  });
});
