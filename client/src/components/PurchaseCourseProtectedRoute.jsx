// src/components/PurchaseCourseProtectedRoute.jsx
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import LoadingScreen from "@/loadingscreen";

const PurchaseCourseProtectedRoute = ({ children }) => {
  const { courseId } = useParams();
  const { data, isLoading, isError } =
    useGetCourseDetailWithStatusQuery(courseId);

  if (isLoading) {
    <LoadingScreen />;
  }
  if (isError) return <p>Failed to load purchase status.</p>;

  // If the user has purchased this course, render children; otherwise redirect.
  return data?.purchased ? (
    children
  ) : (
    <Navigate to={`/course-detail/${courseId}`} />
  );
};

export default PurchaseCourseProtectedRoute;
