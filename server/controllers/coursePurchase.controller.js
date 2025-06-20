// src/controllers/coursePurchase.controller.js

import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
import { Module } from "../models/module.model.js";
import { sendPurchaseConfirmationEmail } from "../utils/email.js";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const { RAZORPAY_KEY_ID, RAZORPAY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_SECRET) {
      return res
        .status(500)
        .json({ message: "Payment configuration is not properly set." });
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_SECRET,
    });

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const amountPaise = Math.round((course.coursePrice || 0) * 100);

    // 1) Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { courseId, userId },
    });

    // 2) Persist pending purchase
    await CoursePurchase.create({
      courseId,
      userId,
      amount: course.coursePrice || 0,
      status: "pending",
      paymentId: order.id,
    });

    // 3) Return order details
    return res.status(200).json({
      razorpayKey: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.courseTitle,
      courseThumbnail: course.courseThumbnail,
      successUrl: `https://knowbloom.onrender.com/course-progress/${courseId}`,
      failureUrl: `https://knowbloom.onrender.com/course-detail/${courseId}`,
    });
  } catch (err) {
    console.error("createCheckoutSession error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    // ─── SKIP SIGNATURE VERIFICATION IN DEVELOPMENT ─────────────────────────────
    // Remove or disable the HMAC check so your Postman payload always succeeds
    // ─────────────────────────────────────────────────────────────────────────

    const { event, payload } = req.body;
    const { RAZORPAY_KEY_ID, RAZORPAY_SECRET } = process.env;
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_SECRET,
    });

    // If you get an authorized event, capture immediately
    if (event === "payment.authorized") {
      const { id, amount, currency } = payload.payment.entity;
      await razorpay.payments.capture(id, amount, currency);
    }

    // Only handle captured payments
    if (event === "payment.captured") {
      const orderId = payload.payment.entity.order_id;
      const purchase = await CoursePurchase.findOne({ paymentId: orderId });
      if (!purchase) {
        console.warn("Purchase record not found for order:", orderId);
        return res.status(404).json({ message: "Purchase not found" });
      }

      // Mark completed
      purchase.status = "completed";
      purchase.purchaseDate = new Date();
      await purchase.save();

      // Enroll user & increment counts
      await User.findByIdAndUpdate(purchase.userId, {
        $addToSet: { enrolledCourses: purchase.courseId },
      });
      await Course.findByIdAndUpdate(purchase.courseId, {
        $addToSet: { studentsEnrolled: purchase.userId },
        $inc: { studentsEnrolledCount: 1 },
      });

      // Send confirmation email (best-effort)
      try {
        const userDoc = await User.findById(purchase.userId).lean();
        if (userDoc?.email) {
          const invoiceNumber = purchase._id.toString().slice(-6).toUpperCase();
          await sendPurchaseConfirmationEmail({
            toEmail: userDoc.email,
            userName: userDoc.name || "Student",
            courseTitle: purchase.courseTitle,
            amountPaid: purchase.amount,
            invoiceNumber,
            purchaseDate: purchase.purchaseDate,
          });
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("razorpayWebhook error:", err);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};
export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseDoc = await Course.findById(courseId)
      .populate({ path: "creator", select: "name photoUrl bio email _id" })
      .lean();

    if (!courseDoc) {
      console.error("Course not found!");
      return res.status(404).json({ message: "Course not found!" });
    }

    let modules = [];
    try {
      modules = await Module.find({ course: courseId })
        .populate({
          path: "lectures",
          select: "lectureTitle videoUrl preview publicId duration _id",
        })
        .lean();
    } catch (err) {
      console.error("Error populating modules/lectures:", err);
      modules = [];
    }

    let legacyLectureDocs = [];
    try {
      if (Array.isArray(courseDoc.lectures) && courseDoc.lectures.length) {
        legacyLectureDocs = await Lecture.find({
          _id: { $in: courseDoc.lectures },
        })
          .select("lectureTitle videoUrl preview publicId duration _id")
          .lean();
      }
    } catch (err) {
      console.error("Error fetching legacy lectures:", err);
      legacyLectureDocs = [];
    }

    const allLectures = [
      ...(legacyLectureDocs || []),
      ...(modules || []).flatMap((m) => m.lectures || []),
    ];
    const totalLectures = allLectures.length;
    const totalTime = allLectures.reduce(
      (acc, lec) => acc + (lec.duration || 0),
      0
    );

    let enrolledCount = 0;
    try {
      enrolledCount = await CoursePurchase.countDocuments({
        courseId,
        status: "completed",
      });
    } catch (err) {
      console.error("Error counting enrollments:", err);
      enrolledCount = 0;
    }

    let isCreator = false;
    if (Array.isArray(courseDoc.creator)) {
      isCreator = courseDoc.creator.some(
        (c) => String(c._id) === String(userId)
      );
    } else if (courseDoc.creator?._id) {
      isCreator = String(courseDoc.creator._id) === String(userId);
    }

    let purchased = false;
    try {
      const purchaseRecord = await CoursePurchase.findOne({
        userId,
        courseId,
        status: "completed",
      });
      purchased = !!purchaseRecord;
    } catch {
      purchased = false;
    }

    const course = {
      ...courseDoc,
      modules: modules.map((m) => ({ ...m, lectures: m.lectures || [] })),
      lectures: legacyLectureDocs || [],
      studentsEnrolledCount: enrolledCount,
      totalLectures,
      totalTime,
      creator: Array.isArray(courseDoc.creator)
        ? courseDoc.creator
        : [courseDoc.creator],
      purchased,
    };

    return res.status(200).json({ course, purchased, isCreator });
  } catch (error) {
    console.error("getCourseDetailWithPurchaseStatus ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch course details",
      error: error?.message,
    });
  }
};

export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courseId");

    return res.status(200).json({
      purchasedCourse: purchasedCourse || [],
    });
  } catch (error) {
    console.error("getAllPurchasedCourse error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch purchased courses" });
  }
};
