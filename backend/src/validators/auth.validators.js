// ============================================================
// AUTH VALIDATORS
// ============================================================
const Joi = require('joi');

const loginSchema = Joi.object({
  serviceNumber: Joi.string().min(8).max(20).required(),
  password:      Joi.string().min(8).required(),
  deviceInfo:    Joi.object({
    deviceId:    Joi.string().optional(),
    deviceModel: Joi.string().optional(),
    osVersion:   Joi.string().optional(),
    appVersion:  Joi.string().optional(),
  }).optional(),
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
