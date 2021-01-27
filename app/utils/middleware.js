const errorHandler = (error, req, res, next) => {
  switch (error.name) {
    case "CastError":
      res.status(400).json({ message: "Malformatted id" });
    case "ValidationError":
      res.status(400).json({ message: error.message });
  }

  next(error);
};

const unknownHandler = (req, res) => {
  res.status(404).send({ message: "unknown endpoint" });
};

module.exports = { errorHandler, unknownHandler };
