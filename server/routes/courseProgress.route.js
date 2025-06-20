// src/routes/courseProgress.routes.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getCourseProgress,
  updateLectureProgress,
  unviewLectureProgress,
  markAsCompleted,
  markAsInCompleted,
} from "../controllers/courseProgress.controller.js";
import {
  getCourseStudents,
  removeStudent,
} from "../controllers/course.controller.js";

const router = express.Router();

router.route("/:courseId").get(isAuthenticated, getCourseProgress);
router
  .route("/:courseId/lecture/:lectureId/view")
  .post(isAuthenticated, updateLectureProgress);
router
  .route("/:courseId/lecture/:lectureId/unview")
  .post(isAuthenticated, unviewLectureProgress);
router.route("/:courseId/complete").post(isAuthenticated, markAsCompleted);
router.route("/:courseId/incomplete").post(isAuthenticated, markAsInCompleted);

// new “students” list & removal
router.route("/:courseId/students").get(isAuthenticated, getCourseStudents);
router
  .route("/:courseId/students/:studentId")
  .delete(isAuthenticated, removeStudent);

export default router;
