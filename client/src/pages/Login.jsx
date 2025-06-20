import { Button } from "@/components/ui/button";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useLoadUserQuery,
  useLoginUserMutation,
  useRegisterUserMutation,
  useVerifyOtpMutation,
  authApi,
} from "@/features/api/authApi";
import Logo from "@/components/Logo";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

// Only letters, numbers, underscore allowed in username:
const usernameRegex = /^[a-zA-Z0-9_]+$/;

const Login = () => {
  const [signupInput, setSignupInput] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [tab, setTab] = useState("login");

  // Track OTP dialog, resend state, error, and countdown
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { data, isLoading, refetch } = useLoadUserQuery();
  const isAuthenticated = !!data?.user;
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    if (isLoginPage) {
      refetch();
    }
  }, [isLoginPage, refetch]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isLoginPage) {
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, isLoginPage, navigate]);

  const [registerUser, { error: registerError, isLoading: registerIsLoading }] =
    useRegisterUserMutation();
  const [loginUser, { error: loginError, isLoading: loginIsLoading }] =
    useLoginUserMutation();
  const [verifyOtp, { isLoading: otpIsLoading }] = useVerifyOtpMutation();

  const handleLoginButtonClick = () => {
    handleRegistration("login");
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const result = await loginUser({
      email: decoded.email,
      viaGoogle: true,
      name: decoded.name,
    });
    if ("error" in result) {
      toast.error(result.error.data?.message || "Google login failed");
    } else {
      dispatch(authApi.util.resetApiState());
      toast.success("Login successful");
      window.location.href = "/";
    }
  };

  const changeInputHandler = (e, type) => {
    const { name, value } = e.target;
    if (type === "signup") {
      setSignupInput({ ...signupInput, [name]: value });
      setFieldErrors({ ...fieldErrors, [name]: "" });
    } else {
      setLoginInput({ ...loginInput, [name]: value });
    }
  };

  /**
   * handleRegistration:
   *   type === "signup" → call registerUser mutation (send OTP, show OTP dialog)
   *   type === "login"  → call loginUser mutation (email/password), then clear cache+reload
   */
  const handleRegistration = async (type) => {
    // shared for signup & login
    if (type === "signup" && !usernameRegex.test(signupInput.name)) {
      setFieldErrors((f) => ({ ...f, name: "Invalid username." }));
      return;
    }
    const action = type === "signup" ? registerUser : loginUser;
    const payload = type === "signup" ? signupInput : loginInput;
    const result = await action(payload);

    if ("error" in result) {
      toast.error(result.error.data?.message || "Something went wrong");
      return;
    }

    if (type === "signup") {
      // show OTP dialog
      setShowOtpInput(true);
      setCountdown(30);
      setOtpError("");
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCountdown((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setOtpError("OTP expired");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      toast.success("OTP sent!");
    } else {
      // login → reset RTK state, redirect
      dispatch(authApi.util.resetApiState());
      toast.success("Logged in!");
      window.location.href = "/";
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setCanResend(false);
    setCountdown(30);
    setOtp("");
    await handleRegistration("signup");
  };

  const handleOtpVerify = async () => {
    const result = await verifyOtp({ email: signupInput.email, otp });
    if ("error" in result) {
      // Show error, but do NOT clear the interval or enable resend
      setOtpError("Incorrect OTP. Try again.");
      return;
    }
    toast.success("Signup successful! Please log in.");
    setShowOtpInput(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCanResend(false);
    setOtp("");
    setOtpError("");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div>
      {!isLoginPage && !isAuthenticated && (
        <div className="flex justify-end space-x-4 p-4">
          <Button onClick={() => navigate("/login")}>Login</Button>
          <Button onClick={() => navigate("/login")}>Signup</Button>
        </div>
      )}

      <div className="flex items-center w-full justify-center mt-20 mb-20">
        <Tabs value={tab} onValueChange={setTab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Signup</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Signup</CardTitle>
                <CardDescription>Create your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    type="text"
                    name="name"
                    value={signupInput.name}
                    onChange={(e) => changeInputHandler(e, "signup")}
                    placeholder="abc"
                    required
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-sm">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={signupInput.email}
                    onChange={(e) => changeInputHandler(e, "signup")}
                    placeholder="abc@gmail.com"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type="password"
                    name="password"
                    value={signupInput.password}
                    onChange={(e) => changeInputHandler(e, "signup")}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-red-500 text-sm">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  disabled={registerIsLoading}
                  onClick={() => handleRegistration("signup")}
                  className="w-full mb-3"
                >
                  {registerIsLoading ? <>Signing up</> : "Signup"}
                </Button>

                <AlertDialog open={showOtpInput} onOpenChange={setShowOtpInput}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Enter OTP</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please enter the 6-digit OTP sent to your email to
                        verify your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <InputOTP
                        maxLength={6}
                        onChange={(value) => {
                          const numeric = value.replace(/\D/g, "");
                          setOtp(numeric);
                          setOtpError("");
                        }}
                        value={otp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <p className="text-sm text-gray-500">
                        Time remaining: {countdown} seconds
                      </p>
                      {otpError && (
                        <p className="text-red-500 text-sm">{otpError}</p>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <div className="flex-grow text-left">
                        <Button
                          variant="link"
                          onClick={handleResendOtp}
                          disabled={countdown > 0 || registerIsLoading}
                          className="p-0 text-sm"
                        >
                          Resend OTP
                        </Button>
                      </div>
                      <AlertDialogCancel
                        onClick={() => {
                          setShowOtpInput(false);
                          setSignupInput({ name: "", email: "", password: "" });
                          if (intervalRef.current)
                            clearInterval(intervalRef.current);
                          setCanResend(false);
                          setOtp("");
                          setOtpError("");
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <Button
                        onClick={handleOtpVerify}
                        disabled={
                          otpIsLoading || otp.trim().length < 6 || countdown <= 0
                        }
                      >
                        {otpIsLoading ? <>Verifying…</> : "Verify OTP"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <span
                    className="underline underline-offset-4 cursor-pointer"
                    onClick={() => setTab("login")}
                  >
                    Login
                  </span>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Login to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={loginInput.email}
                    onChange={(e) => changeInputHandler(e, "login")}
                    placeholder="abc@gmail.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type="password"
                    name="password"
                    value={loginInput.password}
                    onChange={(e) => changeInputHandler(e, "login")}
                    placeholder="xyz"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  disabled={loginIsLoading}
                  onClick={handleLoginButtonClick}
                  className="w-full"
                >
                  {loginIsLoading ? (
                    <>
                      <span className="text-lg font-bold"> Logging in...</span>
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <div className="flex items-center my-2">
                  <hr className="flex-grow border-t border-gray-300" />
                  <span className="mx-2 text-sm text-gray-500">OR</span>
                  <hr className="flex-grow border-t border-gray-300" />
                </div>
                <div className="w-full flex">
                  <div style={{ width: 300 }}>
                    <GoogleLogin
                      onSuccess={handleGoogleLoginSuccess}
                      onError={() => toast.error("Google Login Failed")}
                      theme="outline"
                      size="large"
                      width={350}
                      shape="pill"
                    />
                  </div>
                </div>

                <Button
                  variant="link"
                  className="text-sm text-blue-600 hover:underline text-center mt-2 p-0 h-auto"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </Button>

                <p className="text-center text-sm">
                  Don't have an account?{" "}
                  <span
                    className="underline underline-offset-4 cursor-pointer"
                    onClick={() => setTab("signup")}
                  >
                    Signup
                  </span>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
