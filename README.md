# User Management API

This project is a user management API built with the MEN stack (MongoDB, Express, Node.js). It enables user management with features such as registration, login, and profile retrieval. Authentication is handled via JWT (JSON Web Tokens).

## Table of Contents

- [Features](#features)
- [Middlewares](#middlewares)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Postman API Documentation](#postman-api-documentation)
- [Tests](#tests)

---

## Features

### Authentication

- **User Registration**: Allows a new user to sign up with a unique email.
- **User Login**: Authenticates a user with an email and password.
- **User Profile Retrieval**: Access the user profile with a valid JWT token.
- **Forgot Password**: Handles password reset through email.

### User Management

The user management module is divided into two sections:

- **Users**:

  - Retrieve profile details
  - Update user password and name
  - Request email change and verify the new address

- **Admin**:
  - Delete a user by ID
  - List all users
  - Update user name or role
  - Send a password reset email to the user's new email

---

## Middlewares

This API uses several middlewares to handle security, validation, and request limiting.

### Security and Validation Middlewares

- **sanitizeMiddleware**: Cleans user inputs to prevent XSS attacks.
- **loggerMiddleware**: Configures the Winston logger to log in JSON format to both the `combined.log` file and the console. Uses Morgan to log HTTP requests.
- **errorMiddleware**: Manages global application errors, returning specific or generic error messages based on the case.
- **validateRegister** and **validateLogin**: Respectively validate registration and login data against predefined schemas. If validation fails, they return a 400 error.

### Rate Limiting and Authentication Middlewares

- **loginLimiter**: Limits login attempts by IP within a 15-minute window. If the limit is exceeded, it returns a 429 error.
- **protect**: Checks the validity of a JWT token to authenticate the user and adds user information to the request object.
- **authRole**: Restricts route access based on the user role. If the role does not match, it returns a 403 error.

---

## Prerequisites

- **Node.js** and **npm** installed locally.
- **MongoDB** (locally or hosted).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/GaelVbn/user-management-api.git

   ```

2. Install dependencies:

   npm install

3. Create a .env file in the project root with the following details:

   MONGO_URI=mongodb://localhost:27017/user-management
   JWT_SECRET=tonSecret

   //nodemailer
   MAIL_HOST=
   MAIL_PORT=
   EMAIL_USER=
   EMAIL_PASS=
   FRONTEND_URL=

   --> To generate the JWT_SECRET key, run this command in the terminal:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. Start the server in development mode:

   npm run dev

   Or to start the server in production mode: npm start

## Postman API Documentation

A Postman collection with all the API requests is available, making it easy to test the API:

- File : `postman/user-management-api.postman_collection.json`
- Documentation : "https://documenter.getpostman.com/view/36793061/2sAY4x9MMF"

### Instructions :

1. Download the `.json` file.
2. Open Postman.
3. Click on **Import** in Postman and select the JSON file.
4. Use the different available requests to test the API (registration, login, profile retrieval, etc.).

## Tests

Automated tests are included to verify the API’s functionality. These cover unit tests, integration tests, and functional scenarios.

Run the tests with the following command: npm test
