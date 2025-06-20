import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  useEditModuleLectureMutation,
  useGetLectureByIdQuery,
  useRemoveLectureMutation,
} from "@/features/api/courseApi";
import axios from "axios";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const MEDIA_API = `${import.meta.env.VITE_API_URL}/api/v1/media`;

const EditLecture = () => {
  const [lectureTitle, setLectureTitle] = useState("");
  const [uploadVideoInfo, setUploadVideoInfo] = useState(null);
  const [isFree, setIsFree] = useState(false);
  const [mediaProgress, setMediaProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { courseId, moduleId, lectureId } = useParams();
  const navigate = useNavigate();

  const { data: lectureData } = useGetLectureByIdQuery(lectureId);
  const lecture = lectureData?.lecture;

  useEffect(() => {
    if (lecture) {
      setLectureTitle(lecture.lectureTitle);
      setIsFree(lecture.isPreviewFree);
      setUploadVideoInfo({
        videoUrl: lecture.videoUrl,
        publicId: lecture.publicId,
      });
    }
  }, [lecture]);

  const [editLecture, { data, isLoading, error, isSuccess }] =
    useEditModuleLectureMutation();
  const [
    removeLecture,
    { data: removeData, isLoading: removeLoading, isSuccess: removeSuccess },
  ] = useRemoveLectureMutation();

  const fileChangeHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      setMediaProgress(true);
      setUploadProgress(0);

      let simulatedProgress = 0;
      const increment = () => {
        if (simulatedProgress < 95) {
          simulatedProgress += 1;
          setUploadProgress(simulatedProgress);
        }
      };

      const interval = setInterval(increment, 100);

      try {
        const res = await axios.post(`${MEDIA_API}/upload-video`, formData);

        clearInterval(interval);
        setUploadProgress(100);

        if (res.data.success) {
          setUploadVideoInfo({
            videoUrl: res.data.data.url,
            publicId: res.data.data.public_id,
          });
          toast.success(res.data.message);
        }
      } catch (error) {
        clearInterval(interval);
        setUploadProgress(0);
        toast.error("video upload failed");
      } finally {
        setMediaProgress(false);
      }
    }
  };

  const editLectureHandler = async () => {
    await editLecture({
      lectureTitle,
      videoInfo: uploadVideoInfo,
      isPreviewFree: isFree,
      moduleId,
      lectureId,
    });
  };

  const removeLectureHandler = async () => {
    await removeLecture({ moduleId, lectureId });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      navigate(`/instructor/course/${courseId}/module/${moduleId}`, {
        replace: true,
      });
    }
    if (error) {
      toast.error(error.data?.message);
    }
  }, [isSuccess, error, data, navigate, courseId, moduleId]);

  useEffect(() => {
    if (removeSuccess) {
      toast.success(removeData.message);
      navigate(`/instructor/course/${courseId}/module/${moduleId}`, {
        replace: true,
      });
    }
  }, [removeSuccess, navigate, removeData, courseId, moduleId]);

  return (
    <div className="flex-1 mx-10">
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
        <ChevronRight className="w-4 h-4" />
        <Link
          to={`/instructor/course/${courseId}/module/${moduleId}/lecture/${lectureId}`}
          className="hover:text-gray-700"
        >
          Edit Lecture
        </Link>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-bold text-xl">Update Your Lecture</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={removeLoading}
            variant="destructive"
            onClick={removeLectureHandler}
          >
            {removeLoading ? (
              <>
                <span className="text-lg font-bold">Removing...</span>
              </>
            ) : (
              "Remove Lecture"
            )}
          </Button>
        </div>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={lectureTitle}
          onChange={(e) => setLectureTitle(e.target.value)}
          type="text"
          placeholder="Ex. Introduction to Javascript"
        />
      </div>
      <div className="my-5">
        <Label>
          Video <span className="text-red-500">*</span>
        </Label>
        <Input
          type="file"
          accept="video/*"
          onChange={fileChangeHandler}
          className="w-fit"
        />
      </div>
      <div className="flex items-center space-x-2 my-5">
        <Switch
          checked={isFree}
          onCheckedChange={setIsFree}
          id="airplane-mode"
        />
        <Label htmlFor="airplane-mode">Is this video FREE</Label>
      </div>
      {mediaProgress && (
        <div className="my-4">
          <Progress value={uploadProgress} />
          <p>{uploadProgress}% uploaded</p>
        </div>
      )}
      {!mediaProgress && uploadProgress === 100 && (
        <div className="my-4">
          <Progress value={uploadProgress} />
          <p>100% uploaded</p>
        </div>
      )}
      <div className="mt-4">
        <Button
          disabled={isLoading || mediaProgress}
          onClick={editLectureHandler}
        >
          {isLoading ? (
            <>
              <span className="text-lg font-bold">Updating...</span>
            </>
          ) : (
            "Update Lecture"
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditLecture;
