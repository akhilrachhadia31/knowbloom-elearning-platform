// src/pages/student/CourseDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import ReactPlayer from "react-player";
import {
  BadgeInfo,
  PlayCircle,
  Lock,
  Users,
  MessageSquare,
  Clock,
  BookOpen,
  Star,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";

import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import {
  useGetCourseDetailLegacyQuery,
  useGetCourseReviewsQuery,
  useGetCourseAnnouncementsQuery,
} from "@/features/api/courseApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetInstructorByIdQuery } from "@/features/api/authApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

// ← IMPORT YOUR QUIZ VIEWER COMPONENT
import QuizViewer from "../instructor/quiz/QuizViewer";

// Utility: convert seconds into “Xh Ym”, “Xm” (or “0m”)
const formatTime = (secs) => {
  if (!secs || secs <= 0) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    return `${m}m`;
  }
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [activeTab, setActiveTab] = useState("overview");

  // State to control which module is open
  const [openModuleIdx, setOpenModuleIdx] = useState(null);
  // Track currently selected lecture
  const [selectedLectureInfo, setSelectedLectureInfo] = useState(null);
  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
  } = useGetCourseReviewsQuery(courseId);
  const reviews = reviewsData?.reviews || [];

  // Fetch purchase-status if logged in, else public detail
  const {
    data: purchaseData,
    isLoading: purchaseLoading,
    isError: purchaseError,
  } = useGetCourseDetailWithStatusQuery(courseId, {
    skip: !user,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: publicData,
    isLoading: publicLoading,
    isError: publicError,
  } = useGetCourseDetailLegacyQuery(courseId);

  const isLoading = user ? purchaseLoading : publicLoading;
  const isError = user ? purchaseError : publicError;
  const sourceData = user ? purchaseData : publicData;
  const course = sourceData?.course;
  const [showAllReviews, setShowAllReviews] = useState(false);
  const purchased = user && purchaseData ? purchaseData.purchased : false;
  const isCreator = user && purchaseData ? purchaseData.isCreator : false;
  const {
    data: annsRes,
    isLoading: isAnnsLoading,
    isError: isAnnsError,
  } = useGetCourseAnnouncementsQuery(courseId);
  const announcements = annsRes?.announcements || [];
  const canAccess = purchased || isCreator;
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  // first, pull out the creator object from your course payload
  const creator =
    Array.isArray(course?.creator) && course.creator.length
      ? course.creator[0]
      : course?.creator || null;

  // then feed its _id into your instructor lookup hook—always at top level!
  const instructorId = creator?._id || "";
  const { data: fullInstructor = {} } = useGetInstructorByIdQuery(
    instructorId,
    {
      skip: !instructorId,
    }
  );
  const instructorName = fullInstructor.name || creator?.name || "Instructor";
  const instructorAvatar =
    fullInstructor.photoUrl ||
    creator?.photoUrl ||
    "https://github.com/shadcn.png";
  const instructorBio = fullInstructor.bio || creator?.bio;
  const instructorLinkedin = fullInstructor.linkedin;
  const instructorTwitter = fullInstructor.twitter;
  const instructorInstagram = fullInstructor.instagram;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className=" animate-pulse rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Course
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Failed to load course details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const handleStartLearning = () => {
    if (!user) {
      toast.error("Please login to access this course.");
      return;
    }
    if (isCreator || purchased) {
      navigate(`/course-progress/${courseId}`);
    } else {
      toast.error("Purchase the course to start learning.");
    }
  };

  const lastUpdated = new Date(course.updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let totalDuration;
  if (course.totalTime != null) {
    totalDuration = course.totalTime;
  } else if (modules.length > 0) {
    totalDuration = modules.reduce((sum, mod) => {
      const moduleSum = Array.isArray(mod.lectures)
        ? mod.lectures.reduce((acc, lec) => acc + (lec.duration || 0), 0)
        : 0;
      return sum + moduleSum;
    }, 0);
  } else {
    totalDuration = 0;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto py-16 px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-10">
            {/* Title and description */}
            <div className="space-y-4">
              <h1 className="font-extrabold text-4xl text-gray-900 dark:text-gray-100 leading-tight">
                {course.courseTitle}
              </h1>
              <p
                className="text-lg text-gray-900 dark:text-gray-100 max-w-prose"
                dangerouslySetInnerHTML={{
                  __html: course.courseSubtitle || "",
                }}
              />
              <div
                className="prose prose-indigo max-w-none text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{
                  __html: course.courseDescription || "",
                }}
              />
            </div>

            {/* Instructor Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex gap-6 items-center">
              <Avatar className="h-16 w-16 border-4 border-indigo-500 dark:border-indigo-400">
                <AvatarImage src={instructorAvatar} alt="Instructor" />
                <AvatarFallback className="bg-indigo-500 dark:bg-indigo-400 text-white text-xl font-bold">
                  {instructorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-indigo-500 dark:text-indigo-300">
                  Created by
                </p>
                <h2 className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
                  {instructorName}
                </h2>
                <div className="mt-2">
                  <p className="text-gray-700 dark:text-gray-200">
                    {instructorBio}
                  </p>

                  {/* -- social links if present -- */}
                  {(instructorLinkedin ||
                    instructorTwitter ||
                    instructorInstagram) && (
                    <div className="flex space-x-4 mt-4">
                      {instructorLinkedin && (
                        <a
                          href={instructorLinkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Linkedin size={18} /> LinkedIn
                        </a>
                      )}
                      {instructorTwitter && (
                        <a
                          href={`https://twitter.com/${instructorTwitter.replace(
                            /^@/,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sky-500 hover:underline"
                        >
                          <Twitter size={18} /> Twitter
                        </a>
                      )}
                      {instructorInstagram && (
                        <a
                          href={`https://instagram.com/${instructorInstagram.replace(
                            /^@/,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-pink-500 hover:underline"
                        >
                          <Instagram size={18} /> Instagram
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {course.studentsEnrolledCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Students
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {modules.reduce(
                    (acc, m) => acc + (m.lectures?.length || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lectures
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(totalDuration)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-base font-semibold rounded-full">
                  {course.courseLevel}
                </Badge>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-700 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <BadgeInfo
                  size={16}
                  className="text-indigo-500 dark:text-indigo-300"
                />
                <span>Last updated {lastUpdated}</span>
              </div>
              <span>Category: {course.category}</span>
              {isCreator && (
                <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                  You’re an instructor
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* What You’ll Learn */}
          {Array.isArray(course.whatYouWillLearn) &&
            course.whatYouWillLearn.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-green-700 dark:text-green-200 flex items-center gap-2">
                    <Star className="h-5 w-5 text-green-600 dark:text-green-400" />{" "}
                    What You’ll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="grid md:grid-cols-2 gap-4">
                    {course.whatYouWillLearn.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          {/* Requirements */}
          {Array.isArray(course.priorRequirements) &&
            course.priorRequirements.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {course.priorRequirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-gray-400 dark:text-gray-500 mt-1">
                          •
                        </span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          {/* Modules Accordion */}
          <Card className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />{" "}
                Course Modules
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                {modules.reduce((acc, m) => acc + (m.lectures?.length || 0), 0)}{" "}
                lectures • {formatTime(totalDuration)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {modules.map((module, idx) => (
                <div key={idx} className="space-y-2">
                  <button
                    onClick={() =>
                      setOpenModuleIdx(openModuleIdx === idx ? null : idx)
                    }
                    className="w-full flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {module.moduleTitle}
                    </span>
                    {openModuleIdx === idx ? (
                      <ChevronUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>

                  {openModuleIdx === idx && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-inner p-4 space-y-3">
                      {(module.lectures || []).map((lecture, lectureIdx) => {
                        // allow preview or full access
                        const canWatch =
                          purchased || isCreator || lecture.preview;
                        const hasQuiz = !lecture.videoUrl;
                        const isSelectedVideo =
                          selectedLectureInfo?.type === "video" &&
                          lecture.videoUrl === selectedLectureInfo.url;
                        const isSelectedQuiz =
                          selectedLectureInfo?.type === "quiz" &&
                          lecture._id === selectedLectureInfo.lectureId;

                        return (
                          <div
                            key={lectureIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              !canWatch
                                ? "opacity-70 cursor-not-allowed"
                                : isSelectedVideo || isSelectedQuiz
                                ? "bg-indigo-100 dark:bg-indigo-800 border border-indigo-300 dark:border-indigo-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() => {
                              if (!canWatch) {
                                toast.error(
                                  "Purchase the course to view this lecture."
                                );
                                return;
                              }
                              // show video or quiz inline
                              if (lecture.videoUrl) {
                                setSelectedLectureInfo({
                                  type: "video",
                                  title: lecture.lectureTitle,
                                  url: lecture.videoUrl,
                                });
                              } else {
                                setSelectedLectureInfo({
                                  type: "quiz",
                                  moduleId: module._id,
                                  lectureId: lecture._id,
                                });
                              }
                            }}
                          >
                            <span className="flex-shrink-0">
                              {canWatch ? (
                                <PlayCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Lock className="h-6 w-6 text-gray-400" />
                              )}
                            </span>
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {lecture.lectureTitle}
                                </p>
                                {lecture.preview && (
                                  <Badge className="mt-1 ml-1 text-xs bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
                                    preview
                                  </Badge>
                                )}
                                {hasQuiz && (
                                  <Badge className="mt-1 ml-1 text-xs bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
                                    Quiz
                                  </Badge>
                                )}
                              </div>
                              {lecture.duration !== undefined && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatTime(lecture.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {announcements.length > 0 && isCreator ? (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <MessageSquare
                  size={28}
                  className="text-blue-600 dark:text-blue-400"
                />
                Announcements
              </h2>
              <div className="space-y-6">
                {announcements.map((ann) => (
                  <div
                    key={ann._id}
                    className="p-6 rounded-xl border border-gray-200 dark:border-slate-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/40 dark:to-slate-700/40"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {ann.title}
                    </h3>
                    <p className="text-gray-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">
                      {ann.content}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Posted on{" "}
                      {new Date(ann.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
              <MessageSquare className="w-12 h-12 text-gray-400 dark:text-slate-600 mb-4" />
              <p className="text-gray-600 dark:text-slate-400 text-lg">
                No announcements from the instructor
              </p>
            </div>
          )}

          {!purchased && !isCreator && (
            <Card className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Student Reviews
                </h3>

                {/* Average + total */}
                <div className="flex items-center mb-6">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {reviews.length
                      ? (
                          reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                  <div className="flex ml-2 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const avg = reviews.length
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length
                        : 0;
                      return (
                        <Star
                          key={i}
                          size={20}
                          fill="currentColor"
                          className={
                            i < Math.round(avg)
                              ? "text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      );
                    })}
                  </div>
                  <span className="ml-4 text-gray-600 dark:text-gray-400">
                    {reviews.length} review{reviews.length !== 1 && "s"}
                  </span>
                </div>

                {/* star breakdown */}
                <div className="grid grid-cols-5 gap-2 text-sm mb-6">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <React.Fragment key={star}>
                      <span className="col-span-1 text-gray-700 dark:text-gray-300">
                        {star} star
                      </span>
                      <div className="col-span-3 flex space-x-1">
                        {Array.from({ length: star }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill="currentColor"
                            className="text-yellow-400"
                          />
                        ))}
                        {Array.from({ length: 5 - star }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill="none"
                            className="text-gray-300 dark:text-gray-600"
                          />
                        ))}
                      </div>
                      <span className="col-span-1 text-right text-gray-600 dark:text-gray-400">
                        {reviews.filter((r) => r.rating === star).length}
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {/* individual reviews, collapsed to 3 by default */}
                <div className="space-y-6">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r) => (
                    <div
                      key={r._id}
                      className="p-4 border rounded dark:border-gray-600"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {r.user?.name || "Anonymous"}
                        </p>
                        <div className="flex space-x-1">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill="currentColor"
                              className="text-yellow-400"
                            />
                          ))}
                          {Array.from({ length: 5 - r.rating }).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill="none"
                              className="text-gray-300 dark:text-gray-600"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {r.comment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* read more / less */}
                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews((s) => !s)}
                    className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    {showAllReviews
                      ? "Show less"
                      : `Read more (${reviews.length - 3})`}
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right pane */}
        <div className="lg:col-span-1 space-y-8">
          {!selectedLectureInfo && (
            <Card className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 flex flex-col items-center">
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-6">
                  ₹{course.coursePrice}
                </p>

                {!isCreator && (
                  <Button
                    onClick={handleStartLearning}
                    className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-200 ${
                      canAccess
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {canAccess ? "Start Learning" : "Purchase Required"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {selectedLectureInfo?.type === "video" && (
            <div className="sticky top-20">
              <div className="relative w-full overflow-hidden rounded-lg shadow-lg bg-gray-200 dark:bg-gray-800">
                {/* Close button */}
                <button
                  onClick={() => setSelectedLectureInfo(null)}
                  className="absolute top-3 right-3 z-20 bg-gray-100 dark:bg-gray-700 rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900 transition"
                  title="Close video"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 dark:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="pt-[56.25%]"></div>
                <ReactPlayer
                  url={selectedLectureInfo.url}
                  controls
                  width="100%"
                  height="100%"
                  className="absolute top-0 left-0"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100 px-2">
                {selectedLectureInfo.title}
              </h3>
            </div>
          )}
          {selectedLectureInfo?.type === "quiz" && (
            <div className="sticky top-20">
              <QuizViewer
                courseId={courseId}
                moduleId={selectedLectureInfo.moduleId}
                lectureId={selectedLectureInfo.lectureId}
                onClose={() => setSelectedLectureInfo(null)}
                isInstructor={isCreator}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
