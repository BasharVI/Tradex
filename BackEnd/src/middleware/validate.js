const AppError = require("../utils/AppError");

// Generic Joi validator. Sources: "body" | "query" | "params".
module.exports = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message).join("; ");
    return next(new AppError(details, 400, "VALIDATION_ERROR"));
  }
  req[source] = value;
  next();
};
