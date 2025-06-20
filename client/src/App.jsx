// src/App.jsx
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import MainLayout from "./layout/MainLayout";
import InstructorLayout from "./layout/instructorLayout";

import Login from "./pages/Login";
import HeroSection from "./pages/student/HeroSection";
import Courses from "./pages/student/Courses";
import MyLearning from "./pages/student/MyLearning";
import PurchaseHistory from "./pages/student/PurchaseHistory";
import CourseDetail from "./pages/student/CourseDetail";
import SearchPage from "./pages/student/SearchPage";
import CourseProgress from "./pages/student/CourseProgress";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";


import UserProfile from "@/components/UserProfile";
import EditProfile from "@/components/EditProfile";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/reset";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import LoginFailed from "./pages/LoginFailed";
import PageNotFound from "./pages/PageNotFound";
import ServerError from "./pages/ServerError";
import Unauthorized from "./pages/Unauthorized";
import Forbidden from "./pages/Forbidden";

import LectureTab from "./pages/instructor/lecture/LectureTab";
import Dashboard from "./pages/instructor/Dashboard";
import CourseTable from "./pages/instructor/course/CourseTable";
import AddCourse from "./pages/instructor/course/AddCourse";
import EditCourse from "./pages/instructor/course/EditCourse";
import CreateModule from "./pages/instructor/module/CreateModule";
import EditModule from "./pages/instructor/module/EditModule";
import QuizEditor from "./pages/instructor/quiz/QuizEditor";
import Reviews from "./pages/instructor/Reviews";
import CourseInsights from "./pages/instructor/CourseInsights";
import InstructorAnnouncements from "./pages/instructor/InstructorAnnouncements";

import {
  InstructorRoute,
  GuestOnlyRoute,
  ProtectedRoute,
} from "./components/ProtectedRoutes";
import { ThemeProvider } from "./components/ThemeProvider";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <PageNotFound />,
    children: [
      {
        index: true,
        element: (
          <>
            <HeroSection />
            <Courses />
          </>
        ),
      },
      {
        path: "login",
        element: (
          <GuestOnlyRoute>
            <Login />
          </GuestOnlyRoute>
        ),
      },
      { path: "login/failed", element: <LoginFailed /> },
      {
        path: "my-learning",
        element: (
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        ),
      },
      {
        path: "purchase-history",
        element: (
          <ProtectedRoute>
            <PurchaseHistory />
          </ProtectedRoute>
        ),
      },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: ":username", element: <UserProfile /> },
      { path: ":username/edit-profile", element: <EditProfile /> },
      { path: "course-detail/:courseId", element: <CourseDetail /> },
      { path: "search", element: <SearchPage /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "privacy-policy", element: <PrivacyPolicy /> },
      { path: "terms", element: <TermsOfService /> },
      { path: "refund-policy", element: <RefundPolicy /> },
      {
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
              <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "/forbidden", element: <Forbidden /> },
  {
    path: "/instructor",
    element: (
      <InstructorRoute>
        <InstructorLayout />
      </InstructorRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "course", element: <CourseTable /> },
      { path: "course/create", element: <AddCourse /> },
      { path: "course/:courseId", element: <EditCourse /> },
      { path: "course/:courseId/module", element: <CreateModule /> },
      { path: "course/:courseId/module/:moduleId", element: <EditModule /> },
      {
        path: "course/:courseId/module/:moduleId/lecture/:lectureId",
        element: <LectureTab />,
      },
      {
        path: "course/:courseId/module/:moduleId/lecture/:lectureId/quiz",
        element: <QuizEditor />,
      },
      { path: "performance/reviews", element: <Reviews /> },
      { path: "performance/insights", element: <CourseInsights /> },
      {
        path: "performance/announcements",
        element: <InstructorAnnouncements />,
      },
    ],
  },
  {
    path: "/server-error",
    element: <ServerError />,
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={appRouter} />
    </ThemeProvider>
  );
}

export default App;
