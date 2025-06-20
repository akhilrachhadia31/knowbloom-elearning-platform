import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginFailed = () => (
  <div className="max-w-md mx-auto text-center py-20">
    <h1 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-white">Login Failed</h1>
    <p className="text-gray-700 dark:text-gray-300 mb-6">
      We couldn't sign you in. Please try again.
    </p>
    <Button asChild>
      <Link to="/login">Back to Login</Link>
    </Button>
  </div>
);

export default LoginFailed;
