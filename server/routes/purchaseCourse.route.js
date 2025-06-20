// src/routes/coursePurchase.router.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailWithPurchaseStatus,
  razorpayWebhook,
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// 1) POST /api/v1/purchase/checkout/create-checkout-session
router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, createCheckoutSession);

// 2) POST /api/v1/purchase/webhook
// handled as JSON body in app.js
router.route("/webhook").post(razorpayWebhook);

// 3) GET /api/v1/purchase/course/:courseId/detail-with-status
router
  .route("/course/:courseId/detail-with-status")
  .get(isAuthenticated, getCourseDetailWithPurchaseStatus);

// 4) GET /api/v1/purchase/
router.route("/").get(isAuthenticated, getAllPurchasedCourse);

export default router;
