// src/components/Course.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useCreateCheckoutSessionMutation,
  useGetCourseDetailWithStatusQuery,
} from "@/features/api/purchaseApi";
import {
  useGetCourseDetailLegacyQuery,
  useGetCourseReviewsQuery,
} from "@/features/api/courseApi";
import { useGetCourseProgressQuery } from "@/features/api/courseProgressApi";
import { Star } from "lucide-react";

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

const getAvgRating = (reviews = []) => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  return total / reviews.length;
};

const renderStars = (rating) => {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((n) =>
        rounded >= n ? (
          <Star key={n} size={15} className="fill-yellow-400 text-yellow-400" />
        ) : rounded >= n - 0.5 ? (
          <Star
            key={n}
            size={15}
            className="fill-yellow-400 text-yellow-400 opacity-60"
          />
        ) : (
          <Star
            key={n}
            size={15}
            className="text-gray-300 dark:text-gray-700"
          />
        )
      )}
    </div>
  );
};

const Course = ({ courseId, showPurchaseButton = true }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [localError, setLocalError] = React.useState(null);

  let actualCourseId = courseId;
  if (typeof courseId === "object" && courseId !== null) {
    if (courseId._id) actualCourseId = courseId._id;
    else if (courseId.id) actualCourseId = courseId.id;
  }
  if (!actualCourseId) {
    return (
      <Card className="flex justify-center items-center h-80 w-80 bg-gray-900">
        <p className="text-red-600">Invalid course.</p>
      </Card>
    );
  }

  // Detail queries
  const {
    data: purchaseData,
    isLoading: purchaseLoading,
    isError: purchaseError,
    error: purchaseErrorObj,
  } = useGetCourseDetailWithStatusQuery(actualCourseId, {
    skip: !user,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: publicData,
    isLoading: publicLoading,
    isError: publicError,
    error: publicErrorObj,
  } = useGetCourseDetailLegacyQuery(actualCourseId);

  const isLoading = user ? purchaseLoading : publicLoading;
  const isError = user ? purchaseError : publicError;
  const error = user ? purchaseErrorObj : publicErrorObj;

  const source = (user ? purchaseData : publicData) || {};
  const { course, purchased = false, isCreator = false } = source;

  // Modules and time
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const totalLectures = modules.reduce(
    (sum, mod) => sum + (mod.lectures?.length || 0),
    0
  );
  let totalTime = 0;
  if (course?.totalTime != null) {
    totalTime = course.totalTime;
  } else if (modules.length > 0) {
    totalTime = modules.reduce((sum, mod) => {
      const moduleSum = Array.isArray(mod.lectures)
        ? mod.lectures.reduce((acc, lec) => acc + (lec.duration || 0), 0)
        : 0;
      return sum + moduleSum;
    }, 0);
  }

  // Reviews query for stars
  const { data: reviewsData } = useGetCourseReviewsQuery(actualCourseId);
  const avgRating = getAvgRating(reviewsData?.reviews);

  // Progress
  const [createCheckoutSession, { isLoading: checkoutLoading }] =
    useCreateCheckoutSessionMutation();
  const { data: progressData } = useGetCourseProgressQuery(actualCourseId, {
    skip: !purchased,
  });
  const progressPercent =
    purchased && progressData
      ? progressData.data.data?.courseProgressPercent ?? 0
      : 0;

  if (isLoading) {
    return (
      <Card className="flex justify-center items-center h-80 bg-gray-900">
        <div className=" animate-pulse rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </Card>
    );
  }

  if (isError || !course) {
    return (
      <Card className="flex justify-center items-center h-80 bg-gray-900">
        <p className="text-red-600">
          Failed to load course.
          {error?.data?.message && (
            <span className="text-xs text-gray-400">{error.data.message}</span>
          )}
        </p>
      </Card>
    );
  }

  const creator =
    Array.isArray(course.creator) && course.creator.length
      ? course.creator[0]
      : course.creator || {};
  const instructorName = creator.name || "Instructor";
  const instructorAvatar = creator.photoUrl;

  const cardTarget = isCreator
    ? `/course-detail/${course._id}`
    : purchased
    ? `/course-progress/${course._id}`
    : `/course-detail/${course._id}`;

  // ---- UPDATED CHECKOUT HANDLER FOR RAZORPAY ----
  const handleBuyNow = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setLocalError(null);
    try {
      const resp = await createCheckoutSession(course._id).unwrap();
      const { razorpayKey, amount, currency, orderId, successUrl, failureUrl } =
        resp;
      const options = {
        key: razorpayKey,
        amount, // in paise
        currency,
        order_id: orderId,
        handler: function (paymentResult) {
          window.location.href = successUrl;
        },
        modal: {
          ondismiss: function () {
            window.location.href = failureUrl;
          },
        },
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch {
      setLocalError("Failed to initiate checkout. Please try again.");
    }
  };

  const handleContinue = (e) => {
    e.preventDefault();
    navigate(`/course-progress/${course._id}`);
  };

  return (
    <div className="group">
      <Link to={cardTarget} className="block h-full">
        <Card className="overflow-hidden aspect-[1/1] w-full max-w-xs flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
          <div className="relative aspect-[1.7/1] w-full overflow-hidden">
            <img
              src={course.courseThumbnail || "/api/placeholder/400/400"}
              alt={course.courseTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 text-[11px] font-semibold rounded-full shadow-lg">
                {course.courseLevel}
              </Badge>
            </div>
            {isCreator && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 text-[11px] font-semibold rounded-full shadow-lg">
                  Instructor
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="flex flex-col flex-1 justify-between px-4 pt-2 pb-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="font-bold text-[1.1rem] text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 flex-1">
                {course.courseTitle}
              </h2>
              <div className="flex items-center ml-2">
                {renderStars(avgRating)}
              </div>
            </div>
            {course.category && (
              <div className="mb-2">
                <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 text-[10px] font-medium rounded">
                  {course.category}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 mb-2">
              <Avatar className="h-6 w-6 border border-gray-200 dark:border-gray-700">
                <AvatarImage src={instructorAvatar} alt="Instructor" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[11px] font-semibold">
                  {instructorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-700 dark:text-gray-400 truncate">
                {instructorName}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-auto">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ₹{course.coursePrice}
              </div>
              {showPurchaseButton && !isCreator && (
                <div onClick={(e) => e.preventDefault()}>
                  {purchased ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                      onClick={handleContinue}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                      onClick={handleBuyNow}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? "Processing..." : "Buy Now"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            {localError && (
              <div className="text-red-500 text-xs pt-1">{localError}</div>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default Course;
