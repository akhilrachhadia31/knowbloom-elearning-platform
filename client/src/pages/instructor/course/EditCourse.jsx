// src/pages/instructor/course/EditCourse.jsx

import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CourseTab from "./CourseTab";

const EditCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams(); // ← pull courseId from the URL

  return (
    <div className="flex-1">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center space-x-1 text-sm text-gray-400 mb-4">
        <Link to="/instructor/course" className="hover:text-gray-700">
          Courses
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}`}
          className="hover:text-gray-400"
        >
          Course Details
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-3xl">
          Add detail information regarding course
        </h1>
        <button
          onClick={() => navigate(`/instructor/course/${courseId}/module`)}
          className="bg-blue-700 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          Go to modules page
        </button>
      </div>

      <CourseTab />
    </div>
  );
};

export default EditCourse;
