import React from "react";

const ServerError = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
    <p className="text-gray-700 dark:text-gray-300">
      An unexpected server error occurred. Please try again later.
    </p>
  </div>
);

export default ServerError;
