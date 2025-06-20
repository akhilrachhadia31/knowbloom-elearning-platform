import { createApi } from "@reduxjs/toolkit/query/react";
import { createCustomBaseQuery } from "./customBaseQuery";

const COURSE_API = `${import.meta.env.VITE_API_URL}/api/v1/course`;


export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes: [
    "Refetch_Creator_Course",
    "Refetch_Module",
    "Refetch_Lecture",
    "Course",
    "Students",
    "Announcement",
  ],
  baseQuery: createCustomBaseQuery({
    baseUrl: COURSE_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    // --- COURSE ENDPOINTS ---

    createCourse: builder.mutation({
      query: ({ courseTitle, category }) => ({
        url: "",
        method: "POST",
        body: { courseTitle, category },
        formData: true,
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),

    getSearchCourse: builder.query({
      query: ({
        searchQuery = "",
        categories = [],
        sortByPrice = "",
        level = "",
        priceRange = "",
      }) => {
        let queryString = `/search?query=${encodeURIComponent(searchQuery)}`;

        if (categories.length) {
          queryString += `&categories=${categories
            .map(encodeURIComponent)
            .join(",")}`;
        }
        if (level) {
          queryString += `&level=${encodeURIComponent(level)}`;
        }
        if (priceRange) {
          queryString += `&priceRange=${encodeURIComponent(priceRange)}`;
        }
        if (sortByPrice) {
          queryString += `&sortByPrice=${sortByPrice}`;
        }

        return { url: queryString, method: "GET" };
      },
    }),

    getPublishedCourse: builder.query({
      query: () => ({ url: "/published-courses", method: "GET" }),
    }),

    getCreatorCourse: builder.query({
      query: () => ({ url: "", method: "GET" }),
      providesTags: ["Refetch_Creator_Course"],
    }),
    getCourseStudents: builder.query({
      query: (courseId) => `/${courseId}/students`,
      providesTags: (result, error, courseId) => [
        { type: "Students", id: courseId },
      ],
    }),

    editCourse: builder.mutation({
      query: ({ formData, courseId }) => ({
        url: `/${courseId}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),

    getMyLearningCourses: builder.query({
      query: () => ({
        url: "/my-learning",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [{ type: "Course", id: "MY_LEARNING" }]
          : [{ type: "Course", id: "MY_LEARNING" }],
    }),

    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
      ],
    }),

    deleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, courseId) => [
        "Refetch_Creator_Course",
        "Refetch_Module",
        "Refetch_Lecture",
        { type: "Course", id: courseId },
        { type: "Course", id: "MY_LEARNING" },
      ],
    }),

    // --- MODULE ENDPOINTS ---
    createModule: builder.mutation({
      query: ({ moduleTitle, courseId }) => ({
        url: `/${courseId}/module`,
        method: "POST",
        body: { moduleTitle },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    getCourseModules: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/module`,
        method: "GET",
      }),
      providesTags: ["Refetch_Module"],
    }),

    getModuleById: builder.query({
      query: (moduleId) => ({
        url: `/module/${moduleId}`,
        method: "GET",
      }),
    }),

    editModule: builder.mutation({
      query: ({ moduleId, moduleTitle }) => ({
        url: `/module/${moduleId}`,
        method: "PUT",
        body: { moduleTitle },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    removeModule: builder.mutation({
      query: ({ courseId, moduleId }) => ({
        // include courseId in the path
        url: `/${courseId}/module/${moduleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course", id: "LIST" }],
    }),

    // --- LECTURE ENDPOINTS (under module) ---
    createLecture: builder.mutation({
      query: ({ lectureTitle, moduleId }) => ({
        url: `/module/${moduleId}/lecture`,
        method: "POST",
        body: { lectureTitle },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    getModuleLectures: builder.query({
      query: (moduleId) => ({
        url: `/module/${moduleId}/lecture`,
        method: "GET",
      }),
      providesTags: ["Refetch_Module"],
    }),

    getLectureById: builder.query({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "GET",
      }),
    }),

    editModuleLecture: builder.mutation({
      query: ({ lectureTitle, videoInfo, preview, moduleId, lectureId }) => ({
        url: `/module/${moduleId}/lecture/${lectureId}`,
        method: "PUT",
        body: { lectureTitle, videoInfo, preview },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    removeLecture: builder.mutation({
      query: ({ moduleId, lectureId }) => ({
        url: `/module/${moduleId}/lecture/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    // ─── FIXED: Always “provide” a Refetch_Lecture tag here ───
    getLectureVideoInfo: builder.query({
      query: ({ moduleId, lectureId }) => ({
        url: `/module/${moduleId}/lecture/${lectureId}/video-info`,
        method: "GET",
      }),
      providesTags: (result, error, { lectureId }) => [
        { type: "Refetch_Lecture", id: lectureId },
      ],
    }),

    publishCourse: builder.mutation({
      query: ({ courseId, query }) => ({
        url: `/${courseId}?publish=${query}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Course", id: courseId },
        "Refetch_Creator_Course",
      ],
    }),

    getCourseDetailLegacy: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/detail`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
      ],
    }),

    moveModuleUp: builder.mutation({
      query: ({ moduleId }) => ({
        url: `/module/move-up`,
        method: "PATCH",
        body: { moduleId },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    moveModuleDown: builder.mutation({
      query: ({ moduleId }) => ({
        url: `/module/move-down`,
        method: "PATCH",
        body: { moduleId },
      }),
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),

    toggleLecturePreview: builder.mutation({
      query: ({ lectureId, preview, moduleId }) => ({
        url: `/module/${moduleId}/lecture/${lectureId}/toggle-preview`,
        method: "PATCH",
        body: { lectureId, preview },
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),

    bulkTogglePreview: builder.mutation({
      query: ({ moduleId, makeFree }) => ({
        url: `/module/${moduleId}/lecture/bulk-preview`,
        method: "PATCH",
        body: { moduleId, makeFree },
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),

    getCoursesByCreator: builder.query({
      query: (username) => ({
        url: `creator/${username}`,
        method: "GET",
      }),
    }),
    removeLectureVideo: builder.mutation({
      query: ({ moduleId, lectureId }) => ({
        url: `/module/${moduleId}/lecture/${lectureId}/remove-video`,
        method: "DELETE",
      }),
      // Invalidate module/lecture so UI updates
      invalidatesTags: ["Refetch_Module", { type: "Course" }],
    }),
    getLectureQuiz: builder.query({
      query: ({ courseId, moduleId, lectureId }) =>
        `/course/${courseId}/module/${moduleId}/lecture/${lectureId}/quiz`,
      providesTags: (result, error, { lectureId }) => [
        { type: "LectureQuiz", id: lectureId },
      ],
      transformResponse: (response) => response.quiz,
    }),

    setLectureQuiz: builder.mutation({
      query: ({ courseId, moduleId, lectureId, title, questions }) => ({
        url: `/course/${courseId}/module/${moduleId}/lecture/${lectureId}/quiz`,
        method: "PUT",
        body: { title, questions },
      }),
      invalidatesTags: (result, error, { lectureId }) => [
        { type: "LectureQuiz", id: lectureId },
        { type: "Refetch_Lecture", id: lectureId },
      ],
    }),

    removeLectureQuiz: builder.mutation({
      query: ({ courseId, moduleId, lectureId }) => ({
        url: `/course/${courseId}/module/${moduleId}/lecture/${lectureId}/quiz`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { lectureId }) => [
        { type: "LectureQuiz", id: lectureId },
        { type: "Refetch_Lecture", id: lectureId },
      ],
    }),

    getCourseDetail: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/detail`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
      ],
      // we only need the `course` field
      transformResponse: (response) => response.course,
    }),
    sendCourseInfo: builder.mutation({
      query: ({ courseId, studentIds, infoHtml }) => ({
        url: `/${courseId}/email`,
        method: "POST",
        body: { studentIds, infoHtml },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Students", id: courseId },
      ],
    }),
    getCourseReviews: builder.query({
      query: (courseId) => `/${courseId}/reviews`,
      providesTags: (result, error, courseId) => [
        { type: "Reviews", id: courseId },
      ],
    }),
    createReview: builder.mutation({
      query: ({ courseId, rating, comment }) => ({
        url: `/${courseId}/review`,
        method: "POST",
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Reviews", id: courseId },
      ],
    }),
    updateReview: builder.mutation({
      query: ({ courseId, rating, comment }) => ({
        url: `/${courseId}/review`,
        method: "PUT",
        body: { rating, comment },
      }),
      invalidatesTags: (res, err, { courseId }) => [
        { type: "Reviews", id: courseId },
      ],
    }),
    // ── Announcements ──
    getCourseAnnouncements: builder.query({
      query: (courseId) => `/${courseId}/announcements`,
      providesTags: (result, error, courseId) => [
        { type: "Announcement", id: courseId },
      ],
    }),
    createCourseAnnouncement: builder.mutation({
      query: ({ courseId, title, content }) => ({
        url: `/${courseId}/announcement`,
        method: "POST",
        body: { title, content },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Announcement", id: courseId },
      ],
    }),
    updateCourseAnnouncement: builder.mutation({
      query: ({ courseId, announcementId, title, content }) => ({
        url: `/${courseId}/announcement/${announcementId}`,
        method: "PUT",
        body: { title, content },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Announcement", id: courseId },
      ],
    }),
    deleteCourseAnnouncement: builder.mutation({
      query: ({ courseId, announcementId }) => ({
        url: `/${courseId}/announcement/${announcementId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Announcement", id: courseId },
      ],
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useGetSearchCourseQuery,
  useGetPublishedCourseQuery,
  useGetCreatorCourseQuery,
  useEditCourseMutation,
  useGetMyLearningCoursesQuery,
  useGetCourseByIdQuery,
  useDeleteCourseMutation,
  useGetCourseDetailQuery,
  useGetCoursesByCreatorQuery,
  useGetCourseStudentsQuery,
  useSendCourseInfoMutation,
  useGetCourseDetailLegacyQuery,
  useGetCourseReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useGetCourseAnnouncementsQuery,
  useCreateCourseAnnouncementMutation,
  useUpdateCourseAnnouncementMutation,
  useDeleteCourseAnnouncementMutation, 
  // Module hooks
  useCreateModuleMutation,
  useGetCourseModulesQuery,
  useGetModuleByIdQuery,
  useEditModuleMutation,
  useRemoveModuleMutation,
  // Lecture hooks
  useCreateLectureMutation,
  useGetModuleLecturesQuery,
  useGetLectureByIdQuery,
  useEditModuleLectureMutation,
  useRemoveLectureMutation,
  useGetLectureVideoInfoQuery,
  usePublishCourseMutation,
  useMoveModuleUpMutation,
  useMoveModuleDownMutation,
  useToggleLecturePreviewMutation,
  useBulkTogglePreviewMutation,
  useRemoveLectureVideoMutation,

  //quiz
  useGetLectureQuizQuery,
  useSetLectureQuizMutation,
  useRemoveLectureQuizMutation,
} = courseApi;
