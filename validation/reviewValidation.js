const Joi = require("joi");

exports.reviewSessionValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    scores: Joi.object()
      .pattern(Joi.string(), Joi.number().min(0).max(100))
      .required(),
    notes: Joi.object().pattern(Joi.string(), Joi.string().allow("")),
  });

  return schema.validate(data);
};
