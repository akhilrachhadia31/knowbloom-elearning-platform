import React, { useState } from "react";
import { useForgotPasswordMutation } from "../features/api/authApi";
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
import Logo from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("A password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      setError(
        err?.data?.message ||
          "An error occurred. Please check your email and try again."
      );
    }
  };

  return (
    <div className="flex items-center w-full justify-center mt-20 mb-10">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your registered email, and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordReset} autoComplete="off">
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? <>Sending...</> : "Send Reset Link"}
            </Button>
            {message && (
              <p className="text-green-600 text-center text-sm bg-green-50 border border-green-200 rounded px-2 py-1">
                {message}
              </p>
            )}
            {error && (
              <p className="text-red-600 text-center text-sm bg-red-50 border border-red-200 rounded px-2 py-1">
                {error}
              </p>
            )}
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

export default ForgotPassword;
