// ============================================================
// EQUIPMENT VALIDATORS
// ============================================================
const Joi = require('joi');

const createEquipmentSchema = Joi.object({
  serial_number:  Joi.string().max(50).required(),
  name:           Joi.string().max(150).required(),
  category_id:    Joi.string().uuid().required(),
  description:    Joi.string().max(1000).optional().allow(''),
  manufacturer:   Joi.string().max(100).optional().allow(''),
  model_number:   Joi.string().max(100).optional().allow(''),
  purchase_date:  Joi.date().iso().optional().allow(''),
  purchase_price: Joi.number().positive().optional().allow(''),
  condition:      Joi.string().valid('EXCELLENT','GOOD','FAIR','POOR','DAMAGED').default('GOOD'),
  home_base_id:   Joi.string().uuid().required(),
  home_unit_id:   Joi.string().uuid().optional().allow('', null),
  tags:           Joi.array().items(Joi.string()).optional(),
  specifications: Joi.object().optional(),
  images:         Joi.array().items(Joi.string().uri()).optional(),
  notes:          Joi.string().max(2000).optional().allow(''),
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
  limit:       Joi.number().integer().min(1).max(2000).default(20),
  status:      Joi.string().optional().allow(''),
  category_id: Joi.string().uuid().optional().allow(''),
  condition:   Joi.string().optional().allow(''),
  search:      Joi.string().max(100).optional().allow(''),
  base_id:     Joi.string().uuid().optional().allow(''),
  unit_id:     Joi.string().uuid().optional().allow(''),
  sort_by:     Joi.string().valid('name','serial_number','status','created_at','next_maintenance_due').default('created_at'),
  sort_dir:    Joi.string().valid('asc','desc').default('desc'),
});

module.exports = { createEquipmentSchema, updateEquipmentSchema, listEquipmentSchema };
