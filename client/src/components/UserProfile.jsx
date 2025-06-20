// src/components/UserProfile.jsx

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useLoadUserQuery,
  useGetUserByNameQuery,
} from "@/features/api/authApi";
import {
  useGetCoursesByCreatorQuery,
  useGetMyLearningCoursesQuery,
} from "@/features/api/courseApi";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Course from "@/pages/student/Course"; // ← correct import!
import {
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  User,
  Github,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import dayjs from "dayjs";
import LoadingScreen from "@/loadingscreen";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  // 1) me
  const { data: meData, isLoading: meLoading } = useLoadUserQuery();
  const meUser = meData?.user;

  // 2) profile
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetUserByNameQuery(username);
  const profileUser = profileData?.user;

  // 3) instructor’s courses
  const { data: coursesData, isLoading: coursesLoading } =
    useGetCoursesByCreatorQuery(username);

  // 4) my purchases (for redirect logic)
  const { data: myLearningData, isLoading: myLearningLoading } =
    useGetMyLearningCoursesQuery();
  const myLearningCourses = myLearningData?.courses || [];

  // 5) wait
  if (meLoading || profileLoading || coursesLoading || myLearningLoading) {
    return (
      <div
        className="
        flex items-center justify-center min-h-screen
        bg-gradient-to-br from-cyan-50 to-indigo-100 
        dark:from-gray-900 dark:to-gray-800
        text-gray-800 dark:text-gray-200
      "
      >
        <LoadingScreen />
      </div>
    );
  }

  // 6) 404
  if (profileError || !profileUser) {
    return (
      <div
        className="
        flex items-center justify-center min-h-screen
        bg-gradient-to-br from-cyan-50 to-indigo-100 
        dark:from-gray-900 dark:to-gray-800
        text-gray-800 dark:text-gray-200
      "
      >
        <p className="text-xl font-semibold">Page not found.</p>
      </div>
    );
  }

  // 7) Joined
  const joined = profileUser.joinedAt
    ? dayjs(profileUser.joinedAt).format("MMM YYYY")
    : null;

  // 8) courses array
  const raw = coursesData?.courses ?? coursesData ?? [];
  const coursesCreated = Array.isArray(raw) ? raw : [];
  const isInstructor = coursesCreated.length > 0;

  return (
    <>
      {/* — PROFILE CARD — */}
      <Card
        className="mt-7 w-full p-8 shadow-2xl bg-white/95 
                       dark:bg-gray-900/95 rounded-2xl border-0 
                       flex flex-col items-center"
      >
        {/* Avatar */}
        <div className="mb-4">
          <Avatar
            className="w-36 h-36 ring-cyan-500 dark:ring-cyan-400 
                             shadow-lg bg-white"
          >
            {profileUser.photoUrl ? (
              <AvatarImage
                src={profileUser.photoUrl}
                alt={profileUser.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <AvatarFallback className="text-4xl">
                {profileUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Name */}
        <h1
          className="text-5xl font-extrabold text-cyan-700 
                       dark:text-cyan-300 mb-1"
        >
          {profileUser.name}
        </h1>

        {/* Role */}
        <p
          className="text-lg text-gray-500 dark:text-gray-400 
                      font-medium mb-2"
        >
          Role: {isInstructor ? "Instructor" : "Student"}
        </p>

        {/* Email */}
        <p
          className="flex items-center gap-2 text-gray-700 
                      dark:text-gray-200 mb-2"
        >
          <User size={18} /> {profileUser.email}
        </p>

        {/* Location / Company / Joined */}
        <div
          className="flex flex-wrap gap-4 mb-2 justify-center 
                        text-gray-500 dark:text-gray-400"
        >
          {profileUser.location && (
            <span className="flex items-center gap-1">
              <MapPin size={16} /> {profileUser.location}
            </span>
          )}
          {profileUser.company && (
            <span className="flex items-center gap-1">
              <Briefcase size={16} /> {profileUser.company}
            </span>
          )}
          {joined && (
            <span className="flex items-center gap-1">
              <Calendar size={16} /> Joined {joined}
            </span>
          )}
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap gap-5 mt-2 mb-4 justify-center">
          {profileUser.github && (
            <a
              href={profileUser.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-700 
                         dark:text-gray-200 hover:text-black 
                         dark:hover:text-white transition"
            >
              <Github size={18} /> GitHub
            </a>
          )}
          {profileUser.linkedin && (
            <a
              href={profileUser.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 
                         dark:text-blue-400 hover:underline"
            >
              <Linkedin size={18} /> LinkedIn
            </a>
          )}
          {profileUser.twitter && (
            <a
              href={profileUser.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sky-600 
                         dark:text-sky-400 hover:underline"
            >
              <Twitter size={18} /> Twitter
            </a>
          )}
          {profileUser.instagram && (
            <a
              href={profileUser.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-pink-600 
                         dark:text-pink-400 hover:underline"
            >
              <Instagram size={18} /> Instagram
            </a>
          )}
          {profileUser.website && (
            <a
              href={profileUser.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-700 
                         dark:text-green-400 hover:underline"
            >
              <Globe size={18} /> Website
            </a>
          )}
        </div>

        {/* Biography */}
        {profileUser.biography && (
          <>
            <Separator className="my-4" />
            <p
              className="text-lg leading-relaxed text-gray-700 
                          dark:text-gray-200 italic text-center max-w-2xl"
            >
              {profileUser.biography}
            </p>
          </>
        )}

        {/* Skills */}
        {profileUser.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {profileUser.skills.map((skill) => (
              <span
                key={skill}
                className="bg-cyan-100 dark:bg-cyan-800 text-cyan-800 
                           dark:text-cyan-200 px-3 py-1 rounded-full 
                           text-sm font-semibold shadow"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Edit Profile button */}

        {meUser?.name === profileUser.name && (
          <Button
            onClick={() => navigate(`/${username}/edit-profile`)}
            className="mt-8 bg-gradient-to-r from-cyan-600 to-indigo-600 
                       text-white hover:from-cyan-700 hover:to-indigo-700 
                       shadow-lg px-8 py-3 text-lg font-bold rounded-full 
                       transition"
          >
            Edit Profile
          </Button>
        )}
      </Card>
      {/* — COURSES GRID — */}
      {isInstructor && (
        <div className="mb-12 mt-12 px-4 md:px-8 lg:px-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Courses by {profileUser.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {coursesCreated.map((course) => {
              const id = course._id || course.id;
              return (
                <Course key={id} courseId={id} showPurchaseButton={false} />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
