import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast"
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  PlayCircle as CirclePlay,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Settings,
  MessageSquare,
  BookOpen,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { useGetInstructorByIdQuery } from "@/features/api/authApi";
import QuizViewer from "../instructor/quiz/QuizViewer";
import {
  useGetCourseProgressQuery,
  useUpdateLectureProgressMutation,
  useUnviewLectureProgressMutation,
} from "@/features/api/courseProgressApi";
import {
  useGetCourseDetailLegacyQuery,
  useGetCourseReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useGetCourseAnnouncementsQuery,
} from "@/features/api/courseApi";

// Utility to format seconds into h/m/s
const formatDuration = (secs) => {
  if (!secs || secs <= 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Progress bar component
const ProgressBar = ({
  percent,
  color = "bg-gradient-to-r from-blue-500 to-blue-600",
}) => {
  const safePercent =
    typeof percent === "number" && !isNaN(percent)
      ? Math.min(Math.max(percent, 0), 100)
      : 0;
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-2 transition-all duration-500 ease-out rounded-full`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
};

const CourseProgress = () => {
  const { courseId } = useParams();

  // get current user id from redux store
  const currentUserId = useSelector((state) => state.auth.user._id);

  // fetch course details
  const {
    data: detailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useGetCourseDetailWithStatusQuery(courseId);
  const { data: legacyDetailData } = useGetCourseDetailLegacyQuery(courseId);

  // fetch progress
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
    refetch: refetchProgress,
  } = useGetCourseProgressQuery(courseId);

  const [updateLectureProgress] = useUpdateLectureProgressMutation();
  const [unviewLectureProgress] = useUnviewLectureProgressMutation();
  const [captionsEnabled, setCaptionsEnabled] = useState(false);

  const {
    data: annsRes,
    isLoading: isAnnsLoading,
    isError: isAnnsError,
  } = useGetCourseAnnouncementsQuery(courseId);
  const announcements = annsRes?.announcements || [];

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError,
  } = useGetCourseReviewsQuery(courseId);

  const [createReview] = useCreateReviewMutation();
  const [updateReview] = useUpdateReviewMutation();

  // review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // detect if user has already reviewed
  useEffect(() => {
    if (!reviewsData?.reviews) return;
    const myReview = reviewsData.reviews.find(
      (r) => r.user?._id === currentUserId
    );
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewComment(myReview.comment);
      setExistingReviewId(myReview._id);
      setIsEditingReview(false);
    } else {
      setExistingReviewId(null);
      setIsEditingReview(true);
    }
  }, [reviewsData, currentUserId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      if (existingReviewId) {
        await updateReview({
          courseId,
          reviewId: existingReviewId,
          rating: reviewRating,
          comment: reviewComment,
        });
        toast.success("Review updated");
      } else {
        await createReview({
          courseId,
          rating: reviewRating,
          comment: reviewComment,
        });
        toast.success("Review submitted");
      }
    } catch {
      toast.error("Failed to submit review");
    }
  };

  // lecture selection & video controls
  const [expandedModules, setExpandedModules] = useState([]);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLectureIdx, setSelectedLectureIdx] = useState(0);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const fallback = detailData?.course || legacyDetailData?.course || {};
  const progDetails = progressData?.data?.courseDetails || {};
  const course = { ...fallback, ...progDetails };

  const {
    courseTitle,
    courseSubtitle,
    courseDescription,
    category,
    courseThumbnail,
    whatYouWillLearn = [],
    priorRequirements = [],
    modules = [],
    creator = [],
  } = course;

  const imageUrl = courseThumbnail;
  const instructor = creator[0] || {};
  // RTK Query hook to fetch the full instructor profile by ID
  const { data: fullInstructor = {} } = useGetInstructorByIdQuery(
    instructor._id,
    {
      skip: !instructor._id, // don't fire until we have an ID
    }
  );

  const instructorName = fullInstructor.name || instructor.name;
  const instructorBio = fullInstructor.bio || instructor.bio;
  const instructorPic = fullInstructor.photoUrl || instructor.photoUrl;
  const instructorLinkedin = fullInstructor.linkedin;
  const instructorTwitter = fullInstructor.twitter;
  const instructorInstagram = fullInstructor.instagram;

  const safeMod = Math.min(Math.max(0, selectedModuleIdx), modules.length - 1);
  const lectures = modules[safeMod]?.lectures || [];
  const safeLec = Math.min(
    Math.max(0, selectedLectureIdx),
    lectures.length - 1
  );
  const currentLecture = lectures.length > 0 ? lectures[safeLec] : null;

  const markViewed = useCallback(
    async (id) => {
      try {
        await updateLectureProgress({ courseId, lectureId: id });
        refetchProgress();
      } catch {
        toast.error("Failed to mark viewed");
      }
    },
    [courseId, updateLectureProgress, refetchProgress]
  );

  const markUnviewed = useCallback(
    async (id) => {
      try {
        await unviewLectureProgress({ courseId, lectureId: id });
        refetchProgress();
      } catch {
        toast.error("Failed to mark unviewed");
      }
    },
    [courseId, unviewLectureProgress, refetchProgress]
  );

  const toggleView = (lec) =>
    lec.isViewed ? markUnviewed(lec._id) : markViewed(lec._id);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentLecture) return;
    const onTime = () => {
      if (!currentLecture.isViewed && vid.currentTime / vid.duration > 0.95) {
        markViewed(currentLecture._id);
      }
    };
    vid.addEventListener("timeupdate", onTime);
    return () => vid.removeEventListener("timeupdate", onTime);
  }, [currentLecture, markViewed]);

  useEffect(() => {
    setProgress(0);
    setDuration(0);
    setIsPlaying(false);
    setIsBuffering(false);
    clearTimeout(controlsTimeout.current);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [currentLecture]);

  const hideControls = () => {
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const playPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
      hideControls();
    } else {
      vid.pause();
      setIsPlaying(false);
      clearTimeout(controlsTimeout.current);
      setShowControls(true);
    }
  };

  const onVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setIsMuted(v === 0);
    setShowControls(true);
    hideControls();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    hideControls();
  };

  const changeRate = (e) => {
    const r = parseFloat(e.target.value);
    setPlaybackRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
    hideControls();
  };

  const onSeek = (e) => {
    const pct = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (pct / 100) * videoRef.current.duration;
      setProgress(pct);
    }
    hideControls();
  };

   const skipTime = (sec) => {
     if (!videoRef.current) return;
     let t = videoRef.current.currentTime + sec;
     t = Math.max(0, Math.min(duration, t));
     videoRef.current.currentTime = t;
     setProgress((t / duration) * 100); // <- update custom bar
     hideControls();
   };

  const requestFull = () => {
    const vid = videoRef.current;
    if (vid?.requestFullscreen) vid.requestFullscreen();
    else if (vid?.webkitRequestFullscreen) vid.webkitRequestFullscreen();
  };

  const onTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid?.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const onLoadedMeta = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const onWaiting = () => setIsBuffering(true);
  const onCanPlay = () => setIsBuffering(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && currentLecture) {
        e.preventDefault();
        playPause();
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        skipTime(-5);
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        skipTime(5);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentLecture]);

  // new state for tabs
  const [activeTab, setActiveTab] = useState("Course");

  if (isDetailLoading || isProgressLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900">
        <div className="animate-pulse rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (isDetailError || isProgressError) {
    return (
      <p className="text-red-400 bg-slate-900 p-8">
        Failed to load course details.
      </p>
    );
  }

  const moduleLecs = modules.flatMap((m) =>
    Array.isArray(m.lectures) ? m.lectures : []
  );
  const total = moduleLecs.length;
  const viewedCount = moduleLecs.filter((l) => l.isViewed).length;
  const overall = total ? Math.round((viewedCount / total) * 100) : 0;

  return (
    <div className="mt-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Content Area */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Video/Quiz Player */}
          <div className="flex-1">
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden aspect-video shadow-2xl border border-gray-800/50">
              {currentLecture ? (
                currentLecture.videoUrl ? (
                  <div
                    className="relative h-full group cursor-pointer"
                    onMouseMove={() => {
                      setShowControls(true);
                      hideControls();
                    }}
                    onMouseLeave={() => {
                      if (isPlaying) {
                        clearTimeout(controlsTimeout.current);
                        controlsTimeout.current = setTimeout(
                          () => setShowControls(false),
                          1000
                        );
                      }
                    }}
                  >
                    <video
                      ref={videoRef}
                      key={currentLecture._id}
                      src={currentLecture.videoUrl}
                      className="w-full h-full object-cover"
                      onClick={playPause}
                      onEnded={() => markViewed(currentLecture._id)}
                      muted={isMuted}
                      onTimeUpdate={onTimeUpdate}
                      onLoadedMetadata={onLoadedMeta}
                      onWaiting={onWaiting}
                      onCanPlay={onCanPlay}
                    />

                    {/* Loading Spinner */}
                    {isBuffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="animate-pulse rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    {!isPlaying && showControls && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={playPause}
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-6 transition-all duration-300 hover:scale-110 shadow-2xl"
                        >
                          <Play size={40} className="text-white ml-1" />
                        </button>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div
                      className={`absolute bottom-20 left-0 right-0 px-6 transition-opacity duration-300 ${
                        showControls ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={progress}
                          onChange={onSeek}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Enhanced Controls Bar */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 transition-transform duration-300 ${
                        showControls ? "translate-y-0" : "translate-y-full"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={playPause}
                          className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>

                        <button
                          onClick={() => skipTime(-5)}
                          className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          <RotateCcw size={20} />
                        </button>
                        <button
                          onClick={() => skipTime(5)}
                          className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          <RotateCw size={20} />
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleMute}
                            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX size={20} />
                            ) : (
                              <Volume2 size={20} />
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={onVolume}
                            className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <span className="text-white text-sm whitespace-nowrap font-mono bg-black/30 px-3 py-1 rounded-lg">
                          {formatDuration((progress / 100) * duration)} /{" "}
                          {formatDuration(duration)}
                        </span>

                        <div className="flex-1"></div>

                        <select
                          value={playbackRate}
                          onChange={changeRate}
                          className="bg-black/50 text-white border border-white/20 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-black/70 transition-colors"
                        >
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                            <option key={r} value={r} className="bg-slate-800">
                              {r}x
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={requestFull}
                          className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          <Maximize size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : currentLecture.quiz?.questions.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-900/20 dark:to-slate-800">
                    <div className="w-full h-full max-w-4xl max-h-full p-8 overflow-auto">
                      <div className="flex-1 p-6 overflow-auto">
                        <QuizViewer
                          courseId={courseId}
                          moduleId={modules[safeMod]._id}
                          lectureId={currentLecture._id}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-center">
                      <MessageSquare
                        size={64}
                        className="mx-auto mb-6 text-gray-400 dark:text-slate-600"
                      />
                      <p className="text-xl text-gray-500 dark:text-slate-400 font-medium">
                        No content available
                      </p>
                      <p className="text-gray-400 dark:text-slate-500 mt-2">
                        This lecture doesn't have video or quiz content
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
                  <div className="text-center">
                    <BookOpen
                      size={64}
                      className="mx-auto mb-6 text-gray-400 dark:text-slate-600"
                    />
                    <p className="text-xl text-gray-500 dark:text-slate-400 font-medium">
                      Select a lecture to begin
                    </p>
                    <p className="text-gray-400 dark:text-slate-500 mt-2">
                      Choose from the course content sidebar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Course Content Sidebar */}
          <div className="w-full xl:w-96">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/30 dark:to-slate-800/30">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <BookOpen
                    size={24}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  Course Content
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                  {modules.length} sections • {total} lectures
                </p>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {modules.map((mod, mIdx) => {
                  const lecs = Array.isArray(mod.lectures) ? mod.lectures : [];
                  const secSum = lecs.reduce(
                    (sum, l) => sum + (l.duration || 0),
                    0
                  );
                  const seen = lecs.filter((l) => l.isViewed).length;
                  const expanded = expandedModules.includes(mIdx);

                  return (
                    <div
                      key={mod._id}
                      className="border-b border-gray-200/50 dark:border-slate-700/50 last:border-b-0"
                    >
                      <button
                        className="flex w-full justify-between items-center px-6 py-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700/30 dark:hover:to-slate-800/30 transition-all duration-200"
                        onClick={() =>
                          setExpandedModules((prev) =>
                            prev.includes(mIdx)
                              ? prev.filter((x) => x !== mIdx)
                              : [...prev, mIdx]
                          )
                        }
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            {mod.moduleTitle}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            {lecs.length} lectures • {formatDuration(secSum)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 text-blue-800 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                            {seen}/{lecs.length}
                          </div>
                          {expanded ? (
                            <ChevronUp
                              size={20}
                              className="text-gray-400 dark:text-slate-400"
                            />
                          ) : (
                            <ChevronDown
                              size={20}
                              className="text-gray-400 dark:text-slate-400"
                            />
                          )}
                        </div>
                      </button>

                      {expanded && (
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-700/50">
                          {lecs.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-gray-500 dark:text-slate-500">
                              No lectures available.
                            </p>
                          ) : (
                            lecs.map((lec, lIdx) => {
                              const viewed = lec.isViewed;
                              const active =
                                safeMod === mIdx && safeLec === lIdx;
                              const hasQuiz = lec.quiz?.questions.length > 0;

                              return (
                                <div
                                  key={lec._id}
                                  className={`flex items-center px-6 py-4 cursor-pointer transition-all duration-200 ${
                                    active
                                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-600/20 dark:to-indigo-600/20 border-r-4 border-blue-500 shadow-lg"
                                      : "hover:bg-white/50 dark:hover:bg-slate-700/30"
                                  }`}
                                  onClick={() => {
                                    setSelectedModuleIdx(mIdx);
                                    setSelectedLectureIdx(lIdx);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={viewed}
                                    onChange={() => toggleView(lec)}
                                    className="mr-4 w-5 h-5 accent-blue-500 rounded-md"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p
                                        className={`font-medium transition-all ${
                                          active
                                            ? "text-blue-700 dark:text-blue-300"
                                            : "text-gray-900 dark:text-white"
                                        } ${viewed ? "opacity-75" : ""}`}
                                      >
                                        {lec.lectureTitle}
                                      </p>
                                      {hasQuiz && (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-500 text-white border-0 text-xs px-2 py-0.5">
                                          Quiz
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                      {formatDuration(lec.duration || 0)}
                                    </p>
                                  </div>
                                  {viewed ? (
                                    <CheckCircle2
                                      size={20}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <CirclePlay
                                      size={20}
                                      className="text-gray-400 dark:text-slate-400"
                                    />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for bottom sections */}
        <div className="mt-8">
          <div className="border-b border-gray-200 dark:border-slate-700 flex">
            <button
              onClick={() => setActiveTab("Course")}
              className={`px-4 py-2 -mb-px font-medium ${
                activeTab === "Course"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              Course
            </button>
            <button
              onClick={() => setActiveTab("Announcements")}
              className={`px-4 py-2 -mb-px font-medium ${
                activeTab === "Announcements"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("Reviews")}
              className={`px-4 py-2 -mb-px font-medium ${
                activeTab === "Reviews"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              Reviews
            </button>
          </div>
          <div className="pt-6">
            {activeTab === "Course" &&
              (courseDescription ||
                whatYouWillLearn.length > 0 ||
                priorRequirements.length > 0) && (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 mb-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {imageUrl && (
                        <div className="w-full lg:w-80 h-48 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-gray-200/50 dark:ring-slate-700/50">
                          <img
                            src={
                              imageUrl.startsWith("https")
                                ? imageUrl
                                : `https://res.cloudinary.com/akhil31/image/upload/${imageUrl}`
                            }
                            alt={courseTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-6">
                        <div>
                          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3">
                            {courseTitle}
                          </h1>
                          {courseSubtitle && (
                            <p className="text-xl text-gray-600 dark:text-slate-300">
                              {courseSubtitle}
                            </p>
                          )}
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl p-6 border border-blue-100 dark:border-slate-600/50">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                              <BookOpen
                                size={18}
                                className="text-blue-600 dark:text-blue-400"
                              />
                              Course Progress
                            </span>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {overall}% Complete
                            </span>
                          </div>
                          <ProgressBar
                            percent={overall}
                            color="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
                          />
                          <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mt-3">
                            <span>
                              {viewedCount} of {total} lectures completed
                            </span>
                            <span>{total - viewedCount} remaining</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {category && (
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 px-4 py-2">
                              {category}
                            </Badge>
                          )}
                        </div>

                        {instructorName && (
                          <div
                            className="flex items-start gap-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 
                  dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl border 
                  border-gray-200/50 dark:border-slate-600/50"
                          >
                            {/* picture */}
                            {instructorPic && (
                              <img
                                src={instructorPic}
                                alt={instructorName}
                                className="w-16 h-16 rounded-full shadow-md ring-2 ring-blue-200 dark:ring-blue-700/50"
                              />
                            )}

                            <div className="flex-1 space-y-2">
                              {/* name */}
                              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {instructorName}
                              </p>

                              {/* full biography */}
                              {instructorBio && (
                                <p className="text-gray-700 dark:text-slate-300">
                                  {instructorBio}
                                </p>
                              )}

                              {/* social links */}
                              <div className="flex space-x-4 mt-1">
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
                                    <Twitter size={18} />
                                    Twitter
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
                                    <Instagram size={18} />
                                    Instagram
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <BookOpen
                      size={28}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    About this course
                  </h3>

                  {courseDescription && (
                    <div
                      className="prose prose-lg prose-gray dark:prose-slate dark:prose-invert max-w-none mb-8 text-gray-700 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: courseDescription }}
                    />
                  )}

                  <div className="grid md:grid-cols-2 gap-8">
                    {whatYouWillLearn.length > 0 && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                          <CheckCircle2
                            size={20}
                            className="text-green-600 dark:text-green-400"
                          />
                          What you'll learn
                        </h4>
                        <ul className="space-y-4">
                          {whatYouWillLearn.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-gray-700 dark:text-slate-300"
                            >
                              <CheckCircle2
                                size={18}
                                className="text-green-500 mt-0.5 flex-shrink-0"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {priorRequirements.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/30">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                          <BookOpen
                            size={20}
                            className="text-amber-600 dark:text-amber-400"
                          />
                          Requirements
                        </h4>
                        <ul className="space-y-4">
                          {priorRequirements.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-gray-700 dark:text-slate-300"
                            >
                              <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {activeTab === "Announcements" && (
              <>
                {announcements.length > 0 ? (
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
                            {new Date(ann.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
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
              </>
            )}

            {activeTab === "Reviews" && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                  <MessageSquare
                    size={28}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  Student feedback
                </h2>
                {(() => {
                  const all = reviewsData.reviews;
                  const total = all.length;
                  const avg = total
                    ? (
                        all.reduce((sum, r) => sum + r.rating, 0) / total
                      ).toFixed(1)
                    : "0";
                  const starCounts = [0, 0, 0, 0, 0];
                  all.forEach((r) => starCounts[r.rating - 1]++);
                  const mine = all.find((r) => r.user._id === currentUserId);
                  const others = all.filter(
                    (r) => r.user._id !== currentUserId
                  );
                  const ordered = mine ? [mine, ...others] : others;

                  return (
                    <>
                      {/* Rating Overview */}
                      <div className="flex flex-col md:flex-row gap-8 mb-8">
                        <div className="flex items-center gap-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-yellow-200/50 dark:border-yellow-700/30">
                          <span className="text-6xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            {avg}
                          </span>
                          <div>
                            <div className="flex mb-3">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-2xl ${
                                    i < Math.round(parseFloat(avg))
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-slate-600"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-slate-200">
                              Course Rating
                            </p>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                              {total} review{total !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center gap-4">
                              <div className="flex w-16">
                                {Array.from({ length: star }).map((_, i) => (
                                  <span
                                    key={i}
                                    className="text-yellow-500 text-sm"
                                  >
                                    ★
                                  </span>
                                ))}
                                {Array.from({ length: 5 - star }).map(
                                  (_, i) => (
                                    <span
                                      key={i}
                                      className="text-gray-300 dark:text-slate-600 text-sm"
                                    >
                                      ★
                                    </span>
                                  )
                                )}
                              </div>
                              <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-3 mx-4">
                                <div
                                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${
                                      total
                                        ? (starCounts[star - 1] / total) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-slate-400 w-12 text-right font-medium">
                                {Math.round(
                                  total
                                    ? (starCounts[star - 1] / total) * 100
                                    : 0
                                )}
                                %
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review Form */}
                      {isEditingReview && (
                        <form
                          onSubmit={handleReviewSubmit}
                          className="border-t border-gray-200/50 dark:border-slate-700/50 pt-8 mb-8"
                        >
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {existingReviewId
                              ? "Edit Your Review"
                              : "Add Your Review"}
                          </h3>

                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-gray-600 dark:text-slate-400 font-medium">
                              Rating:
                            </span>
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const star = idx + 1;
                              return (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="text-4xl hover:scale-110 transition-transform duration-200"
                                >
                                  <span
                                    className={
                                      star <= reviewRating
                                        ? "text-yellow-500"
                                        : "text-gray-300 dark:text-slate-600 hover:text-yellow-300"
                                    }
                                  >
                                    ★
                                  </span>
                                </button>
                              );
                            })}
                            {reviewRating > 0 && (
                              <span className="ml-4 text-gray-600 dark:text-slate-400 font-medium">
                                {reviewRating} star
                                {reviewRating !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                              Your Review
                            </label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full px-4 py-4 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 resize-none transition-all duration-200"
                              rows={4}
                              placeholder="Share your thoughts about this course..."
                            />
                          </div>

                          <div className="flex gap-4">
                            <button
                              type="submit"
                              disabled={
                                reviewRating === 0 || !reviewComment.trim()
                              }
                              className="px-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:shadow-none transform hover:scale-105 disabled:transform-none"
                            >
                              {existingReviewId
                                ? "Update Review"
                                : "Submit Review"}
                            </button>
                            {existingReviewId && (
                              <button
                                type="button"
                                onClick={() => setIsEditingReview(false)}
                                className="px-8 py-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-all duration-200"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      )}

                      {/* Reviews List */}
                      <div className="space-y-6">
                        {(() => {
                          const all = reviewsData.reviews;
                          const mine = all.find(
                            (r) => r.user._id === currentUserId
                          );
                          const others = all.filter(
                            (r) => r.user._id !== currentUserId
                          );
                          const ordered = mine ? [mine, ...others] : others;
                          return ordered.map((r) => (
                            <div
                              key={r._id}
                              className="border-b border-gray-200/50 dark:border-slate-700/50 pb-6 last:border-b-0"
                            >
                              <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                  {(r.user?.name || "A")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-3">
                                    <span className="font-semibold text-gray-900 dark:text-white text-lg">
                                      {r.user?.name || "Anonymous"}
                                    </span>
                                    {r.user?._id === currentUserId && (
                                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs px-3 py-1">
                                        You
                                      </Badge>
                                    )}
                                    <div className="flex">
                                      {Array.from({ length: r.rating }).map(
                                        (_, i) => (
                                          <span
                                            key={i}
                                            className="text-yellow-500 text-lg"
                                          >
                                            ★
                                          </span>
                                        )
                                      )}
                                      {Array.from({
                                        length: 5 - r.rating,
                                      }).map((_, i) => (
                                        <span
                                          key={i}
                                          className="text-gray-300 dark:text-slate-600 text-lg"
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-gray-700 dark:text-slate-300 mb-3 leading-relaxed text-lg">
                                    {r.comment}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 dark:text-slate-500">
                                      {new Date(r.createdAt).toLocaleDateString(
                                        "en-US",
                                        {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        }
                                      )}
                                    </p>
                                    {r.user?._id === currentUserId &&
                                      !isEditingReview && (
                                        <button
                                          onClick={() =>
                                            setIsEditingReview(true)
                                          }
                                          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                          Edit Your Review
                                        </button>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;
