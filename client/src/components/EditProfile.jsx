import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  useLoadUserQuery,
  useUpdateUserMutation,
  useCheckPasswordMutation,
  useUpdatePasswordUserMutation,
  useVerifyEmailChangeMutation,
} from "@/features/api/authApi";
import { toast } from "react-hot-toast";

const Profile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [biography, setBiography] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [removeStatus, setRemoveStatus] = useState("idle");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [updatePasswordUser] = useUpdatePasswordUserMutation();
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [fadeTransition, setFadeTransition] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [currentPasswordValid, setCurrentPasswordValid] = useState(null);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCountdown, setEmailCountdown] = useState(30);
  const [otpError, setOtpError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const emailIntervalRef = useRef(null);

  const [verifyEmailChange, { isLoading: verifyEmailLoading }] =
    useVerifyEmailChangeMutation();

  const { data, isLoading, refetch } = useLoadUserQuery();
  const [updateUser] = useUpdateUserMutation();
  const [checkPassword, { isLoading: isCheckingPassword }] =
    useCheckPasswordMutation();

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name.trim() || "");
      setEmail(data.user.email.trim() || "");
      setBiography(data.user.biography.trim() || "");
      setLinkedin(data.user.linkedin.trim() || "");
      setInstagram(data.user.instagram.trim() || "");
      setTwitter(data.user.twitter.trim() || "");
    }
  }, [data]);

  const onChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setRemoveStatus("idle");
    }
  };

  const validateCurrentPassword = async () => {
    if (currentPassword.trim().length < 4) {
      setCurrentPasswordValid(null);
      return;
    }
    try {
      const res = await checkPassword({ currentPassword }).unwrap();
      if (res.success) {
        setCurrentPasswordValid(true);
        setIsPasswordInvalid(false);
      } else {
        setCurrentPasswordValid(false);
        setIsPasswordInvalid(true);
      }
    } catch (error) {
      setCurrentPasswordValid(false);
      setIsPasswordInvalid(true);
    }
  };

  useEffect(() => {
    if (currentPassword) validateCurrentPassword();
    else setCurrentPasswordValid(null);
  }, [currentPassword]);

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    try {
      const response = await updatePasswordUser({
        currentPassword,
        newPassword,
      }).unwrap();
      toast.success(response.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordDialogOpen(false);
      refetch(); // Refresh user data
    } catch (error) {
      setPasswordError(
        error?.data?.message || error?.error || "Password update failed"
      );
    }
  };

  const updateUserHandler = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email cannot be empty.");
      return;
    }

    const nameChanged = name.trim() !== data?.user?.name;
    const emailChanged = email.trim() !== data?.user?.email;
    const photoChanged = profilePhoto || removeStatus === "removing";
    const newFieldsChanged =
      biography !== data?.user?.biography.trim() ||
      linkedin !== data?.user?.linkedin.trim() ||
      instagram !== data?.user?.instagram.trim() ||
      twitter !== data?.user?.twitter.trim();

    if (!nameChanged && !emailChanged && !photoChanged && !newFieldsChanged) {
      toast.info("No changes detected.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      let payload;

      if (photoChanged) {
        payload = new FormData();
        payload.append("name", name);
        payload.append("email", email);
        payload.append("biography", biography);
        payload.append("linkedin", linkedin);
        payload.append("instagram", instagram);
        payload.append("twitter", twitter);
        if (removeStatus === "removing") {
          payload.append("removePhoto", "true");
        } else {
          payload.append("profilePhoto", profilePhoto);
        }
      } else {
        payload = {
          name,
          email,
          biography,
          linkedin,
          instagram,
          twitter,
        };
      }

      const result = await updateUser(payload).unwrap();

      setProfilePhoto(null);
      setRemoveStatus("idle");

      if (result.otpSent) {
        setPendingEmail(email);
        setShowEmailOtp(true);
        setEmailCountdown(30);
        setOtpError("");
        if (emailIntervalRef.current) clearInterval(emailIntervalRef.current);
        emailIntervalRef.current = setInterval(() => {
          setEmailCountdown((t) => {
            if (t <= 1) {
              clearInterval(emailIntervalRef.current);
              setOtpError("OTP expired");
              return 0;
            }
            return t - 1;
          });
        }, 1000);
        toast.success("OTP sent!");
      } else {
        toast.success(result.message || "Profile updated successfully!");
        refetch();
      }
    } catch (err) {
      const message =
        err?.data?.message || err?.error || "An unexpected error occurred.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setEmailCountdown(30);
    setEmailOtp("");
    await updateUser({ email: pendingEmail }).unwrap();
  };

  const handleVerifyEmailOtp = async () => {
    const result = await verifyEmailChange({ email: pendingEmail, otp: emailOtp });
    if ("error" in result) {
      setOtpError(result.error.data?.message || "Incorrect OTP");
      return;
    }
    toast.success(result.data?.message || "Email updated successfully!");
    setShowEmailOtp(false);
    setEmailOtp("");
    setOtpError("");
    if (emailIntervalRef.current) clearInterval(emailIntervalRef.current);
    refetch();
  };

  const switchTab = (tab) => {
    setFadeTransition(true);
    setTimeout(() => {
      setActiveTab(tab);
      setFadeTransition(false);
    }, 300);
  };

  const user = data?.user;
  const photoUrl = user?.photoUrl;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-center sm:text-left mb-4">
        Profile & Settings
      </h1>
      {/* Tabs: left-aligned and spaced */}
      <div className="flex justify-start gap-4 mb-4">
        {["profile", "photo", "password"].map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-blue-100"
            } transition-all duration-300`}
          >
            {tab === "profile" && "Profile Details"}
            {tab === "photo" && "Profile Picture"}
            {tab === "password" && "Password"}
          </button>
        ))}
      </div>
      <div
        className={`transition-all duration-500 ${
          fadeTransition ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {activeTab === "profile" && (
          <Card className="p-6 space-y-4 shadow-lg rounded-xl">
            <h2 className="text-xl font-semibold mb-1">Profile Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Biography</Label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Write a short biography"
                  className="w-full border rounded-md"
                  rows={4}
                />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input
                  placeholder="LinkedIn profile URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram handle"
                />
              </div>
              <div>
                <Label>Twitter</Label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Twitter handle"
                />
              </div>
            </div>
            {/* Save button: right-aligned */}
            <div className="mt-2 flex justify-end">
              <Button
                onClick={updateUserHandler}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "photo" && (
          <Card className="p-6 space-y-4 shadow-lg rounded-xl text-center">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <Avatar className="w-32 h-32 mx-auto ring-2 ring-blue-500">
              {photoUrl ? (
                <AvatarImage src={photoUrl} />
              ) : (
                <AvatarFallback>{name?.[0]}</AvatarFallback>
              )}
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={onChangeHandler}
              className="mt-4 file:rounded-md file:bg-blue-600 file:text-white file:px-4 file:py-2"
            />
            <Button
              variant="destructive"
              onClick={() => setRemoveStatus("removing")}
              disabled={!photoUrl}
            >
              Remove Photo
            </Button>
            {removeStatus === "removing" && (
              <p className="text-sm text-yellow-600">
                Click Save to confirm removal.
              </p>
            )}
            {/* Save button: right-aligned */}
            <div className="mt-2 flex justify-end">
              <Button
                onClick={updateUserHandler}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "password" && (
          <Card className="p-6 space-y-4 shadow-lg rounded-xl max-w-md">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <div className="space-y-1 relative">
              <Label>Current Password</Label>
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-gray-500"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="space-y-1 relative">
              <Label>New Password</Label>
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
                disabled={!currentPasswordValid}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-gray-500"
                disabled={!currentPasswordValid}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="space-y-1 relative">
              <Label>Confirm Password</Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
                disabled={!currentPasswordValid}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500"
                disabled={!currentPasswordValid}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {isPasswordInvalid && (
              <p className="text-sm text-red-600">
                Incorrect current password.
              </p>
            )}
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {/* Update button: right-aligned */}
            <div className="flex justify-end">
              <Button className="mt-4" onClick={handlePasswordChange}>
                Update Password
              </Button>
            </div>
          </Card>
        )}
      </div>
      <Dialog open={showEmailOtp} onOpenChange={setShowEmailOtp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please enter the 6-digit code sent to your new email.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            <InputOTP
              maxLength={6}
              value={emailOtp}
              onChange={(val) => {
                setEmailOtp(val.replace(/\D/g, ""));
                setOtpError("");
              }}
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
              Time remaining: {emailCountdown} seconds
            </p>
            {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
          </div>
          <DialogFooter>
            <div className="flex-grow text-left">
              <Button
                variant="link"
                onClick={handleResendOtp}
                disabled={emailCountdown > 0}
                className="p-0 text-sm"
              >
                Resend OTP
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailOtp(false);
                if (emailIntervalRef.current)
                  clearInterval(emailIntervalRef.current);
                setEmailOtp("");
                setOtpError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyEmailOtp}
              disabled={
                verifyEmailLoading ||
                emailOtp.trim().length < 6 ||
                emailCountdown <= 0
              }
            >
              {verifyEmailLoading ? "Verifying…" : "Verify OTP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
