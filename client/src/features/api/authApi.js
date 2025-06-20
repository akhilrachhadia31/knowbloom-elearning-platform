// src/features/api/authApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { createCustomBaseQuery } from "./customBaseQuery";
import { userLoggedIn, userLoggedOut } from "../authSlice";

const USER_API = `${import.meta.env.VITE_API_URL}/api/v1/user`;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createCustomBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
    prepareHeaders: (headers) => {
      // allow FormData bodies to set their own Content-Type
      return headers;
    },
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),
    }),
    loginUser: builder.mutation({
      query: (inputData) => ({
        url: "login",
        method: "POST",
        body: inputData,
      }),
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: "logout",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
    }),
    loadUser: builder.query({
      query: () => ({
        url: "my-profile",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data.user }));
        } catch (error) {
          console.error("Load user failed:", error);
        }
      },
    }),
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "update-profile",
        method: "PUT",
        body: formData,
      }),
    }),
    checkPassword: builder.mutation({
      query: (body) => ({
        url: "check-password",
        method: "POST",
        body,
      }),
    }),
    updatePasswordUser: builder.mutation({
      query: (body) => ({
        url: "update-password",
        method: "PUT",
        body,
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "verify-otp", // remove leading slash
        method: "POST",
        body: { email, otp },
      }),
    }),
    verifyEmailChange: builder.mutation({
      query: ({ email, otp }) => ({
        url: "verify-email-change",
        method: "POST",
        body: { email, otp },
      }),
    }),
    forgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: "forgot-password", // remove leading slash
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ email, token, password }) => ({
        url: "reset-password", // remove leading slash
        method: "POST",
        body: { email, token, password },
      }),
    }),
    getUserByName: builder.query({
      query: (username) => ({
        url: `by-username/${username}`,
        method: "GET",
      }),
    }),
    getInstructorById: builder.query({
      query: (id) => `/api/users/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
  useCheckPasswordMutation,
  useUpdatePasswordUserMutation,
  useGetInstructorByIdQuery,
  useVerifyOtpMutation,
  useVerifyEmailChangeMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetUserByNameQuery,
} = authApi;
