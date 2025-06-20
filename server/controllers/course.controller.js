import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Module } from "../models/module.model.js";
import { User } from "../models/user.model.js";
import { Review } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";
import { sendCourseInformationEmail } from "../utils/email.js";

export const createCourse = async (req, res) => {
  try {
    const {
      courseTitle,
      subTitle = "",
      description = "",
      category,
      courseLevel = "",
      coursePrice = "",
      whatYouWillLearn = [],
      priorRequirements = [],
    } = req.body;
    const thumbnailFile = req.file;

    if (!courseTitle || !category) {
      return res.status(400).json({
        message: "Course title and category are required.",
      });
    }

    let courseThumbnailUrl = "";
    if (thumbnailFile) {
      const uploaded = await uploadMedia(thumbnailFile.path);
      courseThumbnailUrl = uploaded.secure_url;
    }

    const course = await Course.create({
      courseTitle,
      courseSubtitle: subTitle,
      courseDescription: description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnailUrl,
      creator: [req.id],
      whatYouWillLearn: Array.isArray(whatYouWillLearn)
        ? whatYouWillLearn
        : [whatYouWillLearn],
      priorRequirements: Array.isArray(priorRequirements)
        ? priorRequirements
        : [priorRequirements],
    });

    return res.status(201).json({
      course,
      message: "Course created.",
    });
  } catch (error) {
    console.error(error);
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.courseTitle
    ) {
      return res.status(400).json({ message: "Course title already exists." });
    }
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
};

// Search for published courses
export const searchCourse = async (req, res) => {
  try {
    const { query = "", categories = [], sortByPrice = "" } = req.query;

    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { courseSubtitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (Array.isArray(categories) && categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") sortOptions.coursePrice = 1;
    else if (sortByPrice === "high") sortOptions.coursePrice = -1;

    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions)
      .lean();

    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error during search",
    });
  }
};
// Get all published courses
export const getPublishedCourse = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    if (!courses) {
      return res.status(404).json({ message: "No published courses found" });
    }
    return res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get published courses" });
  }
};

// Get courses created by the current user
export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    let courses = await Course.find({ creator: userId })
      .populate({ path: "creator", select: "name photoUrl email" })
      .lean();

    courses = courses.map((course) => {
      if (Array.isArray(course.creator)) {
        const seenIds = new Set();
        course.creator = course.creator.filter((inst) => {
          const idStr = inst._id.toString();
          if (seenIds.has(idStr)) {
            return false;
          }
          seenIds.add(idStr);
          return true;
        });
      }
      return course;
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ courses: [], message: "No courses found" });
    }
    return res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch creator's courses" });
  }
};

export const getMyLearningCourses = async (req, res) => {
  try {
    const userId = req.id;
    const purchases = await CoursePurchase.find({
      userId,
      status: "completed",
    }).select("courseId");
    const courseIds = purchases.map((p) => p.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    return res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get purchased courses" });
  }
};

// Edit a course (with optional new thumbnail)
export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      whatYouWillLearn,
      priorRequirements,
    } = req.body;
    const thumbnailFile = req.file;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    let courseThumbnailUrl = "";
    if (thumbnailFile) {
      if (course.courseThumbnail) {
        const oldPublicId = course.courseThumbnail
          .split("/")
          .pop()
          .split(".")[0];
        await deleteMediaFromCloudinary(oldPublicId);
      }
      const uploaded = await uploadMedia(thumbnailFile.path);
      courseThumbnailUrl = uploaded.secure_url;
    }

    const updateData = {
      ...(courseTitle && { courseTitle }),
      ...(subTitle && { courseSubtitle: subTitle }),
      ...(description && { courseDescription: description }),
      ...(category && { category }),
      ...(courseLevel && { courseLevel }),
      ...(coursePrice !== undefined && { coursePrice }),
      ...(courseThumbnailUrl && { courseThumbnail: courseThumbnailUrl }),
      ...(whatYouWillLearn && {
        whatYouWillLearn: Array.isArray(whatYouWillLearn)
          ? whatYouWillLearn
          : [whatYouWillLearn],
      }),
      ...(priorRequirements && {
        priorRequirements: Array.isArray(priorRequirements)
          ? priorRequirements
          : [priorRequirements],
      }),
    };

    course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    return res.status(200).json({
      course,
      message: "Course updated successfully.",
    });
  } catch (error) {
    console.error(error);
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.courseTitle
    ) {
      return res.status(400).json({ message: "Course title already exists." });
    }
    return res
      .status(500)
      .json({ message: "Please provide valid details for update" });
  }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate({ path: "creator", select: "name photoUrl email" })
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }
    return res.status(200).json({ course });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get course by id" });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({ message: "Lecture title is required" });
    }

    let videoUrl = "";
    let publicId = "";
    let durationSec = 0;

    if (req.file) {
      // 1) Upload as video
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: "video",
      });

      videoUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;

      // 2) Immediately fetch the full resource metadata so we can read its duration
      //    (Sometimes `uploadResult.duration` is missing if the video is still processing.)
      const metadata = await cloudinary.v2.api.resource(publicId, {
        resource_type: "video",
      });

      durationSec = Math.round(metadata.duration || 0);
    }

    // 3) Create the Lecture document with the correct duration
    const lecture = await Lecture.create({
      lectureTitle,
      videoUrl,
      publicId,
      preview: false,
      module: null,
      duration: durationSec,
    });

    // 4) Push this lecture into the Course.lectures array
    const course = await Course.findById(courseId);
    if (course) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(201).json({
      lecture,
      message: "Lecture created successfully.",
    });
  } catch (error) {
    console.error("createLecture error:", error);
    return res.status(500).json({ message: "Failed to create lecture" });
  }
};

