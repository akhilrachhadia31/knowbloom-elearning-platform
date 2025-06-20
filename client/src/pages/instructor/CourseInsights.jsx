import React, { useState, useMemo } from "react";
import { useGetCreatorCourseQuery } from "../../features/api/courseApi";
import { useGetCourseProgressQuery } from "../../features/api/courseProgressApi";
import {
  useGetCourseStudentsQuery,
  useSendCourseInfoMutation,
} from "../../features/api/courseApi";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingScreen from "@/loadingscreen";

const StatCard = ({ title, value }) => (
  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow text-center transition-colors">
    <div className="text-3xl font-bold text-gray-800 dark:text-white">
      {value}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
  </div>
);

const ProgressBar = ({ percent }) => (
  <div className="w-full bg-gray-300 dark:bg-gray-700 rounded h-2 overflow-hidden">
    <div
      className="bg-green-500 h-2"
      style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      title={`${percent}%`}
    />
  </div>
);

export default function CourseInsights() {
  // fetch courses you created
  const { data: coursesData, isLoading: loadingCourses } =
    useGetCreatorCourseQuery();
  const courses = coursesData?.courses || [];

  // start with nothing, then once courses arrive pick the first
  const [selectedId, setSelectedId] = useState("");

  // as soon as courses load, make the first one our selection
  useEffect(() => {
    if (!selectedId && courses.length) {
      setSelectedId(courses[0]._id);
    }
  }, [courses, selectedId]);

  // fetch course structure to count lectures
  const { data: progResponse, isLoading: loadingProg } =
    useGetCourseProgressQuery(selectedId, {
      skip: !selectedId,
      refetchOnMountOrArgChange: true,
    });
  const modules = progResponse?.data?.courseDetails?.modules || [];
  const totalLectures = modules.reduce(
    (sum, m) => sum + (m.lectures?.length || 0),
    0
  );

  // fetch enrolled students
  const { data: studentsData, isLoading: loadingStudents } =
    useGetCourseStudentsQuery(selectedId, {
      skip: !selectedId,
      refetchOnMountOrArgChange: true,
      pollingInterval: 30_000, // re-fetch every 30s so new enrollments pop in
    });
  const students = studentsData?.students || [];

  const isLoading = loadingCourses || loadingProg || loadingStudents;
  const totalEnrolled = students.length;

  // clamp each student's progress to 100%
  const studentPercents = students.map((s) => {
    const raw =
      totalLectures > 0 ? (s.completedLectures / totalLectures) * 100 : 0;
    return Math.min(Math.max(Math.round(raw), 0), 100);
  });

  // average progress across students
  const avgProgress =
    totalEnrolled > 0
      ? Math.round(
          studentPercents.reduce((acc, p) => acc + p, 0) / totalEnrolled
        )
      : 0;

  // count those who've truly completed (>= totalLectures)
  const completedCount = students.filter(
    (s) => s.completedLectures >= totalLectures && totalLectures > 0
  ).length;

  // active in last 7 days
  const activeLast7d = students.filter((s) => {
    const last = new Date(s.lastActive).getTime();
    return Date.now() - last <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  // drop-off = completed between 1 and 20% only
  const dropOffRate =
    totalEnrolled > 0 && totalLectures > 0
      ? Math.round(
          (students.filter((s) => {
            const pct = (s.completedLectures / totalLectures) * 100;
            return pct > 0 && pct < 20;
          }).length /
            totalEnrolled) *
            100
        )
      : 0;

  // email state
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [sendEmails, { isLoading: isEmailing }] = useSendCourseInfoMutation();

  const filtered = useMemo(
    () =>
      students.filter((s) =>
        (s.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  const handleSendEmails = async () => {
    if (!selectedStudents.length) return;
    try {
      await sendEmails({
        courseId: selectedId,
        studentIds: selectedStudents,
        infoHtml: message,
      }).unwrap();
      setSelectedStudents([]);
      setMessage("");
      toast.success("Emails sent successfully");
    } catch {
      toast.error("Failed to send emails");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Course Insights
      </h1>

      {/* Course Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="font-medium text-gray-700 dark:text-gray-300">
          Select course:
        </label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[250px]">
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
      </div>

      {isLoading ? (
         <LoadingScreen />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <StatCard title="Enrolled" value={totalEnrolled} />
            <StatCard title="Avg Progress (%)" value={`${avgProgress}%`} />
            <StatCard title="Completed 100%" value={completedCount} />
            <StatCard title="Active (7d)" value={activeLast7d} />
            <StatCard title="Drop-off Rate" value={`${dropOffRate}%`} />
          </div>

          {/* Email Section */}
          <div className="grid gap-4 md:grid-cols-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Email message"
              className="border border-gray-300 dark:border-gray-600 rounded p-2 w-full h-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <div className="flex items-end">
              <Button
                onClick={handleSendEmails}
                disabled={isEmailing || selectedStudents.length === 0}
                className="w-full sm:w-auto px-6 py-2"
              >
                {isEmailing
                  ? "Sending…"
                  : `Email ${selectedStudents.length} student${
                      selectedStudents.length > 1 ? "s" : ""
                    }`}
              </Button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />

            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
                No students found.
              </p>
            ) : (
              <table className="w-full mt-6 text-sm text-left border dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <th className="p-3">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedStudents(
                            e.target.checked ? filtered.map((s) => s._id) : []
                          )
                        }
                        checked={
                          filtered.length > 0 &&
                          selectedStudents.length === filtered.length
                        }
                      />
                    </th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Completed</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Enrolled On</th>
                    <th className="p-3">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => {
                    const pct = studentPercents[students.indexOf(s)] || 0;
                    return (
                      <tr
                        key={s._id}
                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-gray-900 dark:even:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s._id)}
                            onChange={(e) =>
                              setSelectedStudents((prev) =>
                                e.target.checked
                                  ? [...prev, s._id]
                                  : prev.filter((id) => id !== s._id)
                              )
                            }
                          />
                        </td>
                        <td className="p-3">{s.name}</td>
                        <td className="p-3">{s.email}</td>
                        <td className="p-3 w-32">
                          <div className="flex flex-col gap-1">
                            <span>{pct}%</span>
                            <ProgressBar percent={pct} />
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              pct === 100
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : pct === 0
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            }`}
                          >
                            {pct === 100
                              ? "Completed"
                              : pct === 0
                              ? "Inactive"
                              : "In Progress"}
                          </span>
                        </td>
                        <td className="p-3">
                          {Math.min(s.completedLectures, totalLectures)}
                        </td>
                        <td className="p-3">{totalLectures}</td>
                        <td className="p-3">
                          {new Date(s.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              Date.now() - new Date(s.lastActive).getTime() <=
                              2 * 24 * 60 * 60 * 1000
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {new Date(s.lastActive).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
