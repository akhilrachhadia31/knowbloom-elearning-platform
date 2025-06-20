// src/pages/instructor/lecture/LectureTab.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import ReactPlayer from "react-player";
import { ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

import {
  useGetLectureByIdQuery,
  useGetLectureVideoInfoQuery,
  useEditModuleLectureMutation,
  useRemoveLectureVideoMutation,
} from "@/features/api/courseApi";

// ——— Change this to match your actual Cloudinary/upload‐API base URL:
const MEDIA_API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/media`;

const LectureTab = () => {
  const { courseId, moduleId, lectureId } = useParams();
  const navigate = useNavigate();

  // 1) Fetch “legacy” lecture metadata (title + preview + any existing videoUrl)
  const {
    data: lectureData,
    isLoading: lectureLoading,
    isError: lectureError,
  } = useGetLectureByIdQuery(lectureId);
  const lecture = lectureData?.lecture || {};

  // 2) Fetch “video‐info” for this module‐lecture (the server will respond { videoUrl, publicId, preview, duration })
  const {
    data: videoInfoData,
    isLoading: videoInfoLoading,
    isError: videoInfoError,
  } = useGetLectureVideoInfoQuery(
    { moduleId, lectureId },
    { skip: !moduleId || !lectureId }
  );
  const videoInfoFromServer = videoInfoData?.videoInfo || {
    videoUrl: "",
    publicId: "",
    preview: false,
    duration: 0,
  };

  //
  // ───────────────────────────────────────────────
  // LOCAL STATE (client‐only)
  // ───────────────────────────────────────────────
  const [lectureTitle, setLectureTitle] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [uploadedVideoInfo, setUploadedVideoInfo] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [videoRemoved, setVideoRemoved] = useState(false);

  // ────────────────────────────────────────────────────────────
  //  Hooks: RTK Query mutations
  // ────────────────────────────────────────────────────────────

  // 3) “Edit Module Lecture” (this will PUT to `/module/:moduleId/lecture/:lectureId`)
  const [
    editLecture,
    {
      data: editData,
      isLoading: editLoading,
      isError: editError,
      isSuccess: editSuccess,
    },
  ] = useEditModuleLectureMutation();

  // 4) “Remove entire lecture” (DELETE `/module/:moduleId/lecture/:lectureId`)

  // 5) “Remove only the video from this lecture” (DELETE `/module/:moduleId/lecture/:lectureId/remove-video`)
  const [removeLectureVideo] = useRemoveLectureVideoMutation();

  //
  // ───────────────────────────────────────────────
  //  When the “legacy” lecture data arrives, populate local state:
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (lecture) {
      setLectureTitle(lecture.lectureTitle || "");
      setIsFree(!!lecture.preview);
      setVideoRemoved(false);

      // If the “legacy” lecture already had a videoUrl, put that into our upload‐state:
      if (lecture.videoUrl) {
        setUploadedVideoInfo({
          videoUrl: lecture.videoUrl,
          publicId: lecture.publicId || "",
        });
        setBtnDisabled(false);
      }
    }
  }, [lecture]);

  //
  // ───────────────────────────────────────────────
  //  When the server returns videoInfo (for this module‐lecture),
  //  override local state so that we show whatever is stored on the backend:
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (videoInfoFromServer.videoUrl) {
      setUploadedVideoInfo({
        videoUrl: videoInfoFromServer.videoUrl,
        publicId: videoInfoFromServer.publicId,
      });
      setBtnDisabled(false);
      setVideoRemoved(false);
    } else {
      // no server‐returned video, so ensure button remains disabled if we have no local upload
      if (!uploadedVideoInfo?.videoUrl) {
        setBtnDisabled(true);
      }
    }
  }, [videoInfoFromServer]);

  //
  // ───────────────────────────────────────────────
  //  6) Handle file‐upload to your “MEDIA_API_BASE” (Cloudinary, etc.)
  // ───────────────────────────────────────────────
  const fileChangeHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setMediaUploading(true);
    setUploadProgress(0);

    // ── “simulate” a progress bar (just up to 95% while uploading) ──
    let simulatedProgress = 0;
    const intervalId = setInterval(() => {
      if (simulatedProgress < 95) {
        simulatedProgress += 1;
        setUploadProgress(simulatedProgress);
      }
    }, 100);

    try {
      const uploadResponse = await axios.post(
        `${MEDIA_API_BASE}/upload-video`,
        formData
      );
      clearInterval(intervalId);
      setUploadProgress(100);

      if (uploadResponse.data.success) {
        setUploadedVideoInfo({
          videoUrl: uploadResponse.data.data.url,
          publicId: uploadResponse.data.data.public_id,
        });
        setBtnDisabled(false);
        setVideoRemoved(false);
        toast.success("Video uploaded successfully!");
      } else {
        toast.error("Video upload failed on server");
        setUploadProgress(0);
      }
    } catch (err) {
      clearInterval(intervalId);
      setUploadProgress(0);
      toast.error("Video upload encountered an error");
    } finally {
      setMediaUploading(false);
    }
  };

  //
  // ───────────────────────────────────────────────
  //  7) Handle “Replace Video + Save” (or “Update Lecture” if no new file)
  //     We send exactly { lectureTitle, preview, videoInfo }, and RTK Query
  //     picks up moduleId/lectureId from the parameters below to construct the URL.
  // ───────────────────────────────────────────────
  const editLectureHandler = async () => {
    const trimmedTitle = lectureTitle.trim();
    if (!trimmedTitle) {
      toast.error("Lecture title cannot be empty");
      return;
    }

    // Build the exact body “the server expects”:
    const payload = {
      lectureTitle: trimmedTitle,
      preview: isFree,
    };

    // If we have a new or existing videoUrl/publicId in local state, send it nested under “videoInfo”
    if (uploadedVideoInfo && uploadedVideoInfo.videoUrl) {
      payload.videoInfo = {
        videoUrl: uploadedVideoInfo.videoUrl,
        publicId: uploadedVideoInfo.publicId,
      };
    }

    // DEBUG: log the final payload before sending
    if (import.meta.env.DEV) {
      console.log("[LectureTab] editLectureHandler → payload:", payload);
    }

    try {
      await editLecture({ moduleId, lectureId, ...payload }).unwrap();
    } catch (err) {
      // error will be handled below in useEffect
      console.error("[LectureTab] editLectureHandler error:", err);
    }
  };

  //
  // ───────────────────────────────────────────────
  //  9) Handle “Remove only the video” endpoint
  // ───────────────────────────────────────────────
  const removeVideoHandler = async () => {
    try {
      // RTK Query’s “removeLectureVideo” already points at
      // DELETE /course/module/:moduleId/lecture/:lectureId/remove-video
      await removeLectureVideo({ moduleId, lectureId }).unwrap();

      setUploadedVideoInfo(null);
      setVideoRemoved(true);
      toast.success("Video has been removed.");
    } catch (err) {
      console.error("[LectureTab] removeVideoHandler error:", err);
      toast.error("Failed to remove the video.");
    }
  };

  //
  // ───────────────────────────────────────────────
  //  11) On “edit lecture” success or  error, show toast but stay on the same page
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (editSuccess && editData?.message) {
      toast.success(editData.message);
    }
    if (editError) {
      console.error("[LectureTab] editError.payload:", editError.data);
      toast.error(editError.data?.message || "Failed to update lecture.");
    }
  }, [editSuccess, editError, editData]);

  if (lectureLoading || videoInfoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white">
        <div className="flex items-center"></div>
      </div>
    );
  }

  if (lectureError || videoInfoError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white">
        <p className="text-red-500 text-lg">Failed to load lecture details.</p>
      </div>
    );
  }

  //
  // ───────────────────────────────────────────────
  //  13) Decide which video URL to show:
  //      • If user just uploaded a new video, use `uploadedVideoInfo.videoUrl`
  //      • Else fallback to `videoInfoFromServer.videoUrl`
  //      • Else fallback to `lecture.videoUrl` (legacy)
  //      • If they “removed” it, show nothing
  // ───────────────────────────────────────────────
  const finalVideoUrl = videoRemoved
    ? ""
    : uploadedVideoInfo?.videoUrl ||
      videoInfoFromServer.videoUrl ||
      lecture.videoUrl ||
      "";

  //
  // ───────────────────────────────────────────────
  //  14) Render the full UI
  // ───────────────────────────────────────────────
  return (
    <div className="bg-gray-50 dark:bg-[#111827] min-h-screen">
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

      <Card className="bg-white dark:bg-[#1F2937] shadow-lg border border-gray-200 dark:border-gray-700">
        {/* ——— Card Header ——— */}
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 px-6 py-4">
          <div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2">
              Update Your Lecture
            </CardTitle>
            <CardDescription>
              {isFree ? (
                <span className="px-3 py-1 text-green-800 bg-green-200 dark:text-green-300 dark:bg-green-800 rounded-full text-xs uppercase tracking-wide">
                  Free Preview
                </span>
              ) : (
                <span className="px-3 py-1 text-yellow-800 bg-yellow-200 dark:text-yellow-300 dark:bg-yellow-800 rounded-full text-xs uppercase tracking-wide">
                  Locked
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/instructor/course/${courseId}/module/${moduleId}`}
              className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition"
            >
              <Button
                variant="outline"
                className="px-4 py-2 text-sm border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#374151] dark:text-gray-200 dark:hover:bg-[#475163]"
              >
                Back to Module
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-6 py-6">
          {/* 1) Lecture Title */}
          <div className="space-y-2">
            <Label
              htmlFor="lectureTitle"
              className="text-gray-900 dark:text-gray-200"
            >
              Lecture Title
            </Label>
            <Input
              id="lectureTitle"
              type="text"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="Enter lecture title"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* 2) File Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="videoUpload"
              className="text-gray-900 dark:text-gray-200"
            >
              Upload New Video <span className="text-red-500">*</span>
            </Label>
            <Input
              id="videoUpload"
              type="file"
              accept="video/*"
              onChange={fileChangeHandler}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* 3) Video Preview or “No recent video” */}
          <div>
            {finalVideoUrl ? (
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-gray-200">
                  Video Preview
                </Label>
                <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
                  <ReactPlayer
                    key={finalVideoUrl}
                    url={finalVideoUrl}
                    controls
                    width="100%"
                    height="400px"
                    config={{
                      file: { attributes: { controlsList: "nodownload" } },
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {uploadedVideoInfo?.videoUrl
                    ? "Showing newly uploaded video"
                    : videoInfoFromServer.videoUrl
                    ? "Showing server-stored video"
                    : "Showing previously stored video"}
                </p>

                {/* “Remove Video” Button */}
                <div className="mt-2">
                  <Button
                    onClick={removeVideoHandler}
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 text-white text-sm px-4 py-2"
                  >
                    Remove Video
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1F2937]">
                <p className="italic">No recent video</p>
              </div>
            )}
          </div>

          {/* 4) Progress Bar (during upload) */}
          {mediaUploading && (
            <div className="space-y-2">
              <Progress
                className="h-2 bg-gray-200 dark:bg-gray-700"
                indeterminate={false}
                value={uploadProgress}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
          {!mediaUploading && uploadProgress === 100 && (
            <div className="space-y-2">
              <Progress
                value={100}
                className="h-2 bg-green-500 dark:bg-green-400"
              />
              <p className="text-sm text-green-600 dark:text-green-300">
                Upload complete!
              </p>
            </div>
          )}

          {/* 5) “Free Preview” Switch */}
          <div className="flex items-center gap-2">
            <Switch
              id="isFreeSwitch"
              checked={isFree}
              onCheckedChange={setIsFree}
              className="bg-gray-300 data-[state=checked]:bg-primary dark:bg-gray-600"
            />
            <Label
              htmlFor="isFreeSwitch"
              className="text-gray-900 dark:text-gray-200"
            >
              Is this lecture FREE to preview?
            </Label>
          </div>

          {/* 6) “Replace Video + Save” Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button
              onClick={editLectureHandler}
              disabled={editLoading || mediaUploading || btnDisabled}
              variant="primary"
              className="w-full sm:w-auto px-6 py-3 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {editLoading ? (
                <span className="text-lg font-bold">Loading...</span>
              ) : uploadedVideoInfo ? (
                "Replace Video + Save"
              ) : (
                "Update Lecture"
              )}
            </Button>
            {btnDisabled && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                Please upload a video (or ensure one is already stored) before
                saving.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureTab;