// Get legacy lectures for a course
export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures").lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ lectures: course.lectures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get lectures" });
  }
};

export const removeLectureVideo = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // 1) Find the lecture document
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // 2) If there's a publicId, remove the video from Cloudinary
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    // 3) Clear out videoUrl & publicId on the lecture document
    lecture.videoUrl = "";
    lecture.publicId = "";
    await lecture.save();

    return res.status(200).json({
      success: true,
      message: "Video removed successfully.",
    });
  } catch (error) {
    console.error("[removeLectureVideo] Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to remove video from lecture." });
  }
};

// Remove a legacy lecture
export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found!" });
    }

    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    await Course.updateMany(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } }
    );

    return res.status(200).json({ message: "Lecture removed successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to remove lecture" });
  }
};

// Get a single legacy lecture by ID
export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found!" });
    }
    return res.status(200).json({ lecture });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get lecture by id" });
  }
};

// Toggle publish/unpublish a course
export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query; // "true" or "false"

    // 1) Fetch full course + legacy lectures
    const course = await Course.findById(courseId)
      .populate("lectures", "videoUrl quiz")
      .lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // 2) Fetch module-based lectures, including quiz
    const modules = await Module.find({ course: courseId })
      .populate({
        path: "lectures",
        select: "videoUrl quiz",
      })
      .lean();

    // 3) Combine all lectures into one array
    const allLectures = [
      ...course.lectures,
      ...modules.flatMap((m) => m.lectures || []),
    ];

    // 4) If user is trying to publish, but any lecture is incomplete:
    if (publish === "true") {
      const hasIncomplete = allLectures.some((lec) => {
        const hasVideo = Boolean(lec.videoUrl);
        const hasQuiz =
          Array.isArray(lec.quiz?.questions) && lec.quiz.questions.length > 0;
        return !hasVideo && !hasQuiz;
      });

      if (hasIncomplete) {
        // force unpublish
        await Course.findByIdAndUpdate(courseId, { isPublished: false });
        return res.status(400).json({
          message:
            "Cannot publish: some lectures missing video or quiz → set to Draft.",
        });
      }
    }

    // 5) Otherwise toggle as requested
    const newStatus = publish === "true";
    await Course.findByIdAndUpdate(courseId, { isPublished: newStatus });

    return res.status(200).json({
      success: true,
      message: `Course is now ${newStatus ? "Published" : "Draft"}`,
    });
  } catch (error) {
    console.error("togglePublishCourse error:", error);
    return res.status(500).json({ message: "Failed to update publish status" });
  }
};

