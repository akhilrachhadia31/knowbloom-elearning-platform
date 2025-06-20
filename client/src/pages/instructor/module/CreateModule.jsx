// src/pages/instructor/course/CreateModule.jsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useCreateModuleMutation,
  useGetCourseModulesQuery,
} from "@/features/api/courseApi";
import { Edit } from "lucide-react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ChevronRight } from "lucide-react";

const CreateModule = () => {
  const [moduleTitle, setModuleTitle] = useState("");
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [createModule, { data, isLoading, isSuccess, error }] =
    useCreateModuleMutation();
  const {
    data: moduleData,
    isLoading: moduleLoading,
    refetch,
  } = useGetCourseModulesQuery(courseId);

  const createModuleHandler = async () => {
    if (!moduleTitle.trim()) {
      toast.error("Module title is required");
      return;
    }
    await createModule({ moduleTitle: moduleTitle.trim(), courseId });
  };

  useEffect(() => {
    if (isSuccess) {
      setModuleTitle("");
      toast.success(data.message || "Module created!");
      refetch();
    }
    if (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  }, [isSuccess, error, data, refetch]);

  // Count modules
  const totalModules = moduleData?.modules?.length || 0;

  return (
    <div className="flex-1 mx-10">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center space-x-1 text-sm text-gray-400 mb-4">
        <Link to="/instructor/course" className="hover:text-gray-700">
          Courses
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}`}
          className="hover:text-gray-700"
        >
          Course Details
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-400">Add Module</span>
      </div>

      <div className="mb-4">
        <h1 className="font-bold text-xl">Add modules to your course</h1>
        <p className="text-sm">
          Provide a module title and manage your course structure.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Module Title</Label>
          <Input
            type="text"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Module Name"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/instructor/course/${courseId}`)}
          >
            Back to course
          </Button>
          <Button disabled={isLoading} onClick={createModuleHandler}>
            {isLoading ? (
              <>
                <span className="text-lg font-bold">Creating...</span>
              </>
            ) : (
              "Create Module"
            )}
          </Button>
        </div>

        {/* ─── Module List ─── */}
        <div className="mt-10">
          <h2 className="font-semibold text-lg mb-2">
            Total Modules: {totalModules}
          </h2>
          {moduleLoading ? (
            <p>Loading modules...</p>
          ) : moduleData?.modules?.length === 0 ? (
            <p>No modules available</p>
          ) : (
            moduleData.modules.map((module, index) => (
              <div
                key={module._id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-md my-2"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    Module – {index + 1}: {module.moduleTitle}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/instructor/course/${courseId}/module/${module._id}`
                    )
                  }
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateModule;
