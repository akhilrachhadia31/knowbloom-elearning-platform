// src/pages/instructor/course/CourseTab.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useEditCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useGetCourseByIdQuery,
  useGetCourseDetailQuery,
} from "@/features/api/courseApi";
import LoadingScreen from "@/loadingscreen";

const CourseTab = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // basic info for the form
  const {
    data: basicData,
    isLoading: loadingBasic,
    isError: errorBasic,
    refetch: refetchBasic,
  } = useGetCourseByIdQuery(courseId, { refetchOnMountOrArgChange: true });

  // full detail (modules + lectures + quizzes)
  const {
    data: detailCourse,
    refetch: refetchDetail,
    isFetching: fetchingDetail,
  } = useGetCourseDetailQuery(courseId);

  const [editCourse, { isLoading: saving }] = useEditCourseMutation();
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();
  const [publishCourse, { isLoading: isPublishing }] =
    usePublishCourseMutation();

  const [form, setForm] = useState({
    courseTitle: "",
    subTitle: "",
    description: "",
    category: "",
    courseLevel: "",
    coursePrice: "",
    courseThumbnail: null,
    whatYouWillLearn: [""],
    priorRequirements: [""],
  });
  const [preview, setPreview] = useState("");
  const [isPublishedLocal, setIsPublishedLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // populate on load
  useEffect(() => {
    if (basicData?.course) {
      const c = basicData.course;
      setForm({
        courseTitle: c.courseTitle || "",
        subTitle: c.courseSubtitle || "",
        description: c.courseDescription || "",
        category: c.category || "",
        courseLevel: c.courseLevel || "",
        coursePrice: c.coursePrice?.toString() || "",
        courseThumbnail: null,
        whatYouWillLearn:
          Array.isArray(c.whatYouWillLearn) && c.whatYouWillLearn.length > 0
            ? c.whatYouWillLearn
            : [""],
        priorRequirements:
          Array.isArray(c.priorRequirements) && c.priorRequirements.length > 0
            ? c.priorRequirements
            : [""],
      });
      setPreview(c.courseThumbnail || "");
      setIsPublishedLocal(!!c.isPublished);
    }
  }, [basicData]);

  // form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({ ...p, courseThumbnail: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const handleLearnChange = (i, v) => {
    const arr = [...form.whatYouWillLearn];
    arr[i] = v;
    setForm((p) => ({ ...p, whatYouWillLearn: arr }));
  };
  const addLearnItem = () =>
    setForm((p) => ({ ...p, whatYouWillLearn: [...p.whatYouWillLearn, ""] }));
  const removeLearnItem = (i) => {
    const arr = form.whatYouWillLearn.filter((_, idx) => idx !== i);
    setForm((p) => ({ ...p, whatYouWillLearn: arr.length ? arr : [""] }));
  };
  const handlePriorChange = (i, v) => {
    const arr = [...form.priorRequirements];
    arr[i] = v;
    setForm((p) => ({ ...p, priorRequirements: arr }));
  };
  const addPriorItem = () =>
    setForm((p) => ({
      ...p,
      priorRequirements: [...p.priorRequirements, ""],
    }));
  const removePriorItem = (i) => {
    const arr = form.priorRequirements.filter((_, idx) => idx !== i);
    setForm((p) => ({ ...p, priorRequirements: arr.length ? arr : [""] }));
  };

  const saveChanges = async () => {
    if (
      !form.courseTitle.trim() ||
      !form.subTitle.trim() ||
      !form.description.trim() ||
      !form.category ||
      !form.courseLevel ||
      form.coursePrice === "" ||
      !preview ||
      form.whatYouWillLearn.some((i) => !i.trim()) ||
      form.priorRequirements.some((i) => !i.trim())
    ) {
      toast.error("All fields are required.");
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "whatYouWillLearn") {
        v.forEach((i) => formData.append("whatYouWillLearn", i));
      } else if (k === "priorRequirements") {
        v.forEach((i) => formData.append("priorRequirements", i));
      } else if (v != null && v !== "") {
        formData.append(k, v);
      }
    });
    try {
      await editCourse({ courseId, formData }).unwrap();
      toast.success("Course updated.");
      await refetchBasic();
    } catch (err) {
      toast.error(err?.data?.message || "Update failed.");
    }
  };

  // returns true if ANY lecture lacks both video and quiz
  const hasIncompleteLectures = useCallback((course) => {
    if (!course) return false;
    const all = [
      ...(Array.isArray(course.lectures) ? course.lectures : []),
      ...(Array.isArray(course.modules)
        ? course.modules.flatMap((m) => m.lectures || [])
        : []),
    ];
    return all.some((lec) => {
      const hasVideo = Boolean(lec.videoUrl);
      const hasQuiz =
        Array.isArray(lec.quiz?.questions) && lec.quiz.questions.length > 0;
      return !hasVideo && !hasQuiz;
    });
  }, []);

  const handleTogglePublish = async () => {
    const newQuery = isPublishedLocal ? "false" : "true";
    try {
      // reload detail to be sure
      const { data: fresh } = await refetchDetail();
      const course = fresh || detailCourse;
      //  prevent publishing if there are no lectures at all
      const allLectures = [
        ...(Array.isArray(course.lectures) ? course.lectures : []),
        ...(Array.isArray(course.modules)
          ? course.modules.flatMap((m) => m.lectures || [])
          : []),
      ];
      if (newQuery === "true" && allLectures.length === 0) {
        toast.error("Cannot publish: please add at least one lecture.");
        return;
      }
      if (newQuery === "true" && hasIncompleteLectures(course)) {
        // force-unpublish
        await publishCourse({ courseId, query: "false" }).unwrap();
        toast.error("Some lectures missing content");
        setIsPublishedLocal(false);
        return;
      }

      const res = await publishCourse({ courseId, query: newQuery }).unwrap();
      toast.success(res?.message || "Publish status updated.");
      setIsPublishedLocal((p) => !p);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update publish status.");
    }
  };

  const confirmDeleteHandler = async () => {
    setShowDeleteModal(false);
    try {
      await deleteCourse(courseId).unwrap();
      toast.success("Course deleted.");
      navigate("/instructor/course", { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed.");
    }
  };

  if (loadingBasic) {
    return <LoadingScreen />;
  }
  if (errorBasic) return <p>Failed to load course.</p>;

  return (
    <Card className="p-4 shadow-xl rounded-3xl max-w-8xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-blue-700">
          Course Information
        </CardTitle>
        <CardDescription className="text-gray-500">
          Edit and save your changes below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="courseTitle">Title</Label>
              <Input
                id="courseTitle"
                name="courseTitle"
                value={form.courseTitle}
                onChange={handleChange}
                required
                className="rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="subTitle">Subtitle</Label>
              <Input
                id="subTitle"
                name="subTitle"
                value={form.subTitle}
                onChange={handleChange}
                required
                className="rounded-lg"
              />
            </div>

            <div>
              <Label>Description</Label>
              <RichTextEditor
                input={form}
                setInput={setForm}
                readOnly={false}
              />
            </div>

            {/* WHAT YOU'LL LEARN SECTION */}
            <div>
              <Label>What You'll Learn</Label>
              {form.whatYouWillLearn.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    value={item}
                    onChange={(e) => handleLearnChange(idx, e.target.value)}
                    className="flex-1 rounded-lg"
                    required
                    placeholder={`Learning outcome #${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLearnItem(idx)}
                    className="text-red-500"
                    disabled={form.whatYouWillLearn.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLearnItem}
                className="mt-2 text-blue-600"
              >
                + Add More
              </button>
            </div>

            {/* PRIOR REQUIREMENTS SECTION */}
            <div>
              <Label>Prior Requirements</Label>
              {form.priorRequirements.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    value={item}
                    onChange={(e) => handlePriorChange(idx, e.target.value)}
                    className="flex-1 rounded-lg"
                    required
                    placeholder={`Requirement #${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removePriorItem(idx)}
                    className="text-red-500"
                    disabled={form.priorRequirements.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPriorItem}
                className="mt-2 text-blue-600"
              >
                + Add More
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, category: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
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

              <div>
                <Label>Level</Label>
                <Select
                  value={form.courseLevel}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, courseLevel: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Levels</SelectLabel>
                      {["Beginner", "Medium", "Advance"].map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="coursePrice">Price (INR)</Label>
                <Input
                  id="coursePrice"
                  name="coursePrice"
                  type="number"
                  value={form.coursePrice}
                  onChange={handleChange}
                  required
                  className="rounded-lg"
                  placeholder="Enter price"
                />
              </div>
            </div>

            <div>
              <Label>Thumbnail</Label>
              <Input
                type="file"
                name="courseThumbnail"
                accept="image/*"
                onChange={handleFile}
                required
                className="rounded-lg"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Thumbnail Preview"
                  className="mt-2 w-40 h-40 object-cover rounded-lg border"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate("/instructor/course")}
              className="bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className={`bg-blue-700 text-white py-2 px-6 rounded-lg flex items-center justify-center ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                <>
                  <span className="text-lg font-bold">Saving...</span>
                </>
              ) : (
                "Save"
              )}
            </button>
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={isPublishing}
              className={`bg-green-700 text-white py-2 px-6 rounded-lg flex items-center justify-center ${
                isPublishing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isPublishing ? (
                <>
                  <span className="text-lg font-bold">Publishing...</span>
                </>
              ) : isPublishedLocal ? (
                "Unpublish"
              ) : (
                "Publish"
              )}
            </button>
            <AlertDialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            >
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className={`bg-red-700 text-white py-2 px-6 rounded-lg flex items-center justify-center ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <span className="text-lg font-bold">Removing...</span>
                    </>
                  ) : (
                    "Remove"
                  )}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this course and all
                    associated lectures? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteHandler}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <>Deleting...</> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseTab;
