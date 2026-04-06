// ============================================================
// TRANSFER VALIDATORS
// ============================================================
const Joi = require('joi');

const createTransferSchema = Joi.object({
  equipment_id:          Joi.string().uuid().required(),
  type:                  Joi.string().valid('INTER_UNIT','INTER_BASE','TEMPORARY_LOAN','PERMANENT_TRANSFER').required(),
  priority:              Joi.string().valid('LOW','NORMAL','HIGH','URGENT').default('NORMAL'),
  receiving_officer_id:  Joi.string().uuid().required(),
  to_unit_id:            Joi.string().uuid().optional(),
  to_base_id:            Joi.string().uuid().required(),
  reason:                Joi.string().max(500).required(),
  notes:                 Joi.string().max(1000).optional(),
});

const dispatchTransferSchema = Joi.object({
  dispatch_latitude:  Joi.number().min(-90).max(90).optional(),
  dispatch_longitude: Joi.number().min(-180).max(180).optional(),
});

const receiveTransferSchema = Joi.object({
  receipt_latitude:  Joi.number().min(-90).max(90).optional(),
  receipt_longitude: Joi.number().min(-180).max(180).optional(),
});

module.exports = { createTransferSchema, dispatchTransferSchema, receiveTransferSchema };
