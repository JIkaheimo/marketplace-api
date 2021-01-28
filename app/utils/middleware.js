const errorHandler = (error, req, res, next) => {
  // Add any error specific handler code here.

  switch (error.name) {
    case "CastError":
      res.status(400).json({ message: "Malformatted id." });
      break;
    case "JsonWebTokenError":
      res.status(401).json({ message: "Unauthorized" });
      break;
    case "ValidationError":
      const errorFields = Object.keys(error.errors);
      const firstError = error.errors[errorFields[0]];

      switch (firstError.kind) {
        case "unique":
          res
            .status(409)
            .json({ message: `${firstError.path} already in use` });
          break;
        default:
          res.status(400).json({ message: firstError.message });
      }
  }

  next(error);
};

const unknownHandler = (req, res) => {
  res.status(404).send({ message: "Unknown endpoint." });
};

module.exports = { errorHandler, unknownHandler };
