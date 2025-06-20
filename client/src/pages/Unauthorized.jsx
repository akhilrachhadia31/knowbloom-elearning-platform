import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Unauthorized = () => (
  <div className="max-w-md mx-auto text-center py-20">
    <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">
      Unauthorized
    </h1>
    <p className="text-gray-700 dark:text-gray-300 mb-6">
      You need to be logged in to access this page.
    </p>
    <Button asChild>
      <Link to="/login">Go to Login</Link>
    </Button>
  </div>
);

export default Unauthorized;