// Delete a course and all associated lectures/modules/purchases/progress/users
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // 1) Delete all CoursePurchase documents for this course
    await CoursePurchase.deleteMany({ courseId });

    // 2) Delete all CourseProgress documents for this course
    await CourseProgress.deleteMany({ courseId });

    // 3) Pull this courseId from every User.enrolledCourses array
    await User.updateMany(
      { enrolledCourses: courseId },
      { $pull: { enrolledCourses: courseId } }
    );

    // 4) Delete all reviews for this course
    await Review.deleteMany({ courseId });

    // 5) Delete legacy lectures (and their Cloudinary videos)
    for (const lectureId of course.lectures) {
      const lecture = await Lecture.findById(lectureId);
      if (lecture) {
        if (lecture.publicId) {
          await deleteVideoFromCloudinary(lecture.publicId);
        }
        await Lecture.findByIdAndDelete(lectureId);
      }
    }

    // 6) Delete modules and their lectures (and cloud videos)
    const modules = await Module.find({ course: courseId }).lean();
    for (const mod of modules) {
      if (Array.isArray(mod.lectures) && mod.lectures.length > 0) {
        for (const lecId of mod.lectures) {
          const lecture = await Lecture.findById(lecId);
          if (lecture) {
            if (lecture.publicId) {
              await deleteVideoFromCloudinary(lecture.publicId);
            }
            await Lecture.findByIdAndDelete(lecId);
          }
        }
      }
      await Module.findByIdAndDelete(mod._id);
    }

    // 7) Delete thumbnail from Cloudinary if it exists
    if (course.courseThumbnail) {
      const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
      await deleteMediaFromCloudinary(publicId);
    }

    // 8) Finally, delete the Course document itself
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      message:
        "Course deleted, along with all related lectures, modules, purchases, progress, user enrollments, and reviews.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete course" });
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1) Get complete course with populated creators
    const courseDoc = await Course.findById(courseId)
      .populate({
        path: "creator",
        select: "name photoUrl bio email _id",
      })
      .lean();

    if (!courseDoc) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // 2) Get modules with populated lectures (INCLUDING quiz this time)
    const modules = await Module.find({ course: courseId })
      .populate({
        path: "lectures",
        select: "lectureTitle videoUrl preview publicId duration quiz _id",
        //                                          ↑────────── add `quiz` here
      })
      .lean();

    // 3) Get legacy lectures (if any) and also include quiz in the select
    const legacyLectureDocs =
      Array.isArray(courseDoc.lectures) && courseDoc.lectures.length > 0
        ? await Lecture.find({ _id: { $in: courseDoc.lectures } })
            .select("lectureTitle videoUrl preview publicId duration quiz _id")
            //                                           ↑────────── add `quiz` here
            .lean()
        : [];

    // 4) Calculate comprehensive stats
    const allLectures = [
      ...legacyLectureDocs,
      ...modules.flatMap((m) => m.lectures || []),
    ];
    const totalLectures = allLectures.length;
    const totalTime = allLectures.reduce(
      (acc, lec) => acc + (lec.duration || 0),
      0
    );

    // 5) Get enrollment count
    const enrolledCount = await CoursePurchase.countDocuments({
      courseId,
      status: "completed",
    });

    // 6) Prepare the final “course” payload
    const course = {
      ...courseDoc,
      modules: modules.map((module) => ({
        ...module,
        lectures: module.lectures || [],
      })),
      // “legacy” lectures list (if you still use them)
      lectures: legacyLectureDocs,
      studentsEnrolledCount: enrolledCount,
      totalLectures,
      totalTime,
      // Ensure creator is always an array
      creator: Array.isArray(courseDoc.creator)
        ? courseDoc.creator
        : [courseDoc.creator],
    };

    return res.status(200).json({ course });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch course details" });
  }
};

export const toggleLecturePreview = async (req, res) => {
  const { lectureId, preview } = req.body;
  await Lecture.findByIdAndUpdate(lectureId, { preview });
  return res.json({
    message: `Lecture ${preview ? "marked free" : "locked"}.`,
  });
};

// Bulk toggle all lectures in a module:
export const bulkTogglePreview = async (req, res) => {
  const { moduleId, makeFree } = req.body;
  const lectures = await Lecture.find({ module: moduleId });
  await Promise.all(
    lectures.map((lec) =>
      Lecture.findByIdAndUpdate(lec._id, { preview: makeFree })
    )
  );
  return res.json({
    message: `All lectures ${makeFree ? "marked free" : "locked"}.`,
  });
};

export const getCoursesByCreator = async (req, res) => {
  try {
    const { username } = req.params;

    // 1) Find the User document by username
    const user = await User.findOne({ name: username }).select("_id");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Page not found.",
      });
    }

    // 2) Look for courses whose `creator` field matches that user’s _id
    const courses = await Course.find({ creator: user._id })
      .select("courseTitle coursePrice isPublished studentsEnrolled updatedAt")
      .lean();

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error in getCoursesByCreator:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching courses by creator.",
    });
  }
};

