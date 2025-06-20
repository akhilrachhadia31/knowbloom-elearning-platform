// src/routes/RouteGuards.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Unauthorized from "../pages/Unauthorized";
import Forbidden from "../pages/Forbidden";

// 🔐 Protect routes for authenticated users
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((store) => store.auth);

  if (!isAuthenticated) {
    return <Unauthorized />;
  }

  return children;
};

// 🔓 Allow only unauthenticated users (e.g. Login, Signup)
export const AuthenticatedUser = ({ children }) => {
  const { isAuthenticated } = useSelector((store) => store.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 🔥 Alias for clarity
export const GuestOnlyRoute = AuthenticatedUser;

// 🔐 Instructor routes with role check
export const InstructorRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((store) => store.auth);

  if (!isAuthenticated) {
    return <Unauthorized />;
  }

  if (user?.role !== "instructor") {
    return <Forbidden />;
  }

  return children;
};
