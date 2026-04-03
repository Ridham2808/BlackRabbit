// ============================================================
// EQUIPMENT VALIDATORS
// ============================================================
const Joi = require('joi');

const createEquipmentSchema = Joi.object({
  serial_number:  Joi.string().max(50).required(),
  name:           Joi.string().max(150).required(),
  category_id:    Joi.string().uuid().required(),
  description:    Joi.string().max(1000).optional(),
  manufacturer:   Joi.string().max(100).optional(),
  model_number:   Joi.string().max(100).optional(),
  purchase_date:  Joi.date().iso().optional(),
  purchase_price: Joi.number().positive().optional(),
  condition:      Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').default('GOOD'),
  home_base_id:   Joi.string().uuid().required(),
  home_unit_id:   Joi.string().uuid().optional(),
  tags:           Joi.array().items(Joi.string()).optional(),
  specifications: Joi.object().optional(),
  images:         Joi.array().items(Joi.string().uri()).optional(),
  notes:          Joi.string().max(2000).optional(),
});

const updateEquipmentSchema = Joi.object({
  name:           Joi.string().max(150).optional(),
  category_id:    Joi.string().uuid().optional(),
  description:    Joi.string().max(1000).allow('').optional(),
  manufacturer:   Joi.string().max(100).optional(),
  model_number:   Joi.string().max(100).optional(),
  condition:      Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').optional(),
  tags:           Joi.array().items(Joi.string()).optional(),
  specifications: Joi.object().optional(),
  images:         Joi.array().items(Joi.string()).optional(),
  notes:          Joi.string().max(2000).allow('').optional(),
});

const listEquipmentSchema = Joi.object({
  page:        Joi.number().integer().min(1).default(1),
  limit:       Joi.number().integer().min(1).max(100).default(20),
  status:      Joi.string().optional(),
  category_id: Joi.string().uuid().optional(),
  condition:   Joi.string().optional(),
  search:      Joi.string().max(100).optional(),
  base_id:     Joi.string().uuid().optional(),
  unit_id:     Joi.string().uuid().optional(),
  sort_by:     Joi.string().valid('name','serial_number','status','created_at','next_maintenance_due').default('created_at'),
  sort_dir:    Joi.string().valid('asc','desc').default('desc'),
});

module.exports = { createEquipmentSchema, updateEquipmentSchema, listEquipmentSchema };
