// middlewares/isAdmin.js

export default function isAdmin(req, res, next) {
  // Assuming `isAuthenticated` sets req.user or req.role
  // Adjust according to your auth middleware’s implementation:
  const user = req.user || {};
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }
  next();
}