// controllers/course.controller.js

export const setLectureQuiz = async (req, res) => {
  try {
    const { moduleId, lectureId } = req.params;
    // Pull title + questions from req.body at top level:
    const { title, questions } = req.body;

    // 1) Validate that lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    // 2) Validate it belongs to this module
    if (lecture.module?.toString() !== moduleId) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this module" });
    }

    // 3) Validate that questions is a non-empty array and each question is well-formed
    if (
      !Array.isArray(questions) ||
      questions.some(
        (q) =>
          typeof q.questionText !== "string" ||
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          typeof q.correctOptionIndex !== "number" ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= q.options.length
      )
    ) {
      return res
        .status(400)
        .json({ message: "Invalid quiz format: check each question" });
    }

    // 4) Assign to lecture.quiz and save
    lecture.quiz = {
      title: title || "",
      questions: questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
      })),
    };

    await lecture.save();

    return res
      .status(200)
      .json({ lecture, message: "Quiz saved successfully." });
  } catch (error) {
    console.error("setLectureQuiz error:", error);
    return res.status(500).json({ message: "Failed to set quiz." });
  }
};

// ─────────── GET THE QUIZ FOR A LECTURE ───────────
export const getLectureQuiz = async (req, res) => {
  try {
    const { moduleId, lectureId } = req.params;

    // Find the lecture, but only select `quiz` and `module`
    const lecture = await Lecture.findById(lectureId).select("quiz module");
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    // Ensure it belongs to this module
    if (lecture.module?.toString() !== moduleId) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this module" });
    }

    // Return `{ quiz: lecture.quiz }` (or `null` if no quiz yet)
    return res.status(200).json({ quiz: lecture.quiz || null });
  } catch (error) {
    console.error("getLectureQuiz error:", error);
    return res.status(500).json({ message: "Failed to get quiz." });
  }
};

export const removeLectureQuiz = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // 1) Find the lecture document
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // 2) Clear out the quiz sub‐object
    lecture.quiz = {
      title: "",
      questions: [],
    };

    // 3) Save
    await lecture.save();

    // 4) 204: no content
    return res.sendStatus(204);
  } catch (err) {
    console.error("removeLectureQuiz error:", err);
    return res.status(500).json({ message: "Failed to remove quiz" });
  }
};

export const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1) Load course → compute total lectures
    const course = await Course.findById(courseId)
      .populate({ path: "modules", select: "lectures" })
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const legacyCount = Array.isArray(course.lectures)
      ? course.lectures.length
      : 0;
    const moduleCount = Array.isArray(course.modules)
      ? course.modules.reduce((sum, m) => sum + (m.lectures?.length || 0), 0)
      : 0;
    const totalLectures = legacyCount + moduleCount;

    // 2) Load all progress entries, and populate full user minus password
    const progresses = await CourseProgress.find({ courseId })
      .populate({ path: "userId", select: "-password" })
      .lean();

    // 3) Build richer student objects
    const students = progresses.map((p) => {
      const user = p.userId;
      const viewedCount = (p.lectureProgress || []).filter(
        (lp) => lp.viewed
      ).length;

      return {
        // core user fields
        _id: user._id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role,
        biography: user.biography,
        linkedin: user.linkedin,
        instagram: user.instagram,
        twitter: user.twitter,
        enrolledAt: p.createdAt,
        lastActive: p.updatedAt,
        completedLectures: viewedCount,
        totalLectures,
        progressPercent: totalLectures
          ? Math.round((viewedCount / totalLectures) * 100)
          : 0,
      };
    });

    return res.status(200).json({ students });
  } catch (error) {
    console.error("getCourseStudents error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch students for this course." });
  }
};

export const removeStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // 1) Ensure course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 2) Unenroll: remove from User.enrolledCourses
    await User.findByIdAndUpdate(studentId, {
      $pull: { enrolledCourses: courseId },
    });

    // 3) Delete any completed purchase records
    await CoursePurchase.deleteMany({ courseId, userId: studentId });

    // 4) Remove from studentsEnrolled list
    course.studentsEnrolled = course.studentsEnrolled.filter(
      (e) => e.student.toString() !== studentId
    );

    // 5) Add to bannedStudents (if not already)
    if (!course.bannedStudents.includes(studentId)) {
      course.bannedStudents.push(studentId);
    }

    await course.save();
    return res.status(200).json({ message: "Student removed from course." });
  } catch (err) {
    console.error("removeStudent error:", err);
    return res.status(500).json({ message: "Failed to remove." });
  }
};

