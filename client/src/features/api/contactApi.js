import { createApi } from "@reduxjs/toolkit/query/react";
import { createCustomBaseQuery } from "./customBaseQuery";

const CONTACT_API = `https://knowbloom1.onrender.com/api/v1/contact`;

export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: createCustomBaseQuery({
    baseUrl: CONTACT_API,
    credentials: "include",
    prepareHeaders: (headers) => {
      return headers;
    },
  }),
  endpoints: (builder) => ({
    sendContactMessage: builder.mutation({
      query: ({ name, email, message }) => ({
        url: "contact",
        method: "POST",
        body: { name, email, message },
      }),
    }),
  }),
  overrideExisting: false,
});

// auto-generated hook
export const { useSendContactMessageMutation } = contactApi;
