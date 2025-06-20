// src/pages/instructor/course/CourseTable.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetCreatorCourseQuery,
  usePublishCourseMutation,
} from "@/features/api/courseApi";
import { Edit, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import LoadingScreen from "@/loadingscreen";

const CourseTable = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useGetCreatorCourseQuery();
  const [publishCourse] = usePublishCourseMutation();

  // ─── State for Search & Filter ───
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Auto‐unpublish courses with no lectures ───
  useEffect(() => {
    if (isLoading || !data?.courses) return;
    const toUnpublish = data.courses.filter(
      (c) =>
        c.isPublished && (!Array.isArray(c.lectures) || c.lectures.length === 0)
    );
    if (!toUnpublish.length) return;
    Promise.all(
      toUnpublish.map((c) => publishCourse({ courseId: c._id, query: "false" }))
    )
      .then(() => {
        toast.success("Courses without lectures were unpublished.");
        refetch();
      })
      .catch(() => toast.error("Failed to unpublish some courses."));
  }, [data, isLoading, publishCourse, refetch]);

  // ─── Filter & Search ───
  const filteredCourses = useMemo(() => {
    if (!data?.courses) return [];
    return data.courses
      .filter((c) =>
        c.courseTitle.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter((c) => {
        if (statusFilter === "published") return c.isPublished;
        if (statusFilter === "draft") return !c.isPublished;
        return true;
      });
  }, [data?.courses, searchText, statusFilter]);

  if (isLoading)
  {
    <LoadingScreen/>
  }

  return (
    <div className="mb-20">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <Button
          onClick={() => navigate("create")}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          Create a new course
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 w-full sm:w-60"
          />

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 w-full sm:w-48"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Course Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="w-[100px]">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <TableRow
                key={course._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <TableCell className="font-medium">
                  {course.courseTitle}
                </TableCell>

                <TableCell>{course.category || "—"}</TableCell>
                <TableCell>{course.courseLevel || "—"}</TableCell>

                <TableCell>
                  {course.coursePrice ? `₹${course.coursePrice}` : "NA"}
                </TableCell>

                <TableCell>
                  <Badge
                    className={
                      course.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>

                <TableCell>
                  {new Date(course.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(course.updatedAt).toLocaleDateString()}
                </TableCell>

                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`${course._id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No courses found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseTable;
