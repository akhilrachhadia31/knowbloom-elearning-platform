// src/controllers/module.controller.js

import { Course } from "../models/course.model.js";
import { Module } from "../models/module.model.js";
import { Lecture } from "../models/lecture.model.js";
import { deleteVideoFromCloudinary } from "../utils/cloudinary.js";

// ─────────── IMPORTANT: import your Cloudinary SDK/configuration here ───────────
import cloudinary from "cloudinary";
//
// (If you have a separate file that initializes cloudinary with your credentials,
//  you can also do:
//    import { v2 as cloudinary } from "cloudinary";
//  or
//    import cloudinary from "../utils/cloudinary.js"; // whichever you use)
// ─────────────────────────────────────────────────────────────────────────────────

export const createModule = async (req, res) => {
  try {
    const { moduleTitle } = req.body;
    const { courseId } = req.params;
    if (!moduleTitle || !courseId) {
      return res.status(400).json({ message: "Module title is required" });
    }
    const module = await Module.create({ moduleTitle, course: courseId });
    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    });
    return res
      .status(201)
      .json({ module, message: "Module created successfully." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to create module" });
    }
  };

export const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("modules");
    if (!course) return res.status(404).json({ message: "Course not found" });
    return res.status(200).json({ modules: course.modules });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get modules" });
  }
};

export const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });
    return res.status(200).json({ module });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to get module" });
    }
  };

export const editModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { moduleTitle } = req.body;
    const module = await Module.findByIdAndUpdate(
      moduleId,
      { moduleTitle },
      { new: true }
    );
    if (!module) return res.status(404).json({ message: "Module not found" });
    return res
      .status(200)
      .json({ module, message: "Module updated successfully." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to update module" });
    }
  };

// Only remove the module if it has no lectures
export const removeModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    // Only allow deletion if the module has no lectures
    if (module.lectures && module.lectures.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete module with lectures. Remove all lectures first.",
      });
    }

    // Remove module from course
    await Course.updateOne(
      { modules: moduleId },
      { $pull: { modules: moduleId } }
    );

    await Module.findByIdAndDelete(moduleId);

    return res.status(200).json({ message: "Module deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete module" });
  }
};

// LECTURE CRUD (inside module)
export const createModuleLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { moduleId } = req.params;
    if (!lectureTitle || !moduleId) {
      return res.status(400).json({ message: "Lecture title is required" });
    }
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    // Create the Lecture (no videoUrl/publicId yet)
    const lecture = await Lecture.create({ lectureTitle, module: moduleId });

    // Add to module.lectures
    module.lectures.push(lecture._id);
    await module.save();

    // Also add to parent course.lectures (if not already present)
    if (module.course) {
      await Course.findByIdAndUpdate(module.course, {
        $addToSet: { lectures: lecture._id },
      });
    }

    return res
      .status(201)
      .json({ lecture, message: "Lecture created successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create lecture" });
  }
};

export const getModuleLectures = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId).populate("lectures");
    if (!module) return res.status(404).json({ message: "Module not found" });
    return res.status(200).json({ lectures: module.lectures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to get lectures" });
  }
};

export const editModuleLecture = async (req, res) => {
  // Debugging statement removed to avoid logging sensitive request data

  try {
    const { lectureTitle, videoInfo, preview } = req.body;
    const { moduleId, lectureId } = req.params;

    // 1) Find the lecture by ID
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found!" });
    }

    // 2) Update title
    if (lectureTitle) {
      lecture.lectureTitle = lectureTitle;
    }

    // 3) If videoInfo includes a new videoUrl + publicId, recalculate `duration`
    if (videoInfo?.videoUrl && videoInfo?.publicId) {
      lecture.videoUrl = videoInfo.videoUrl;
      lecture.publicId = videoInfo.publicId;

      // Fetch Cloudinary metadata:
      const metadata = await cloudinary.v2.api.resource(videoInfo.publicId, {
        resource_type: "video",
      });
      lecture.duration = Math.round(metadata.duration || 0);
    }

    // 4) Update preview flag
    if (typeof preview !== "undefined") {
      lecture.preview = preview;
    }

    await lecture.save();

    // 5) Ensure lecture is in module.lectures
    const moduleDoc = await Module.findById(moduleId);
    if (moduleDoc && !moduleDoc.lectures.includes(lecture._id)) {
      moduleDoc.lectures.push(lecture._id);
      await moduleDoc.save();
    }

    // 6) Ensure lecture is in course.lectures (if module belongs to a course)
    if (moduleDoc && moduleDoc.course) {
      const course = await Course.findById(moduleDoc.course);
      if (course && !course.lectures.includes(lecture._id)) {
        course.lectures.push(lecture._id);
        await course.save();
      }
    }

    // 7) Return the updated lecture
    return res
      .status(200)
      .json({ lecture, message: "Lecture updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update lecture" });
  }
};

export const removeModuleLecture = async (req, res) => {
  try {
    const { moduleId, lectureId } = req.params;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    // 1) Delete the lecture document
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture)
      return res.status(404).json({ message: "Lecture not found!" });

    // 2) If it had a publicId on Cloudinary, delete it:
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    // 3) Remove from module.lectures
    await Module.findByIdAndUpdate(moduleId, {
      $pull: { lectures: lectureId },
    });

    // 4) Remove from parent course.lectures (if the module belongs to a course)
    if (module.course) {
      await Course.findByIdAndUpdate(module.course, {
        $pull: { lectures: lectureId },
      });
    }

    return res.status(200).json({ message: "Lecture removed successfully." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to remove lecture" });
    }
  };

// Fixed: always return at least { videoUrl, publicId, preview }
export const getModuleLectureVideoInfo = async (req, res) => {
  try {
    const { moduleId, lectureId } = req.params;

    // Lookup lecture
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found!" });
    }

    return res.status(200).json({
      videoInfo: {
        videoUrl: lecture.videoUrl || "",
        publicId: lecture.publicId || "",
        preview: !!lecture.preview,
        duration: lecture.duration || 0,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch video-info." });
  }
};
