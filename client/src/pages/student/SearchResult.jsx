// src/components/SearchResult.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useGetCourseDetailWithStatusQuery,
  useCreateCheckoutSessionMutation,
} from "@/features/api/purchaseApi";

const SearchResult = ({ course }) => {
  const { _id } = course;
  const navigate = useNavigate();

  const { data: detailData, isLoading: isDetailLoading } =
    useGetCourseDetailWithStatusQuery(_id, {
      refetchOnMountOrArgChange: true,
    });

  const [createCheckoutSession, { isLoading: isCheckoutLoading }] =
    useCreateCheckoutSessionMutation();

  if (isDetailLoading) {
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
        {/* ... your skeleton markup ... */}
      </div>
    );
  }

  const dataSource = detailData?.course || course;
  const {
    courseThumbnail,
    courseTitle,
    courseSubtitle,
    category,
    courseLevel,
    coursePrice,
    creator,
    studentsEnrolledCount,
  } = dataSource;

  const purchased = detailData?.purchased || false;
  const isCreator = detailData?.isCreator || false;

  const priceLabel =
    coursePrice === 0 ? (
      <span className="text-green-600 dark:text-green-400 font-semibold">
        Free
      </span>
    ) : (
      <span className="text-gray-900 dark:text-gray-100 font-semibold">
        ₹{coursePrice}
      </span>
    );

  const handleNavigate = () => {
    navigate(`/course-detail/${_id}`);
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    if (purchased && !isCreator) {
      navigate(`/course-progress/${_id}`);
    } else {
      navigate(`/course-detail/${_id}`);
    }
  };

  const handleBuyClick = async (e) => {
    e.stopPropagation();
    try {
      // Pass the raw course ID, not an object
      const resp = await createCheckoutSession(_id).unwrap();
      const {
        razorpayKey,
        amount,
        currency,
        orderId,
        successUrl,
        failureUrl,
        courseTitle,
        courseThumbnail,
      } = resp;

      const options = {
        key: razorpayKey,
        amount,
        currency,
        name: courseTitle,
        image: courseThumbnail,
        order_id: orderId,
        handler: () => {
          window.location.href = successUrl;
        },
        modal: {
          ondismiss: () => {
            window.location.href = failureUrl;
          },
        },
        prefill: {},
        notes: { course_id: _id },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        window.location.href = failureUrl;
      });
      rzp.open();
    } catch {
      navigate("/login");
    }
  };

  return (
    <div
      onClick={handleNavigate}
      className="cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 group"
    >
      <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
        <img
          src={courseThumbnail}
          alt={`${courseTitle} thumbnail`}
          className="h-36 w-full md:w-64 object-cover rounded-lg bg-gray-200 dark:bg-gray-700"
        />
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            {courseTitle}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {courseSubtitle}
          </p>
          <div className="flex items-center space-x-3 mt-2">
            <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs uppercase py-1 px-2 rounded">
              {category}
            </Badge>
            <Badge
              variant="outline"
              className="border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-xs uppercase py-1 px-2 rounded"
            >
              {courseLevel}
            </Badge>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <Avatar className="h-8 w-8">
              {creator?.photoUrl ? (
                <AvatarImage src={creator.photoUrl} alt={creator.name} />
              ) : (
                <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                  {creator?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
              {creator?.name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-3 mt-6 md:mt-0">
        <div>{priceLabel}</div>
        {typeof studentsEnrolledCount === "number" && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {studentsEnrolledCount}{" "}
            {studentsEnrolledCount === 1 ? "student" : "students"}
          </div>
        )}

        {isCreator || purchased ? (
          <Button
            onClick={handleViewClick}
            className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            View Details
          </Button>
        ) : (
          <Button
            onClick={handleBuyClick}
            disabled={isCheckoutLoading}
            className="bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600"
          >
            {isCheckoutLoading ? "Processing..." : "Buy Course"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchResult;
