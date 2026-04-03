// ============================================================
// LOCATION VALIDATORS
// ============================================================
const Joi = require('joi');

const locationPingSchema = Joi.object({
  equipment_id: Joi.string().uuid().optional(),
  latitude:     Joi.number().min(-90).max(90).required(),
  longitude:    Joi.number().min(-180).max(180).required(),
  accuracy:     Joi.number().positive().optional(),
  altitude:     Joi.number().optional(),
  speed:        Joi.number().min(0).optional(),
  heading:      Joi.number().min(0).max(360).optional(),
});

module.exports = { locationPingSchema };
