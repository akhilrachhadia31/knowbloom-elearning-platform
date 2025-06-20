// src/components/Navbar.jsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import DarkMode from "@/DarkMode";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useSelector, useDispatch } from "react-redux";
import {
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
  authApi,
} from "@/features/api/authApi";
import { toast } from "react-hot-toast";
import SearchBar from "@/pages/SearchBar";
import Logo from "@/components/Logo"; // ← import your logo

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useLoadUserQuery();
  const [logoutUser] = useLogoutUserMutation();
  const [updateProfile] = useUpdateUserMutation();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || data?.user;
  const dispatch = useDispatch();

  useEffect(() => {
    if (user && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(authApi.util.resetApiState());
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed");
    }
  };

  const toggleRole = async () => {
    if (!user) return;
    const newRole = user.role === "student" ? "instructor" : "student";
    try {
      await updateProfile({ role: newRole }).unwrap();
      dispatch(authApi.util.resetApiState());
      toast.success(`Switched to ${newRole}`);
    } catch {
      toast.error("Could not switch role");
    }
  };

  const name = user?.name || "";
  const photoUrl = user?.photoUrl || "";
  const email = user?.email || "";

  return (
    <nav className="h-16 bg-white dark:bg-gray-900 border-b dark:border-b-gray-900 border-b-gray-200 fixed top-0 left-0 right-0 z-50">
      {/* Desktop */}
      <div className="max-w-7xl mx-auto hidden md:flex justify-between items-center h-full px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <Logo size="md" /> {/* Use md or lg here for best fit */}
          </Link>
        </div>

        {/* Search */}
        {location.pathname === "/" && <SearchBar />}

        {/* Right */}
        <div className="flex items-center gap-4 md:gap-6">
          {isLoading ? (
            <div className="animate-pulse w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          ) : isError || !user ? (
            location.pathname !== "/login" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-gray-800 dark:text-gray-200"
              >
                Login
              </Button>
            )
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-2 focus:outline-none">
                <Avatar className="w-10 h-10 transition-transform duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-cyan-500 rounded-full">
                  <AvatarImage src={photoUrl} alt={name} />
                  <AvatarFallback>
                    {name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-cyan-600 transition-colors">
                  {name}
                </span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                <div className="px-4 py-3 flex items-center gap-3 border-b dark:border-gray-700">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback>
                      {name.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {name}
                    </p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold capitalize">
                      {user.role}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {email}
                    </p>
                  </div>
                </div>
                {/* <div className="py-2">
                  {user.role === "student" && (
                    <Link to="/my-learning">
                      <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        My Learning
                      </button>
                    </Link>
                  )}
                  <Link to={`/${name}`}>
                    <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      Profile
                    </button>
                  </Link>
                  {user.role === "instructor" && (
                    <Link to="/instructor/course">
                      <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Dashboard
                      </button>
                    </Link>
                  )}{" "}
                  {user.role === "student" && (
                    <Link to="/purchase-history">
                      <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Purchase History
                      </button>
                    </Link>
                  )}
                  <Link to="/settings">
                    <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      Settings
                    </button>
                  </Link>
                  {user.role === "student" && (
                    <Link to="/refer">
                      <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Refer a Friend
                      </button>
                    </Link>
                  )}
                  <Link to="/notifications">
                    <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      Notifications
                    </button>
                  </Link>
                  {location.pathname === "/" && (
                    <button
                      onClick={toggleRole}
                      className="w-full text-left px-4 py-2 text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Switch to{" "}
                      {user.role === "student" ? "Instructor" : "Student"}
                    </button>
                  )}
                  <hr className="border-gray-200 dark:border-gray-700 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Log out
                  </button>
                </div> */}
                {/* Navigation Items */}
                <div className="py-2">
                  {user.role === "student" && (
                    <Link to="/my-learning">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 flex items-center gap-2">
                        My Learning
                      </button>
                    </Link>
                  )}
                  <Link to={`/${name}`}>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                      Profile
                    </button>
                  </Link>
                  {user.role === "instructor" && (
                    <Link to="/instructor/course">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                        Dashboard
                      </button>
                    </Link>
                  )}
                  {user.role === "student" && (
                    <Link to="/purchase-history">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200">
                        Purchase History
                      </button>
                    </Link>
                  )}

                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={toggleRole}
                      className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-200 font-medium"
                    >
                      Switch to{" "}
                      {user.role === "student" ? "Instructor" : "Student"}
                    </button>
                  </>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 font-medium"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          )}
          <DarkMode />
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between px-4 sm:px-6 h-full">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <Logo size="sm" /> {/* Use small size for mobile */}
          </Link>
        </div>
        <MobileDeviceNavbar />
      </div>
    </nav>
  );
};

const MobileDeviceNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useLoadUserQuery();
  const [logoutUser] = useLogoutUserMutation();
  const [updateProfile] = useUpdateUserMutation();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || data?.user;
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(authApi.util.resetApiState());
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed");
    }
  };

  const toggleRole = async () => {
    if (!user) return;
    const newRole = user.role === "student" ? "instructor" : "student";
    try {
      await updateProfile({ role: newRole }).unwrap();
      dispatch(authApi.util.resetApiState());
      toast.success(`Switched to ${newRole}`);
      setMenuOpen(false);
    } catch {
      toast.error("Could not switch role");
    }
  };

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
          variant="outline"
        >
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>
            <Logo size="md" />
          </SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="animate-pulse w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          ) : isError || !user ? (
            location.pathname !== "/login" && (
              <Button
                variant="outline"
                className="w-full text-gray-800 dark:text-gray-200"
                onClick={() => handleNavigation("/login")}
              >
                Login
              </Button>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-cyan-500">
                  <AvatarImage src={user.photoUrl} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              {user.role !== "student" && (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/my-learning")}
                >
                  My Learning
                </Button>
              )}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => handleNavigation(`/${user.name}`)}
              >
                Profile
              </Button>
              {user.role === "instructor" && (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigation("/instructor/course")}
                >
                  Your Courses
                </Button>
              )}

              <Button
                variant="ghost"
                className="justify-start text-indigo-600"
                onClick={toggleRole}
              >
                Switch to {user.role === "student" ? "Instructor" : "Student"}
              </Button>

              <Button
                variant="ghost"
                className="justify-start text-red-600"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
          )}

          <div className="mt-4">
            <Input
              placeholder="Search courses..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = e.target.value.trim();
                  if (q)
                    handleNavigation(`/search?query=${encodeURIComponent(q)}`);
                }
              }}
              className="text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700"
            />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="w-full text-gray-800 dark:text-gray-200"
            >
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default Navbar;
