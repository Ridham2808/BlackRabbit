// ============================================================
// CHECKOUT VALIDATORS
// ============================================================
const Joi = require('joi');

const createCheckoutSchema = Joi.object({
  equipment_id:          Joi.string().uuid().required(),
  purpose:               Joi.string().valid('MISSION','TRAINING','MAINTENANCE','INSPECTION','EXERCISE','EMERGENCY').required(),
  expected_return_at:    Joi.date().iso().greater('now').required(),
  condition_on_checkout: Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').required(),
  digital_signature_data:Joi.string().optional(), // base64 PNG
  biometric_verified:    Joi.boolean().default(false),
  biometric_type:        Joi.string().valid('FINGERPRINT','FACE_ID','PIN_OVERRIDE').optional(),
  checkout_latitude:     Joi.number().min(-90).max(90).optional(),
  checkout_longitude:    Joi.number().min(-180).max(180).optional(),
  assigned_user_id:      Joi.string().uuid().optional().allow(null),
  request_id:            Joi.string().uuid().optional().allow(null),
});

const checkInSchema = Joi.object({
  condition_on_return: Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').required(),
  return_latitude:     Joi.number().min(-90).max(90).optional(),
  return_longitude:    Joi.number().min(-180).max(180).optional(),
  notes:               Joi.string().max(500).optional(),
});

module.exports = { createCheckoutSchema, checkInSchema };
