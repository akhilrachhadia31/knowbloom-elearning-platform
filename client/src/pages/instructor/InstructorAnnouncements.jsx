// src/pages/instructor/performance/InstructorAnnouncements.jsx
import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  useGetCreatorCourseQuery,
  useGetCourseAnnouncementsQuery,
  useCreateCourseAnnouncementMutation,
  useUpdateCourseAnnouncementMutation,
  useDeleteCourseAnnouncementMutation,
} from "@/features/api/courseApi";
import { Search, ChevronUp, ChevronDown, BellOff } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import LoadingScreen from "@/loadingscreen";

const InstructorAnnouncements = () => {
  // 1) fetch all courses you created
  const { data: creatorRes, isLoading: loadingCourses } =
    useGetCreatorCourseQuery();
  const courses = creatorRes?.courses || [];

  // 2) pick one
  const [courseId, setCourseId] = useState("");
  const {
    data: annsRes,
    isLoading: loadingAnns,
    refetch: refetchAnns,
  } = useGetCourseAnnouncementsQuery(courseId, { skip: !courseId });
  const announcements = annsRes?.announcements || [];

  // local UI state
  const [filterText, setFilterText] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  // mutations
  const [createAnn] = useCreateCourseAnnouncementMutation();
  const [updateAnn] = useUpdateCourseAnnouncementMutation();
  const [deleteAnn] = useDeleteCourseAnnouncementMutation();

  // form state
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);

  // whenever we switch course, clear form/edit state & filters
  useEffect(() => {
    setForm({ title: "", content: "" });
    setEditingId(null);
    setFilterText("");
    setSortAsc(false);
  }, [courseId]);

  // filtered + sorted list
  const visibleAnns = useMemo(() => {
    return announcements
      .filter(
        (a) =>
          a.title.toLowerCase().includes(filterText.toLowerCase()) ||
          a.content.toLowerCase().includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        const da = new Date(a.createdAt),
          db = new Date(b.createdAt);
        return sortAsc ? da - db : db - da;
      });
  }, [announcements, filterText, sortAsc]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    try {
      await deleteAnn({ courseId, announcementId: id }).unwrap();
      toast.success("Announcement deleted");
      refetchAnns();
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) return toast.error("Select a course first");
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.content.trim()) return toast.error("Content is required");

    try {
      if (editingId) {
        await updateAnn({
          courseId,
          announcementId: editingId,
          title: form.title.trim(),
          content: form.content.trim(),
        }).unwrap();
        toast.success("Announcement updated");
      } else {
        await createAnn({
          courseId,
          title: form.title.trim(),
          content: form.content.trim(),
        }).unwrap();
        toast.success("Announcement created");
      }
      setForm({ title: "", content: "" });
      setEditingId(null);
      refetchAnns();
    } catch {
      toast.error(editingId ? "Update failed" : "Creation failed");
    }
  };

  const startEdit = (ann) => {
    setEditingId(ann._id);
    setForm({ title: ann.title, content: ann.content });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "" });
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white dark:bg-gray-900 min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Course Announcements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create, manage, and filter announcements for your courses
        </p>
      </header>

      {/* Course selector */}
      <div className="mb-8">
        <Select value={courseId} onValueChange={setCourseId} className="w-full">
          <SelectTrigger className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 transition">
            <SelectValue placeholder="Select a Course" />
          </SelectTrigger>
          <SelectContent>
            {loadingCourses ? (
              <SelectItem value="__loading" disabled>
              <LoadingScreen/>
              </SelectItem>
            ) : courses.length === 0 ? (
              <SelectItem value="__none" disabled>
                No courses available
              </SelectItem>
            ) : (
              courses.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.courseTitle}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {courseId && (
        <>
          {/* Form */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </h2>
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition shadow-sm focus:outline-none"
                  placeholder="Enter announcement title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition shadow-sm resize-vertical focus:outline-none"
                  rows={6}
                  placeholder="Enter announcement content"
                  value={form.content}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, content: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition shadow"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow focus:outline-none"
                >
                  {editingId ? "Update" : "Post"}
                </button>
              </div>
            </form>
          </section>

          {/* Announcements List */}
          <section className="mt-10 mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Existing Announcements
            </h2>
            {loadingAnns ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Loading announcements...
                </span>
              </div>
            ) : visibleAnns.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-500 dark:text-gray-400">
                <BellOff className="h-12 w-12 mb-4" />
                <p>No announcements found.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {/* Filter & Sort */}
                <div className="flex flex-wrap items-center gap-4 mb-6 mt-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search announcements..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setSortAsc((sa) => !sa)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    {sortAsc ? <ChevronUp /> : <ChevronDown />}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {sortAsc ? "Oldest first" : "Newest first"}
                    </span>
                  </button>
                </div>
                {visibleAnns.map((a) => (
                  <div
                    key={a._id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {a.title}
                        </h3>
                        <time
                          className="text-sm text-gray-500 dark:text-gray-400"
                          dateTime={a.createdAt}
                        >
                          {new Date(a.createdAt).toLocaleDateString()} at{" "}
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </time>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(a)}
                          className="px-3 py-1 text-sm font-medium bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="px-3 py-1 text-sm font-medium bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default InstructorAnnouncements;
