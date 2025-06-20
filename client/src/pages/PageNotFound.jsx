import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PageNotFound = () => (
  <div className="max-w-md mx-auto text-center py-20">
    <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">
      Page Not Found
    </h1>
    <p className="text-gray-700 dark:text-gray-300 mb-6">
      The page you're looking for doesn't exist.
    </p>
    <Button asChild>
      <Link to="/">Go Home</Link>
    </Button>
  </div>
);

export default PageNotFound;
