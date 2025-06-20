import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResetPasswordMutation } from "../features/api/authApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    if (!email || !token) {
      setError("Invalid or expired reset link. Please request a new one.");
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [email, token, navigate]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email || !token) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    try {
      await resetPassword({ email, token, password }).unwrap();
      setMessage("Password has been reset successfully!");
      setPassword("");
      setConfirmPassword("");
      toast.success("Password has been reset successfully!"); // Show success toast
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(
        err?.data?.message || "Error resetting password. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center w-full justify-center mt-20 mb-10">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword} autoComplete="off">
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !token}
            >
              {isLoading ? (
                <>
                  <span className="text-lg font-bold">Resetting...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            {error && (
              <p className="text-red-600 text-center text-sm bg-red-50 border border-red-200 rounded px-2 py-1">
                {error}
              </p>
            )}
            {/* Removed message display in UI since we use toast for success */}
            <Button
              variant="link"
              className="text-sm text-blue-600 hover:underline text-center mt-2 p-0 h-auto"
              onClick={() => navigate("/login")}
              type="button"
            >
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
