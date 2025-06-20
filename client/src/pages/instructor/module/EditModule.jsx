// src/pages/instructor/module/EditModule.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";

import {
  useEditModuleMutation,
  useRemoveModuleMutation,
  useGetModuleByIdQuery,
  useGetModuleLecturesQuery,
  useCreateLectureMutation,
  useRemoveLectureVideoMutation,
  useRemoveLectureQuizMutation,
  useRemoveLectureMutation,
} from "@/features/api/courseApi";

const EditModule = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const [moduleTitle, setModuleTitle] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // "toQuiz" or "toVideo" or null

  // NEW: multiple select/delete
  const [selectedLectures, setSelectedLectures] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: moduleData,
    isLoading: moduleMetaLoading,
    isError: moduleMetaError,
  } = useGetModuleByIdQuery(moduleId);

  const [
    editModule,
    { isLoading: editLoading, isSuccess: editSuccess, isError: editError },
  ] = useEditModuleMutation();

  const [
    removeModule,
    {
      isLoading: removeLoading,
      isSuccess: removeSuccess,
      isError: removeError,
    },
  ] = useRemoveModuleMutation();

  const [removeLecture] = useRemoveLectureMutation();

  const [
    createLecture,
    {
      isLoading: createLectureLoading,
      isSuccess: createLectureSuccess,
      isError: createLectureError,
    },
  ] = useCreateLectureMutation();

  const {
    data: lectureData,
    isLoading: lectureLoading,
    isError: lectureFetchError,
    refetch: refetchLectures,
  } = useGetModuleLecturesQuery(moduleId);

  const [removeLectureVideo] = useRemoveLectureVideoMutation();
  const [removeLectureQuiz] = useRemoveLectureQuizMutation();

  useEffect(() => {
    if (moduleData?.module) setModuleTitle(moduleData.module.moduleTitle);
  }, [moduleData]);

  useEffect(() => {
    if (editSuccess) toast.success("Module updated!");
    if (editError)
      toast.error(editError?.data?.message || "Error updating module");
  }, [editSuccess, editError]);

  useEffect(() => {
    if (removeSuccess) {
      toast.success("Module removed!");
      navigate(`/instructor/course/${courseId}/module`, { replace: true });
    }
    if (removeError)
      toast.error(
        removeError?.data?.message || "Delete all lectures to remove module"
      );
  }, [removeSuccess, removeError, navigate, courseId]);

  useEffect(() => {
    if (createLectureSuccess) {
      setLectureTitle("");
      toast.success("Lecture created!");
      refetchLectures();
    }
    if (createLectureError)
      toast.error(
        createLectureError?.data?.message || "Error creating lecture"
      );
  }, [createLectureSuccess, createLectureError, refetchLectures]);

  const editModuleHandler = async () => {
    if (!moduleTitle.trim()) return toast.error("Module title cannot be empty");
    await editModule({ moduleId, moduleTitle: moduleTitle.trim() });
  };

  const removeModuleHandler = async () => {
    await removeModule({ courseId, moduleId }).unwrap();
  };

  const createLectureHandler = async () => {
    if (!lectureTitle.trim()) return toast.error("Lecture title is required");
    await createLecture({ lectureTitle: lectureTitle.trim(), moduleId });
  };

  // NEW: toggle selection for bulk delete
  const toggleLectureSelection = (id) => {
    setSelectedLectures((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    );
  };

  // NEW: bulk delete selected lectures
  const deleteSelectedLectures = async () => {
    if (!selectedLectures.length) return;
    setIsDeleting(true);
    try {
      for (const lid of selectedLectures) {
        await removeLecture({ moduleId, lectureId: lid }).unwrap();
      }
      toast.success("Selected lectures removed!");
      setSelectedLectures([]);
      refetchLectures();
    } catch (err) {
      toast.error("Error deleting selected lectures");
    } finally {
      setIsDeleting(false);
    }
  };

  // NEW: individual delete
  const handleIndividualDelete = async (lectureIdToDelete) => {
    try {
      await removeLecture({ moduleId, lectureId: lectureIdToDelete }).unwrap();
      toast.success("Lecture deleted");
      setSelectedLectures((prev) =>
        prev.filter((id) => id !== lectureIdToDelete)
      );
      refetchLectures();
    } catch (err) {
      toast.error("Failed to delete lecture");
    }
  };

  const handleLectureClick = (lectureId) => {
    setSelectedLectureId(lectureId);
    setModalVisible(true);
    setConfirmAction(null);
  };

  const selectedLecture =
    lectureData?.lectures.find((l) => l._id === selectedLectureId) || {};
  const hasVideo = Boolean(selectedLecture.videoUrl);
  const hasQuiz =
    Array.isArray(selectedLecture.quiz?.questions) &&
    selectedLecture.quiz.questions.length > 0;

  const onEditVideo = () => {
    setModalVisible(false);
    navigate(
      `/instructor/course/${courseId}/module/${moduleId}/lecture/${selectedLectureId}`
    );
  };
  const onEditQuiz = () => {
    setModalVisible(false);
    navigate(
      `/instructor/course/${courseId}/module/${moduleId}/lecture/${selectedLectureId}/quiz`
    );
  };
  const onConvertToQuiz = () => setConfirmAction("toQuiz");
  const onConvertToVideo = () => setConfirmAction("toVideo");
  const closeModal = () => {
    setModalVisible(false);
    setSelectedLectureId(null);
    setConfirmAction(null);
  };

  const confirmConvert = async () => {
    if (confirmAction === "toQuiz") {
      await removeLectureVideo({
        moduleId,
        lectureId: selectedLectureId,
      }).unwrap();
      navigate(
        `/instructor/course/${courseId}/module/${moduleId}/lecture/${selectedLectureId}/quiz`
      );
    } else if (confirmAction === "toVideo") {
      await removeLectureQuiz({
        courseId,
        moduleId,
        lectureId: selectedLectureId,
      }).unwrap();
      navigate(
        `/instructor/course/${courseId}/module/${moduleId}/lecture/${selectedLectureId}`
      );
    }
  };

  if (moduleMetaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen"></div>
    );
  }
  if (moduleMetaError) {
    return (
      <div className="p-8">
        <p className="text-red-500">Failed to load module details.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-10 pb-10 relative">
      {/* Breadcrumb */}
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
        <Link
          to={`/instructor/course/${courseId}/module`}
          className="hover:text-gray-700"
        >
          Add Module
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}/module/${moduleId}`}
          className="hover:text-gray-700"
        >
          Edit Module
        </Link>
      </div>

      {/* Module Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="font-bold text-2xl mb-2">Edit Module</h1>
          <Label htmlFor="moduleTitleInput" className="block text-sm mb-1">
            Module Title
          </Label>
          <Input
            id="moduleTitleInput"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Module Title"
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button disabled={editLoading} onClick={editModuleHandler}>
            {editLoading ? (
              <span className="text-lg font-bold">Updating...</span>
            ) : (
              "Update Name"
            )}
          </Button>
          <Button
            variant="destructive"
            disabled={removeLoading}
            onClick={removeModuleHandler}
          >
            {removeLoading ? (
              <span className="text-lg font-bold">Removing...</span>
            ) : (
              "Remove Module"
            )}
          </Button>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700 mb-8" />

      {/* Lectures List */}
      <div className="mb-8">
        <h2 className="font-semibold text-xl mb-4">Lectures in this Module</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="Lecture Title"
            className="flex-1"
          />
          <Button
            disabled={createLectureLoading}
            onClick={createLectureHandler}
            className="whitespace-nowrap"
          >
            {createLectureLoading ? (
              <>
                <span className="text-lg font-bold">Adding…</span>
              </>
            ) : (
              "Add Lecture"
            )}
          </Button>
          <Button
            variant="destructive"
            disabled={selectedLectures.length === 0 || isDeleting}
            onClick={deleteSelectedLectures}
          >
            {isDeleting ? (
              <span className="text-lg font-bold">Deleting</span>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
        {lectureLoading ? (
          <p className="text-gray-500">Loading lectures…</p>
        ) : lectureFetchError ? (
          <p className="text-red-500">Failed to load lectures.</p>
        ) : lectureData?.lectures?.length === 0 ? (
          <p className="text-gray-500">No lectures in this module.</p>
        ) : (
          <div className="space-y-4">
            {lectureData.lectures.map((lec, idx) => {
              const v = Boolean(lec.videoUrl);
              const q =
                Array.isArray(lec.quiz?.questions) &&
                lec.quiz.questions.length > 0;
              return (
                <div
                  key={lec._id}
                  onClick={() => handleLectureClick(lec._id)}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {/* Bulk select checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedLectures.includes(lec._id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLectureSelection(lec._id);
                      }}
                      className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-gray-400">{idx + 1}.</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {lec.lectureTitle}
                    </span>
                    {v && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        Video
                      </span>
                    )}
                    {q && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Quiz
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Individual delete icon */}
                    <Trash2
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIndividualDelete(lec._id);
                      }}
                      className="w-5 h-5 text-red-500 hover:text-red-700"
                    />
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-10">
        <Button
          variant="outline"
          onClick={() => navigate(`/instructor/course/${courseId}/module`)}
        >
          Back to Modules
        </Button>
      </div>

      {/* Modal for Edit/Convert or Confirm */}
      {modalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90%] max-w-sm p-6 z-10">
            {!confirmAction ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {hasVideo || hasQuiz
                    ? "Edit or Convert Lecture"
                    : "Choose Lecture Type"}
                </h3>
                <div className="flex flex-col space-y-3">
                  {hasVideo && (
                    <>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={onEditVideo}
                      >
                        Edit Video
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={onConvertToQuiz}
                      >
                        Convert to Quiz
                      </Button>
                    </>
                  )}
                  {hasQuiz && (
                    <>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={onEditQuiz}
                      >
                        Edit Quiz
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={onConvertToVideo}
                      >
                        Convert to Video
                      </Button>
                    </>
                  )}
                  {!hasVideo && !hasQuiz && (
                    <>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={onEditVideo}
                      >
                        Add Video
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={onEditQuiz}
                      >
                        Add Quiz
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="  p-4 rounded">
                <h4 className="text-red-800 dark:text-red-600 font-semibold mb-2">
                  Warning
                </h4>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {confirmAction === "toQuiz"
                    ? "Converting to quiz will permanently delete the existing video. Continue?"
                    : "Converting to video will permanently delete the existing quiz. Continue?"}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmConvert}>
                    Yes, proceed
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModule;
