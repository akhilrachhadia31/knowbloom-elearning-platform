import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const createCustomBaseQuery = (options) => {
  const baseQuery = fetchBaseQuery(options);
  return async (args, api, extra) => {
    const result = await baseQuery(args, api, extra);
    if (result.error && result.error.status >= 500) {
      window.location.href = "/server-error";
    }
    return result;
  };
};
