# API de Gestion d'Utilisateurs

Ce projet est une API de gestion d'utilisateurs construite avec la stack MEN (MongoDB, Express, Node.js). Il permet de gérer les utilisateurs avec des fonctionnalités comme l'inscription, la connexion et la récupération du profil utilisateur. L'authentification se fait via JWT (JSON Web Tokens).

## Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Documentation API Postman](#documentation-api-postman)
- [Tests](#tests)
- [AuthSecurity](#auth-security)
- [AuthRole](#auth-role)

## Fonctionnalités

- **Inscription** d'un utilisateur avec un email unique
- **Connexion** d'un utilisateur avec un email et un mot de passe
- **Récupération du profil utilisateur** avec un token JWT

## Prérequis

- Node.js et npm installés localement
- MongoDB (local ou hébergé)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/ton-utilisateur/nom-du-repo.git
   cd nom-du-repo
   ```
2. Installer les dépendances :

   npm install

3. Créez un fichier .env à la racine du projet avec les informations suivantes :

   MONGO_URI=mongodb://localhost:27017/user-management
   JWT_SECRET=tonSecret

   -> dans le terminal effectuer cette ligne de commande pour générer la key de 'tonSecret' :
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. Lancer le serveur en mode développement :

   npm run dev

   ou en mode production => npm start

## Documentation API Postman

Un fichier Postman contenant les requêtes de l'API est disponible. Vous pouvez l'importer dans Postman pour tester facilement l'API :

- Fichier : `postman/user-management-api.postman_collection.json`

### Instructions :

1. Télécharger le fichier `.json`.
2. Ouvrir Postman.
3. Cliquer sur **Import** dans Postman et sélectionner le fichier JSON.
4. Utilisez les différentes requêtes disponibles pour tester l'API (inscription, connexion, récupération du profil, etc.).

## Tests

La section des tests inclut des tests automatisés pour vérifier les fonctionnalités de l'API. Cela couvre les scénarios de tests unitaires, d'intégration et fonctionnels.

Tous les tests sont détaillés dans le fichier **tests**/TESTS.md. Ce fichier inclut des exemples de cas de tests comme :

- Inscription d'un nouvel utilisateur
- Tentative de connexion avec des informations incorrectes

Exécutez les tests avec la commande : npm test

## AuthSecurity

### Validation des Entrées Utilisateurs avec Joi

Pour valider les entrées des utilisateurs dans les routes d'inscription et de connexion, nous utilisons la bibliothèque **Joi**. Cela garantit que les données envoyées au serveur respectent un certain format, évitant ainsi les données incorrectes ou potentiellement malveillantes.

#### Intégration de Joi

Dans notre route d'inscription, nous avons défini un schéma `registerSchema` pour valider les champs suivants :

- `name` : doit être une chaîne de caractères.
- `email` : doit être un email valide.
- `password` : doit être une chaîne de caractères avec un minimum de 6 caractères.

-> Vous trouverez le schema dans le fichier `models/validations.js`
-> Vous trouverez le middleware dans le fichier `middlewares/validationMiddleware.js`

#### Intégration de Express-rate-limit

Pour protéger l'application contre les attaques par force brute, nous utilisons express-rate-limit. Ce middleware limite le nombre de tentatives de connexion échouées par une IP donnée pendant une certaine période.

Dans notre route de connexion, nous avons mis en place une limite de 5 tentatives de connexion échouées par IP sur une fenêtre de 15 minutes. Si cette limite est dépassée, l'IP sera bloquée pendant 15 minutes supplémentaires avant de pouvoir réessayer.

-> Vous trouverez ce middleware dans le fichier `middlewares/loginLimiterMiddleware.js`

Ce middleware est ensuite utilisé dans la route de connexion : `router.post("/login", loginLimiter, validateLogin, loginUser);`

## AuthRole

Cette API utilise un système de rôles pour gérer les autorisations des utilisateurs. Actuellement, seule l'option de suppression d'un utilisateur est restreinte aux administrateurs.

### Rôles disponibles

- **admin** : Accès complet, y compris la possibilité de supprimer des utilisateurs.
- **user** : Accès limité, sans la possibilité de supprimer d'autres utilisateurs.

### Routes protégées

- **DELETE** `/users/delete/:id` : Seuls les utilisateurs avec le rôle **admin** peuvent accéder à cette route pour supprimer un utilisateur.

### Exemple d'Utilisation

Pour supprimer un utilisateur, un administrateur doit envoyer une requête DELETE à la route suivante :

- DELETE http://localhost:3001/users/delete/:id

#### Exemple de requête

Voici un exemple de requête à effectuer avec **curl** :

     curl -X DELETE http://localhost:3001/users/delete/67164ca6b8d16dba8f39bf3a \
      -H "Authorization: Bearer <TOKEN_ADMIN>"

Assurez-vous d’inclure un token JWT valide avec le rôle admin dans l’en-tête Authorization pour accéder à cette route.
Si un utilisateur sans le rôle d'administrateur tente d'accéder à cette route, il recevra une réponse d'erreur (403 Forbidden).
