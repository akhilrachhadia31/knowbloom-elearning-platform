import React, { useState, useEffect, useMemo } from "react";
import {
  useGetCreatorCourseQuery,
  useGetCourseReviewsQuery,
} from "@/features/api/courseApi";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const ReviewCard = ({ review }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-medium text-gray-900 dark:text-white">
        {review.user?.name || "Anonymous"}
      </h4>
      <div className="flex space-x-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < review.rating ? "currentColor" : "none"}
            strokeWidth={i < review.rating ? 0 : 2}
            className={
              i < review.rating
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }
          />
        ))}
      </div>
    </div>
    <p className="text-gray-700 dark:text-gray-300 mb-1">{review.comment}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {new Date(review.createdAt).toLocaleDateString()}
    </p>
  </div>
);

export default function Reviews() {
  const {
    data: courseListData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useGetCreatorCourseQuery();
  const courses = courseListData?.courses || [];

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (courses.length && !selectedCourseId) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  const {
    data,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError,
  } = useGetCourseReviewsQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });
  const reviews = data?.reviews || [];

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        const name = r.user?.name?.toLowerCase() || "";
        return (
          name.includes(search.toLowerCase()) ||
          r.comment.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [reviews, search]
  );

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Reviews
      </h1>

      {/* selector + search */}
      <div className="flex flex-wrap gap-4">
        {isCoursesLoading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading courses…</p>
        ) : isCoursesError ? (
          <p className="text-yellow-500">No review given for the courses </p>
        ) : (
          <Select
            value={selectedCourseId}
            onValueChange={setSelectedCourseId}
            className="w-64"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.courseTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search reviews..."
        className="flex-1 max-w-md mt-12"
      />

      {/* reviews card */}
      {selectedCourseId && (
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
          <CardHeader className="px-6 pt-6">
            <CardTitle>Student Reviews</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* average */}
            <div>
              <div className="flex items-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {average.toFixed(1)}
                </span>
                <div className="flex ml-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={24}
                      fill={i < Math.round(average) ? "currentColor" : "none"}
                      strokeWidth={i < Math.round(average) ? 0 : 2}
                      className={
                        i < Math.round(average)
                          ? "text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }
                    />
                  ))}
                </div>
                <span className="ml-4 text-gray-600 dark:text-gray-400">
                  {reviews.length} review{reviews.length !== 1 && "s"}
                </span>
              </div>
            </div>

            {/* breakdown */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length
                  ? Math.round((count / reviews.length) * 100)
                  : 0;
                return (
                  <div key={star} className="flex items-center">
                    <span className="w-12 text-sm text-gray-700 dark:text-gray-300">
                      {star} star
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-2 overflow-hidden">
                      <div
                        className="h-2 bg-yellow-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-gray-600 dark:text-gray-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* review list */}
            {isReviewsLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading…</p>
            ) : isReviewsError ? (
              <p className="text-red-500">
                Failed to load reviews
                {reviewsError?.message ? `: ${reviewsError.message}` : "."}
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No reviews found.
              </p>
            ) : (
              <div className="space-y-4">
                {filtered.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
