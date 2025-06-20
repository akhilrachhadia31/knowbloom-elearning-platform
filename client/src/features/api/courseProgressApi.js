// src/features/api/courseProgressApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { createCustomBaseQuery } from "./customBaseQuery";

const COURSE_PROGRESS_API = `${import.meta.env.VITE_API_URL}/api/v1/progress`;


export const courseProgressApi = createApi({
  reducerPath: "courseProgressApi",
  baseQuery: createCustomBaseQuery({
    baseUrl: COURSE_PROGRESS_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getCourseProgress: builder.query({
      query: (courseId) => `/${courseId}`,
    }),
    updateLectureProgress: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}/view`,
        method: "POST",
      }),
    }),
    unviewLectureProgress: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: `/${courseId}/lecture/${lectureId}/unview`,
        method: "POST",
      }),
    }),
    completeCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/complete`,
        method: "POST",
      }),
    }),
    inCompleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/incomplete`,
        method: "POST",
      }),
    }),
    removeCourseStudent: builder.mutation({
      query: ({ courseId, studentId }) => ({
        url: `/${courseId}/students/${studentId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetCourseProgressQuery,
  useUpdateLectureProgressMutation,
  useUnviewLectureProgressMutation,
  useCompleteCourseMutation,
  useInCompleteCourseMutation,
  useRemoveCourseStudentMutation,
} = courseProgressApi;
