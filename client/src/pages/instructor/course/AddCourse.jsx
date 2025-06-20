// src/pages/instructor/course/AddCourse.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Logo from "@/components/Logo";
import { useCreateCourseMutation } from "@/features/api/courseApi";

const AddCourse = () => {
  const [courseTitle, setCourseTitle] = useState("");
  const [category, setCategory] = useState("");
  const [createCourse, { data, isLoading, error, isSuccess }] =
    useCreateCourseMutation();
  const navigate = useNavigate();

  const createCourseHandler = () => {
    if (!courseTitle || !category) {
      toast.error("Please fill all fields.");
      return;
    }
    createCourse({ courseTitle, category });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Course created.");
      navigate("/instructor/course");
    }
    if (error) {
      toast.error(error.data?.message || "Failed to create course.");
    }
  }, [isSuccess, error, data, navigate]);

  return (
    <div className="flex-1 mx-10">
      <h1 className="font-bold text-xl mb-2">Create a New Course</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="Your Course Name"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value)}
          >
            <SelectTrigger id="category" className="w-[200px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Category</SelectLabel>
                {[
                  "Web Development",
                  "Mobile Development",
                  "Fullstack Development",
                  "JavaScript",
                  "Python",
                  "Data Science",
                  "Artificial Intelligence",
                  "Machine Learning",
                  "UI/UX Design",
                  "Graphic Design",
                  "Digital Marketing",
                  "Photography",
                  "Music & Audio",
                  "Business Management",
                  "Entrepreneurship",
                  "Finance & Accounting",
                  "Personal Development",
                  "Health & Fitness",
                  "Language Learning",
                  "Teaching & Academics",
                ].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium
      hover:bg-blue-800 transition"
            onClick={() => navigate("/instructor/course")}
          >
            Back
          </button>
          <button
            type="button"
            className={`bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium
      hover:bg-blue-800 transition animated-btn ${
        isLoading ? "opacity-70 cursor-not-allowed" : ""
      }`}
            disabled={isLoading}
            onClick={createCourseHandler}
          >
            {isLoading ? (
              <>
                <span className="text-lg font-bold">Creating...</span>
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
