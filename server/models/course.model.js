// src/models/course.model.js

import mongoose from "mongoose";

// ─────── Enrollment Sub‐document ───────
const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: () => new Date(),
    },
    completedLectures: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      required: true,
    },
    lastActive: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },  
  { _id: true }
);

// ─────────── Review Sub‐document ────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ─────────── Course Schema ────────────
const CourseSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true },
    courseSubtitle: { type: String, default: "" },
    courseDescription: { type: String, default: "" },
    category: { type: String, required: true },
    courseLevel: { type: String, default: "Beginner" },
    coursePrice: { type: Number, default: 0 },
    courseThumbnail: { type: String, default: "" },
    creator: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
    studentsEnrolled: [EnrollmentSchema],
    isPublished: { type: Boolean, default: false },
    whatYouWillLearn: [{ type: String, default: "" }],
    priorRequirements: [{ type: String, default: "" }],
    announcements: {
      type: [AnnouncementSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", CourseSchema);
export const Review = mongoose.model("Review", reviewSchema);
