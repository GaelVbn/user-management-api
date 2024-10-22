const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.base": `"name" should be a type of 'text'`,
    "string.empty": `"name" cannot be an empty field`,
    "any.required": `"name" is a required field`,
  }),
  email: Joi.string().email().required().messages({
    "string.email": `"email" must be a valid email`,
    "any.required": `"email" is a required field`,
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": `"password" should have a minimum length of {#limit}`,
    "any.required": `"password" is a required field`,
  }),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": `"email" must be a valid email`,
    "any.required": `"email" is a required field`,
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": `"password" should have a minimum length of {#limit}`,
    "any.required": `"password" is a required field`,
  }),
});

// Exportez les schémas
module.exports = { registerSchema, loginSchema };
