// ============================================================
// PERSONNEL VALIDATORS
// ============================================================
const Joi = require('joi');

const createPersonnelSchema = Joi.object({
  service_number:  Joi.string().max(20).required(),
  full_name:       Joi.string().max(100).required(),
  email:           Joi.string().email().required(),
  phone:           Joi.string().max(20).optional(),
  password:        Joi.string().min(8).required(),
  role:            Joi.string().valid('SOLDIER','OFFICER','QUARTERMASTER','BASE_ADMIN','AUDITOR','TECHNICIAN','SUPER_ADMIN').required(),
  rank:            Joi.string().max(50).required(),
  unit_id:         Joi.string().uuid().optional(),
  base_id:         Joi.string().uuid().required(),
  clearance_level: Joi.number().integer().min(1).max(5).default(1),
});

const updatePersonnelSchema = Joi.object({
  full_name:       Joi.string().max(100).optional(),
  phone:           Joi.string().max(20).allow('').optional(),
  rank:            Joi.string().max(50).optional(),
  unit_id:         Joi.string().uuid().optional(),
  base_id:         Joi.string().uuid().optional(),
  clearance_level: Joi.number().integer().min(1).max(5).optional(),
  avatar_url:      Joi.string().uri().allow('').optional(),
});

const listPersonnelSchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(2000).default(20),
  role:    Joi.string().optional(),
  base_id: Joi.string().uuid().optional(),
  unit_id: Joi.string().uuid().optional(),
  search:  Joi.string().max(100).allow('').optional(),
  active:  Joi.boolean().optional(),
});

module.exports = { createPersonnelSchema, updatePersonnelSchema, listPersonnelSchema };
