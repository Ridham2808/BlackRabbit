// ============================================================
// MAINTENANCE VALIDATORS
// ============================================================
const Joi = require('joi');

const scheduleMaintSchema = Joi.object({
  equipment_id:             Joi.string().uuid().required(),
  type:                     Joi.string().valid('ROUTINE','EMERGENCY','CALIBRATION','INSPECTION','OVERHAUL','REPAIR').required(),
  scheduled_date:           Joi.date().iso().required(),
  assigned_technician_id:   Joi.string().uuid().optional(),
  notes:                    Joi.string().max(1000).optional(),
});

const completeMaintenanceSchema = Joi.object({
  work_performed:               Joi.string().required(),
  parts_replaced:               Joi.object().optional(),
  total_cost:                   Joi.number().positive().optional(),
  condition_before:             Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').optional(),
  condition_after:              Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').required(),
  technician_signature_data:    Joi.string().optional(),
  is_fit_for_duty:              Joi.boolean().required(),
  next_maintenance_recommended: Joi.date().iso().optional(),
});

module.exports = { scheduleMaintSchema, completeMaintenanceSchema };
