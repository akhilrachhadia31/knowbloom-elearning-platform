// src/routes/course.routes.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

import {
  createCourse,
  searchCourse,
  getPublishedCourse,
  getCreatorCourses,
  getMyLearningCourses,
  getCourseStudents,
  editCourse,
  getCourseById,
  createLecture, // legacy lecture (not used here for module lectures)
  getCourseLecture, // legacy lecture listing
  removeLecture, // legacy remove
  getLectureById, // legacy get
  togglePublishCourse,
  deleteCourse,
  getCourseDetail,
  getCoursesByCreator,
  removeLectureVideo,
  getLectureQuiz,
  setLectureQuiz,
  removeLectureQuiz,
  removeStudent,
  sendCourseInfo,
  createReview,
  getCourseReviews,
  updateReview,
  getCourseAnnouncements,
  createCourseAnnouncement,
  updateCourseAnnouncement,
  deleteCourseAnnouncement,
} from "../controllers/course.controller.js";

import {
  createModule,
  getCourseModules,
  getModuleById,
  editModule,
  removeModule,
  createModuleLecture,
  getModuleLectures,
  editModuleLecture,
  removeModuleLecture,
  getModuleLectureVideoInfo,
} from "../controllers/module.controller.js";

const router = express.Router();

// ------------------- COURSE ROUTES -------------------

// 1) Create a new course
router.post(
  "/",
  isAuthenticated,
  upload.single("courseThumbnail"),
  createCourse
);

// 2) Search published courses
router.get("/search", searchCourse);

// 3) Get all published courses
router.get("/published-courses", getPublishedCourse);

// 4) Get all courses by creator
router.get("/", isAuthenticated, getCreatorCourses);

// 5) Get courses I’m learning
router.get("/my-learning", isAuthenticated, getMyLearningCourses);

// 6) Get detailed course (with modules & lectures)
router.get("/:courseId/detail", getCourseDetail);

// 7) Get basic course by ID (for editing)
router.get("/:courseId", isAuthenticated, getCourseById);

// 8) Edit a course
router.put(
  "/:courseId",
  isAuthenticated,
  upload.single("courseThumbnail"),
  editCourse
);

// 9) Publish / unpublish
router.patch("/:courseId", isAuthenticated, togglePublishCourse);

// 10) Delete a course
router.delete("/:courseId", isAuthenticated, deleteCourse);

// 11) Get public courses by creator username
router.get("/creator/:username", getCoursesByCreator);

// ------------- LEGACY (non‐module) LECTURE ENDPOINTS -------------
// These endpoints exist if you still support “legacy” course.lectures[]
router.post(
  "/:courseId/lecture",
  isAuthenticated,
  upload.single("file"),
  createLecture
);
router.get("/:courseId/lecture", isAuthenticated, getCourseLecture);
router.delete("/lecture/:lectureId", isAuthenticated, removeLecture);
router.get("/lecture/:lectureId", isAuthenticated, getLectureById);

// ------------------- MODULE ROUTES -------------------
router.post("/:courseId/module", isAuthenticated, createModule);
router.get("/:courseId/module", isAuthenticated, getCourseModules);
router.get("/module/:moduleId", isAuthenticated, getModuleById);
router.put("/module/:moduleId", isAuthenticated, editModule);
router.delete("/:courseId/module/:moduleId", isAuthenticated, removeModule);

// ------------- MODULE → LECTURE ENDPOINTS -------------
router.post("/module/:moduleId/lecture", isAuthenticated, createModuleLecture);
router.get("/module/:moduleId/lecture", isAuthenticated, getModuleLectures);
router.put(
  "/module/:moduleId/lecture/:lectureId",
  isAuthenticated,
  editModuleLecture
);
router.delete(
  "/module/:moduleId/lecture/:lectureId",
  isAuthenticated,
  removeModuleLecture
);

// 13) Get “video info” for a module lecture
router.get(
  "/module/:moduleId/lecture/:lectureId/video-info",
  isAuthenticated,
  getModuleLectureVideoInfo
);

router.delete(
  "/module/:moduleId/lecture/:lectureId/remove-video",
  removeLectureVideo
);

router.get(
  "/course/:courseId/module/:moduleId/lecture/:lectureId/quiz",
  isAuthenticated,
  getLectureQuiz
);
router.put(
  "/course/:courseId/module/:moduleId/lecture/:lectureId/quiz",
  isAuthenticated,
  setLectureQuiz
);

router.delete(
  "/course/:courseId/module/:moduleId/lecture/:lectureId/quiz",
  isAuthenticated,
  removeLectureQuiz
);

router.get("/:courseId/students", isAuthenticated, getCourseStudents);

router.delete("/:courseId/student/:studentId", isAuthenticated, removeStudent);
router.post("/:courseId/email", isAuthenticated, sendCourseInfo);
router.post("/:courseId/review", isAuthenticated, createReview);
router.get("/:courseId/reviews", getCourseReviews);
router.put("/:courseId/review", isAuthenticated, updateReview);
router.get("/:courseId/announcements", getCourseAnnouncements);
router.post(
  "/:courseId/announcement",
  isAuthenticated,
  createCourseAnnouncement
);
router.put(
  "/:courseId/announcement/:announcementId",
  isAuthenticated,
  updateCourseAnnouncement
);

router.delete(
  "/:courseId/announcement/:announcementId",
  isAuthenticated,
  deleteCourseAnnouncement
);
export default router;
