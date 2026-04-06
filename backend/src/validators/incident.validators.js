// ============================================================
// ADVANCED INCIDENT VALIDATORS
// ============================================================
const Joi = require('joi');

const reportIncidentSchema = Joi.object({
  equipment_ids:              Joi.array().items(Joi.string().uuid()).min(1).optional(),
  equipment_serials:          Joi.array().items(Joi.string().max(50)).min(1).optional(),
  type:                       Joi.string().valid('DAMAGED','LOST','STOLEN','DESTROYED','FOUND','TAMPERED').required(),
  severity:                   Joi.string().valid('MINOR','MODERATE','SEVERE','CRITICAL').required(),
  description:                Joi.string().min(10).max(2000).required(),
  last_known_latitude:        Joi.number().min(-90).max(90).optional(),
  last_known_longitude:       Joi.number().min(-180).max(180).optional(),
  last_known_location_description: Joi.string().max(500).optional(),
  estimated_value_loss:       Joi.number().min(0).optional(),
  police_report_number:       Joi.string().max(100).optional(),
  witness_personnel_ids:      Joi.array().items(Joi.string().uuid()).optional(),
  witness_personnel_serials:  Joi.array().items(Joi.string().max(50)).optional(), 
}).or('equipment_ids', 'equipment_serials');

const updateIncidentSchema = Joi.object({
  status:              Joi.string().valid('OPEN','UNDER_INVESTIGATION','RESOLVED','CLOSED','ESCALATED','CO_ACKNOWLEDGED').optional(),
  investigation_notes: Joi.string().max(2000).optional(),
  resolution_notes:    Joi.string().max(2000).optional(),
});

const resolveIncidentSchema = Joi.object({
  resolution_notes:    Joi.string().max(2000).required(),
  resolutions:         Joi.array().items(Joi.object({
    equipment_id:      Joi.string().uuid().required(),
    outcome:           Joi.string().required(),
    blame_personnel_id: Joi.string().uuid().optional(),
  })).min(1).required(),
});

module.exports = { 
  reportIncidentSchema, 
  updateIncidentSchema,
  resolveIncidentSchema 
};
