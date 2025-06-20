// src/components/PurchaseHistory.jsx
import React from "react";
import { useSelector } from "react-redux";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { Link } from "react-router-dom";

const PurchaseHistory = () => {
  const { user } = useSelector((store) => store.auth);

  const {
    data: purchaseData,
    isLoading: purchasesLoading,
    error: purchasesError,
  } = useGetPurchasedCoursesQuery(undefined, { skip: !user });

  const {
    data: publishedData,
    isLoading: publishedLoading,
    error: publishedError,
  } = useGetPublishedCourseQuery();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center text-lg text-gray-600 dark:text-gray-300">
          Please log in to view your purchase history.
        </div>
      </div>
    );
  }

  if (purchasesLoading || publishedLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center text-lg">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (purchasesError || publishedError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center text-lg text-red-500">
          Failed to load purchase history.
        </div>
      </div>
    );
  }

  const purchases = purchaseData?.purchasedCourse || [];
  const publishedList = Array.isArray(publishedData)
    ? publishedData
    : publishedData?.courses || [];

  const visiblePurchases = purchases.filter((p) => {
    const course = p.courseId;
    return (
      p.userId === user._id &&
      course &&
      publishedList.some((pub) => String(pub._id) === String(course._id))
    );
  });

  if (visiblePurchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center text-lg text-gray-600 dark:text-gray-300">
          No purchases found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">
        Purchase History
      </h1>
      <div className="overflow-x-auto rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Category / Level
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {visiblePurchases.map((purchase) => {
              const course = purchase.courseId;
              return (
                <tr
                  key={purchase._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <img
                        src={course.courseThumbnail || "/default-course.jpg"}
                        alt={course.courseTitle}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 mr-4"
                      />
                      <div>
                        <Link
                          to={`/course-detail/${course._id}`}
                          className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {course.courseTitle}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {course.courseSubtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {course.category} / {course.courseLevel}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    ₹{purchase.amount}
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {purchase.purchaseDate
                      ? new Date(purchase.purchaseDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "-"}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold leading-5 ${
                        purchase.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex space-x-3">
                      <Link
                        to={`/course-detail/${course._id}`}
                        className="px-3 py-2 text-sm font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                      >
                        Continue
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseHistory;