export const sendCourseInfo = async (req, res) => {
  const { courseId } = req.params;
  const { studentIds, infoHtml } = req.body;

  try {
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const students = await User.find({ _id: { $in: studentIds } })
      .select("email name")
      .lean();

    const results = await Promise.all(
      students.map(async (stu) => {
        try {
          await sendCourseInformationEmail({
            toEmail: stu.email,
            userName: stu.name,
            courseTitle: course.courseTitle,
            infoHtml,
          });
          return { email: stu.email, success: true };
        } catch (err) {
          console.error(`Error sending to ${stu.email}:`, err);
          return { email: stu.email, success: false, error: err.message };
        }
      })
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length === students.length) {
      return res.status(500).json({
        message: `Failed to send emails to all ${students.length} students.`,
        errors: failed,
      });
    }

    return res.status(200).json({
      message: `Emails sent: ${students.length - failed.length} succeeded, ${
        failed.length
      } failed.`,
      errors: failed,
    });
  } catch (err) {
    console.error("sendCourseInfo unhandled error:", err);
    return res.status(500).json({ message: "Failed to send course emails." });
  }
};

export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ course: courseId })
      .populate("user", "name")
      .lean();

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("getCourseReviews error:", err);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

// ─────────── CREATE REVIEW ───────────
export const createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.id;

    // prevent duplicate
    const existing = await Review.findOne({ course: courseId, user: userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You already submitted a review." });
    }

    const review = await Review.create({
      user: userId,
      course: courseId,
      rating,
      comment,
    });
    return res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ message: "Failed to submit review." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;
    const { rating, comment } = req.body;

    const review = await Review.findOneAndUpdate(
      { course: courseId, user: userId },
      { rating, comment },
      { new: true }
    ).lean();
    if (!review) return res.status(404).json({ message: "Review not found" });

    return res.status(200).json({ success: true, review });
  } catch (err) {
    console.error("updateReview error:", err);
    return res.status(500).json({ message: "Failed to update review." });
  }
};

export const getCourseAnnouncements = async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId).select("announcements").lean();
  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.status(200).json({ announcements: course.announcements });
};

// Create a new announcement
// controllers/course.controller.js

export const createCourseAnnouncement = async (req, res) => {
  const { courseId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .status(400)
      .json({ message: "Title and content are both required." });
  }

  // $push directly into the sub‐array:
  const updated = await Course.findByIdAndUpdate(
    courseId,
    { $push: { announcements: { title, content } } },
    { new: true, runValidators: true }
  )
    .select("announcements")
    .lean();
  if (!updated) {
    return res.status(404).json({ message: "Course not found" });
  }

  // return the announcement we just pushed:
  const saved = updated.announcements.slice(-1)[0];
  return res.status(201).json({ announcement: saved });
};

// controllers/course.controller.js

export const updateCourseAnnouncement = async (req, res) => {
  const { courseId, announcementId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .status(400)
      .json({ message: "Title and content are both required." });
  }

  // positional $ to update only the matching announcement
  const updated = await Course.findOneAndUpdate(
    { _id: courseId, "announcements._id": announcementId },
    {
      $set: {
        "announcements.$.title": title,
        "announcements.$.content": content,
        "announcements.$.updatedAt": new Date(),
      },
    },
    { new: true, runValidators: true }
  )
    .select("announcements")
    .lean();

  if (!updated) {
    return res
      .status(404)
      .json({ message: "Announcement or course not found" });
  }

  const ann = updated.announcements.find(
    (a) => a._id.toString() === announcementId
  );
  return res.status(200).json({ announcement: ann });
};

export const deleteCourseAnnouncement = async (req, res) => {
  const { courseId, announcementId } = req.params;

  // remove only the matching sub-doc
  const updated = await Course.findByIdAndUpdate(
    courseId,
    { $pull: { announcements: { _id: announcementId } } },
    { new: true }
  )
    .select("announcements")
    .lean();

  if (!updated) {
    return res
      .status(404)
      .json({ message: "Course or announcement not found" });
  }

  return res
    .status(200)
    .json({ message: "Announcement deleted", announcementId });
};
