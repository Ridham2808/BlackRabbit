// ============================================================
// INCIDENT VALIDATORS
// ============================================================
const Joi = require('joi');

const reportIncidentSchema = Joi.object({
  equipment_id:               Joi.string().uuid().required(),
  type:                       Joi.string().valid('DAMAGED','LOST','STOLEN','DESTROYED','FOUND','TAMPERED').required(),
  severity:                   Joi.string().valid('MINOR','MODERATE','SEVERE','CRITICAL').required(),
  description:                Joi.string().max(2000).required(),
  last_known_latitude:        Joi.number().min(-90).max(90).optional(),
  last_known_longitude:       Joi.number().min(-180).max(180).optional(),
  last_known_location_description: Joi.string().max(500).optional(),
  estimated_value_loss:       Joi.number().positive().optional(),
  police_report_number:       Joi.string().max(100).optional(),
});

const updateIncidentSchema = Joi.object({
  status:              Joi.string().valid('OPEN','UNDER_INVESTIGATION','RESOLVED','CLOSED','ESCALATED').optional(),
  investigation_notes: Joi.string().max(2000).optional(),
  resolution_notes:    Joi.string().max(2000).optional(),
});

module.exports = { reportIncidentSchema, updateIncidentSchema };
