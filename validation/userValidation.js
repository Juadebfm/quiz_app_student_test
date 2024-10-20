const Joi = require("joi");

// Define a schema that includes the `username` field
const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    username: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
