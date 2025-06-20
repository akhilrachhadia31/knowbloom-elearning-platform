const isGuest = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    return res.status(403).json({ message: "Already logged in." });
  }

  next();
};

export default isGuest;
