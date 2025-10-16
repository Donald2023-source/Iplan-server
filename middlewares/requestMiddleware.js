const RequestMiddleware = (req, res, next) => {
  if (!req.cookies || !req.cookies.auth_token) {
    return res
      .status(403)
      .json({ error: "auth_token cookie not found in request", status: 403 });
  }
  next();
};

module.exports = RequestMiddleware;
