// src/controllers/courseProgress.controller.js

import { CourseProgress } from "../models/courseProgress.model.js";
import { Course } from "../models/course.model.js";
import mongoose from "mongoose";

/**
 * Sync per-user lecture counts into Course.studentsEnrolled sub-document.
 */
async function syncEnrollmentStats(
  courseId,
  userId,
  completedLectures,
  totalLectures
) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found in syncEnrollmentStats");
  // make sure we always have an array here
  if (!Array.isArray(course.studentsEnrolled)) {
    course.studentsEnrolled = [];
  }
  const now = new Date();
  const uid = userId.toString();

  const idx = course.studentsEnrolled.findIndex((e) => {
    const sid = e.student?.toString() ?? e.toString();
    return sid === uid;
  });

  if (idx !== -1) {
    course.studentsEnrolled[idx].completedLectures = completedLectures;
    course.studentsEnrolled[idx].totalLectures = totalLectures;
    course.studentsEnrolled[idx].lastActive = now;
  } else {
    course.studentsEnrolled.push({
      student: mongoose.Types.ObjectId(userId),
      enrolledAt: now,
      completedLectures,
      totalLectures,
      lastActive: now,
    });
  }

  await course.save();
}

/**
 * GET /api/v1/progress/:courseId
 */
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const cp = await CourseProgress.findOne({ courseId, userId });
    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        populate: { path: "lectures", model: "Lecture" },
      })
      .populate({ path: "lectures", model: "Lecture" });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // build set of all lecture IDs
    const lectureIds = new Set();
    (course.lectures || []).forEach((l) => lectureIds.add(l._id.toString()));
    (course.modules || [])
      .flatMap((m) => m.lectures || [])
      .forEach((l) => lectureIds.add(l._id.toString()));

    // map viewed flags
    const progressArr = cp?.lectureProgress || [];
    const viewedMap = progressArr.reduce((map, lp) => {
      map[lp.lectureId.toString()] = lp.viewed;
      return map;
    }, {});

    const totalLectures = lectureIds.size;
    const viewedCount = progressArr.filter(
      (lp) => lp.viewed && lectureIds.has(lp.lectureId.toString())
    ).length;
    const percent = totalLectures
      ? Math.round((viewedCount / totalLectures) * 100)
      : 0;
    const completed = totalLectures > 0 && viewedCount === totalLectures;

    // persist completed flag if changed
    if (cp && cp.completed !== completed) {
      cp.completed = completed;
      await cp.save();
    }

    // attach isViewed to each lecture doc
    const addIsViewed = (doc) => {
      const o = doc.toObject ? doc.toObject() : doc;
      return { ...o, isViewed: !!viewedMap[o._id.toString()] };
    };

    const modules = (course.modules || []).map((m) => {
      const mo = m.toObject();
      return {
        _id: mo._id,
        moduleTitle: mo.moduleTitle,
        lectures: (mo.lectures || []).map(addIsViewed),
      };
    });

    const legacyLectures = (course.lectures || []).map(addIsViewed);

    return res.status(200).json({
      data: {
        courseDetails: {
          _id: course._id,
          courseTitle: course.courseTitle,
          modules,
          lectures: legacyLectures,
        },
        progress: progressArr,
        completed,
        courseProgressPercent: percent,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/progress/:courseId/lecture/:lectureId/view
 */
export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    let cp = await CourseProgress.findOne({ courseId, userId });
    if (!cp) {
      cp = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }

    const idx = cp.lectureProgress.findIndex(
      (lp) => lp.lectureId.toString() === lectureId
    );
    if (idx !== -1) cp.lectureProgress[idx].viewed = true;
    else cp.lectureProgress.push({ lectureId, viewed: true });

    // recompute totals
    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        populate: { path: "lectures", model: "Lecture" },
      })
      .populate({ path: "lectures", model: "Lecture" });

    const lectureIds = new Set();
    (course.lectures || []).forEach((l) => lectureIds.add(l._id.toString()));
    (course.modules || [])
      .flatMap((m) => m.lectures || [])
      .forEach((l) => lectureIds.add(l._id.toString()));

    const totalLectures = lectureIds.size;
    const viewedCount = cp.lectureProgress.filter(
      (lp) => lp.viewed && lectureIds.has(lp.lectureId.toString())
    ).length;

    cp.completed = totalLectures > 0 && viewedCount === totalLectures;
    await cp.save();

    try {
      await syncEnrollmentStats(courseId, userId, viewedCount, totalLectures);
    } catch (syncErr) {
      console.error("syncEnrollmentStats failed:", syncErr);
    }

    return res.status(200).json({ message: "Lecture marked viewed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/progress/:courseId/lecture/:lectureId/unview
 */
export const unviewLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    const cp = await CourseProgress.findOne({ courseId, userId });
    if (!cp) return res.status(404).json({ message: "Not found" });

    const idx = cp.lectureProgress.findIndex(
      (lp) => lp.lectureId.toString() === lectureId
    );
    if (idx !== -1) cp.lectureProgress[idx].viewed = false;

    // recompute totals
    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        populate: { path: "lectures", model: "Lecture" },
      })
      .populate({ path: "lectures", model: "Lecture" });

    const lectureIds = new Set();
    (course.lectures || []).forEach((l) => lectureIds.add(l._id.toString()));
    (course.modules || [])
      .flatMap((m) => m.lectures || [])
      .forEach((l) => lectureIds.add(l._id.toString()));

    const totalLectures = lectureIds.size;
    const viewedCount = cp.lectureProgress.filter(
      (lp) => lp.viewed && lectureIds.has(lp.lectureId.toString())
    ).length;

    cp.completed = totalLectures > 0 && viewedCount === totalLectures;
    await cp.save();

    try {
      await syncEnrollmentStats(courseId, userId, viewedCount, totalLectures);
    } catch (syncErr) {
      console.error("syncEnrollmentStats failed:", syncErr);
    }

    return res.status(200).json({ message: "Lecture marked unviewed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/progress/:courseId/complete
 */
export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const cp = await CourseProgress.findOne({ courseId, userId });
    if (!cp) return res.status(404).json({ message: "Not found" });

    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        populate: { path: "lectures", model: "Lecture" },
      })
      .populate({ path: "lectures", model: "Lecture" });

    const lectureIds = new Set();
    (course.lectures || []).forEach((l) => lectureIds.add(l._id.toString()));
    (course.modules || [])
      .flatMap((m) => m.lectures || [])
      .forEach((l) => lectureIds.add(l._id.toString()));

    lectureIds.forEach((lid) => {
      const idx = cp.lectureProgress.findIndex(
        (lp) => lp.lectureId.toString() === lid
      );
      if (idx !== -1) cp.lectureProgress[idx].viewed = true;
      else cp.lectureProgress.push({ lectureId: lid, viewed: true });
    });

    cp.completed = true;
    await cp.save();

    const totalLectures = lectureIds.size;
    await syncEnrollmentStats(courseId, userId, totalLectures, totalLectures);

    return res.status(200).json({ message: "Course marked completed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/progress/:courseId/incomplete
 */
export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const cp = await CourseProgress.findOne({ courseId, userId });
    if (!cp) return res.status(404).json({ message: "Not found" });

    cp.lectureProgress.forEach((lp) => (lp.viewed = false));
    cp.completed = false;
    await cp.save();

    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        populate: { path: "lectures", model: "Lecture" },
      })
      .populate({ path: "lectures", model: "Lecture" });

    const lectureIds = new Set();
    (course.lectures || []).forEach((l) => lectureIds.add(l._id.toString()));
    (course.modules || [])
      .flatMap((m) => m.lectures || [])
      .forEach((l) => lectureIds.add(l._id.toString()));

    await syncEnrollmentStats(courseId, userId, 0, lectureIds.size);

    return res.status(200).json({ message: "Course marked incomplete." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
