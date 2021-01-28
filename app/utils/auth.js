const jwt = require("jsonwebtoken");

const getToken = req => {
  const authHeader = req.get("authorization");
  const token =
    authHeader &&
    authHeader.toLowerCase().startsWith("bearer") &&
    authHeader.substring(7);

  return token;
};

const checkToken = async (req, res, next) => {
  const token = getToken(req);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  req.userId = decodedToken.id;
  next();
};

module.exports = {
  getToken,
  checkToken,
};
