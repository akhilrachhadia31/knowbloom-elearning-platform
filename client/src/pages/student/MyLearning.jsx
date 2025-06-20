// src/pages/student/MyLearning.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import {
  useGetMyLearningCoursesQuery,
  useGetCourseDetailLegacyQuery,
} from "@/features/api/courseApi";
import { useGetCourseProgressQuery } from "@/features/api/courseProgressApi";

const MyLearning = () => {
  const { data, isLoading, isError, error } = useGetMyLearningCoursesQuery();
  const myLearning = data?.courses || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 mb-10">
      <h1 className="font-bold text-3xl text-gray-800 dark:text-white mb-8 mt-6">
        My Learning
      </h1>

      {isLoading ? (
        <MyLearningSkeleton />
      ) : isError ? (
        <p className="text-red-600 dark:text-red-300">
          {error?.data?.message ||
            error.error ||
            "Failed to load your courses."}
        </p>
      ) : myLearning.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          You are not enrolled in any course.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myLearning
            .filter((c) => c.isPublished)
            .map((c) => (
              <CourseCardWithProgress key={c._id} course={c} />
            ))}
        </div>
      )}
    </div>
  );
};

export default MyLearning;

const CourseCardWithProgress = ({ course }) => {
  const {
    data: detailData,
    isLoading: loadingDetail,
    isError: errorDetail,
  } = useGetCourseDetailWithStatusQuery(course._id);
  const { data: legacyData } = useGetCourseDetailLegacyQuery(course._id);
  const fullCourse = detailData?.course || legacyData?.course || {};

  // fetch the real progress %
  const {
    data: progressData,
    isLoading: loadingProgress,
    isError: errorProgress,
  } = useGetCourseProgressQuery(course._id);

  // clamp percent between 0 and 100
  const rawPercent = progressData?.data?.courseProgressPercent ?? 0;
  const percent =
    typeof rawPercent === "number"
      ? Math.min(Math.max(Math.round(rawPercent), 0), 100)
      : 0;

  // compute total lectures & duration for display
  let totalLectures = 0;
  let totalDuration = 0;
  if (!loadingDetail && !errorDetail && Array.isArray(fullCourse.modules)) {
    fullCourse.modules.forEach((mod) => {
      if (Array.isArray(mod.lectures)) {
        totalLectures += mod.lectures.length;
        mod.lectures.forEach((lec) => {
          totalDuration += lec.duration || 0;
        });
      }
    });
  }
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const thumbnail = fullCourse.courseThumbnail || "/placeholder.png";
  const title = fullCourse.courseTitle || "Untitled Course";
  const creator = Array.isArray(fullCourse.creator)
    ? fullCourse.creator[0]
    : fullCourse.creator || {};
  const instructorName = creator.name || "Instructor";
  const instructorPhoto = creator.photoUrl;
  const category = fullCourse.category || "Uncategorized";
  const level = fullCourse.courseLevel || "N/A";

  if (loadingDetail) return <CardSkeleton />;
  if (errorDetail)
    return (
      <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-300">Failed to load course.</p>
      </div>
    );

  const ProgressBar = ({
    percent,
    color = "bg-gradient-to-r from-blue-500 to-blue-600",
  }) => {
    return (
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-2 transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  return (
    <Link to={`/course-progress/${course._id}`} className="block h-full">
      <div className="overflow-hidden aspect-[1/1] max-w-xs w-full flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
        {/* Thumbnail + badges */}
        <div className="relative aspect-[1.7/1] w-full overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300"
          />
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 text-xs uppercase rounded-full shadow-lg">
            {level}
          </Badge>
          <Badge className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 text-xs rounded-full shadow-lg">
            {category}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 justify-between px-4 pt-2 pb-3">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-1">
            {title}
          </h2>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6 border border-gray-200 dark:border-gray-700">
              {instructorPhoto ? (
                <AvatarImage src={instructorPhoto} alt={instructorName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                  {instructorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs text-gray-700 dark:text-gray-400 truncate">
              {instructorName}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
            <span>
              {totalLectures} lec{totalLectures !== 1 ? "s" : ""} •{" "}
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </span>
          </div>

          {/* Progress */}
          {loadingProgress ? (
            <ProgressBar percent={0} />
          ) : errorProgress ? (
            <ProgressBar percent={0} color="bg-red-500" />
          ) : (
            <>
              <ProgressBar
                percent={percent}
                color="bg-gradient-to-r from-blue-500 to-purple-600"
              />
              <div className="mt-1 text-xs text-gray-700 dark:text-gray-400">
                {percent}% completed
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

// Skeletons

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg">
    <div className="w-full h-36 bg-gray-300 dark:bg-gray-700 rounded-t-lg animate-pulse" />
    <div className="px-5 py-4 animate-pulse">
      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
      <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

const MyLearningSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
