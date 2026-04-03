// ============================================================
// VALIDATE REQUEST MIDDLEWARE — Joi schema factory
// Usage: validateRequest(myJoiSchema)
// Returns 400 with field-level errors if validation fails
// ============================================================

function validateRequest(schema, target = 'body') {
  return (req, res, next) => {
    const data = target === 'query' ? req.query
               : target === 'params' ? req.params
               : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly:    false,
      stripUnknown:  true,
      allowUnknown:  false,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.context?.key || 'unknown',
        message: d.message.replace(/['"]/g, ''),
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace with stripped/coerced value
    if (target === 'query')  req.query  = value;
    else if (target === 'params') req.params = value;
    else req.body = value;

    next();
  };
}

module.exports = validateRequest;
