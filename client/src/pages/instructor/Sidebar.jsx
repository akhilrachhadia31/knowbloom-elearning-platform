// src/layout/instructorSidebar.jsx

import React from "react";
import { NavLink } from "react-router-dom";
import {
  ChartNoAxesColumn,
  SquareLibrary,
  BarChart,
  Users,
  Star,
  ChevronDown,
  CircleDot,
} from "lucide-react";

const InstructorSidebar = ({ expanded, onHoverChange }) => {
  const linkClasses = ({ isActive }) => `
    flex items-center gap-4 px-4 py-3 rounded-lg transition-colors
    ${
      (isActive &&
        "bg-gray-100 dark:bg-gray-800 text-cyan-600 dark:text-cyan-400") ||
      "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    }
  `;

  return (
    <aside
      className={`
        flex flex-col
        ${expanded && "w-64"}
        ${!expanded && "w-16"}
        transition-all duration-300 ease-in-out
        bg-white dark:bg-[#020817] border-r border-gray-200 dark:border-gray-700
        py-6 select-none
      `}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Dashboard */}
      <NavLink to="dashboard" className={linkClasses}>
        <ChartNoAxesColumn
          size={24}
          className={`${
            !expanded && "mx-auto"
          } text-gray-600 dark:text-gray-300`}
        />
        {expanded && <span className="text-base font-medium">Dashboard</span>}
      </NavLink>

      <div className="my-2" />

      {/* Courses */}
      <NavLink to="course" className={linkClasses}>
        <SquareLibrary
          size={24}
          className={`${
            !expanded && "mx-auto"
          } text-gray-600 dark:text-gray-300`}
        />
        {expanded && <span className="text-base font-medium">Courses</span>}
      </NavLink>

      <div className="my-2" />

      {/* Announcements */}
      <NavLink to="performance/announcements" className={linkClasses}>
        <BarChart
          size={24}
          className={`${
            !expanded && "mx-auto"
          } text-gray-600 dark:text-gray-300`}
        />
        {expanded && (
          <span className="text-base font-medium">Announcements</span>
        )}
      </NavLink>

      <div className="my-2" />

      {/* Reviews */}
      <NavLink to="performance/reviews" className={linkClasses}>
        <Star
          size={24}
          className={`${
            !expanded && "mx-auto"
          } text-gray-600 dark:text-gray-300`}
        />
        {expanded && <span className="text-base font-medium">Reviews</span>}
      </NavLink>

      <div className="my-2" />

      {/* Insights */}
      <NavLink to="performance/insights" className={linkClasses}>
        <CircleDot
          size={24}
          className={`${
            !expanded && "mx-auto"
          } text-gray-600 dark:text-gray-300`}
        />
        {expanded && (
          <span className="text-base font-medium">Course Insights</span>
        )}
      </NavLink>
    </aside>
  );
};

export default InstructorSidebar;
