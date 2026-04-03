// ============================================================
// AUTH VALIDATORS
// ============================================================
const Joi = require('joi');

const loginSchema = Joi.object({
  email:       Joi.string().email().required(),
  password:    Joi.string().min(6).required(),
  deviceToken: Joi.string().optional(),
  deviceType:  Joi.string().valid('WEB','MOBILE').default('WEB'),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(), // also accepted via cookie
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

module.exports = { loginSchema, refreshSchema, changePasswordSchema };
