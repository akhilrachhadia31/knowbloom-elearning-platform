import express from "express";
import {
  login,
  register,
  getUserProfile,
  logout,
  updateProfile,
  updatePassword,
  checkCurrentPassword,
  verifyOtp,
  verifyEmailChange,
  forgotPassword,
  resetPassword,
  getUserByUsername,
  getInstructorById,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import isGuest from "../middlewares/isGuest.js";
import upload from "../utils/multer.js";
import passport from "passport";

const router = express.Router();

router.post("/register", isGuest, register);
router.post("/login", isGuest, login);
router.get("/logout", logout);

router.get("/my-profile", isAuthenticated, getUserProfile);

router.put(
  "/update-profile",
  isAuthenticated,
  upload.single("profilePhoto"),
  updateProfile
);

router.put("/update-password", isAuthenticated, updatePassword);
router.post("/check-password", isAuthenticated, checkCurrentPassword);
router.post("/verify-otp", verifyOtp);
router.post("/verify-email-change", isAuthenticated, verifyEmailChange);

// Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL,
    // Redirects to a client route showing the login failure message
    failureRedirect: "/login/failed",
  })
);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/by-username/:username", getUserByUsername);
router.get("/api/users/:id", getInstructorById);

export default router;
