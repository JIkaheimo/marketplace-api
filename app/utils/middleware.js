const errorHandler = (error, req, res, next) => {
  // Add any error specific handler code here.
  switch (error.name) {
    case "CastError":
      res.status(400).json({ message: "Malformatted id." });
    case "ValidationError":
      res.status(400).json({ message: "Malformatted data." });
    default:
      res.status(500).json({ message: "Something went wrong. :(" });
  }

  next(error);
};

const unknownHandler = (req, res) => {
  res.status(404).send({ message: "Unknown endpoint." });
};

module.exports = { errorHandler, unknownHandler };
