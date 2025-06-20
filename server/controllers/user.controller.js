import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { uploadMedia, deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import crypto from "crypto";
import { saveOtp, getOtpData, deleteOtp } from "../utils/otpStore.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../utils/email.js";
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
        field: null,
      });

    if (!/^[a-zA-Z0-9_]+$/.test(name))
      return res.status(400).json({
        success: false,
        message: "Invalid username.",
        field: "name",
      });

    email = email.trim().toLowerCase();
    const emailRegex =
      /^[a-zA-Z0-9](\.?[a-zA-Z0-9_\-+])*@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,}$/;
    const [localPart, domainPart] = email.split("@");
    if (
      !emailRegex.test(email) ||
      email.length > 254 ||
      localPart.length > 64 ||
      localPart.startsWith(".") ||
      localPart.endsWith(".") ||
      localPart.includes("..") ||
      !domainPart ||
      domainPart.startsWith("-") ||
      domainPart.endsWith("-") ||
      domainPart.includes("..")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
        field: "email",
      });
    }

    if (await User.findOne({ email }))
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
        field: "email",
      });

    if (await User.findOne({ name }))
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
        field: "name",
      });

    const otp = crypto.randomInt(100000, 999999).toString();
    saveOtp(email, otp, { name, email, password });
    await sendOtpEmail(email, otp, name);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify.",
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to register." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = getOtpData(email.toLowerCase());
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid. Please sign up again.",
        field: "otp",
      });
    }
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please sign up again.",
        field: "otp",
      });
    }
    const hashedPassword = await bcrypt.hash(record.data.password, 10);
    await User.create({
      name: record.data.name,
      email: record.data.email,
      password: hashedPassword,
    });
    deleteOtp(email.toLowerCase());
    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, viaGoogle, name } = req.body;

    // ── Google-backed login (via front-end token) ──
    if (viaGoogle) {
      if (!email || !name) {
        return res.status(400).json({
          success: false,
          message: "Google login failed: email and name are required.",
        });
      }
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not registered. Please sign up first.",
        });
      }
      // prevent login if no password has ever been set
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Cannot login via Google until a password is set.",
        });
      }
      generateToken(res, user, `Welcome ${user.name}`);
      return;
    }

    // ── Standard email/password login ──
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }
    generateToken(res, user, `Welcome ${user.name}`);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login.",
    });
  }
};

export const logout = async (_, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
      })
      .json({
        message: "Logged out successfully.",
        success: true,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const {
      name,
      email,
      role, // ← allow role update
      removePhoto,
      biography,
      linkedin,
      instagram,
      twitter,
    } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Page not found." });

    const updatedFields = {};

    // change username
    if (name && name !== user.name) {
      if (!/^[a-zA-Z0-9_]+$/.test(name))
        return res.status(400).json({
          success: false,
          message: "Username must not contain special characters.",
          field: "name",
        });
      if (await User.findOne({ name, _id: { $ne: userId } }))
        return res.status(400).json({
          success: false,
          message: "Username is already taken.",
          field: "name",
        });
      updatedFields.name = name;
    }

    // change email
    let otpSent = false;
    if (email && email.toLowerCase() !== user.email) {
      const normalized = email.trim().toLowerCase();
      const emailRegex =
        /^[a-zA-Z0-9](\.?[a-zA-Z0-9_\-+])*@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,}$/;
      const [localPart, domainPart] = normalized.split("@");
      if (
        !emailRegex.test(normalized) ||
        normalized.length > 254 ||
        localPart.length > 64 ||
        localPart.startsWith(".") ||
        localPart.endsWith(".") ||
        localPart.includes("..") ||
        !domainPart ||
        domainPart.startsWith("-") ||
        domainPart.endsWith("-") ||
        domainPart.includes("..")
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format.",
          field: "email",
        });
      }
      if (await User.findOne({ email: normalized, _id: { $ne: userId } }))
        return res.status(400).json({
          success: false,
          message: "Email is already in use.",
          field: "email",
        });

      const otp = crypto.randomInt(100000, 999999).toString();
      saveOtp(normalized, otp, { userId });
      await sendOtpEmail(normalized, otp, user.name);
      otpSent = true;
    }

    // change role if provided
    if (
      role &&
      ["student", "instructor"].includes(role) &&
      role !== user.role
    ) {
      updatedFields.role = role;
    }

    // photo handling
    if (removePhoto === "true" || profilePhoto) {
      if (user.photoUrl) {
        const publicId = user.photoUrl.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId);
      }
      if (removePhoto === "true") {
        updatedFields.photoUrl = "";
      } else if (profilePhoto) {
        const { secure_url } = await uploadMedia(profilePhoto.path);
        updatedFields.photoUrl = secure_url;
      }
    }

    // social & bio
    if (biography !== undefined) updatedFields.biography = biography;
    if (linkedin !== undefined) updatedFields.linkedin = linkedin;
    if (instagram !== undefined) updatedFields.instagram = instagram;
    if (twitter !== undefined) updatedFields.twitter = twitter;

    if (Object.keys(updatedFields).length > 0) {
      const updated = await User.findByIdAndUpdate(userId, updatedFields, {
        new: true,
      }).select("-password");
      return res.status(200).json({
        success: true,
        user: updated,
        otpSent,
        message: otpSent
          ? "OTP sent to your new email. Please verify."
          : "Profile updated successfully.",
      });
    }

    if (otpSent) {
      return res.status(200).json({
        success: true,
        otpSent: true,
        message: "OTP sent to your new email. Please verify.",
      });
    }

    return res.json({ success: true, message: "No changes made." });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

export const checkCurrentPassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required.",
      });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Page not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (isMatch) {
      return res.status(200).json({
        success: true,
        message: "Current password is correct.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password.",
      });
    }
  } catch (error) {
    console.error("Password check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while checking password.",
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update password." });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = getOtpData(email.toLowerCase());
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid.",
        field: "otp",
      });
    }
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
        field: "otp",
      });
    }

    const user = await User.findById(record.data.userId);
    if (!user) {
      deleteOtp(email.toLowerCase());
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.email = email.toLowerCase();
    await user.save();
    deleteOtp(email.toLowerCase());

    return res.json({ success: true, message: "Email updated successfully." });
  } catch (error) {
    console.error("Verify email change error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify OTP." });
  }
};

// Forgot Password: Send Reset Link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email." });

    // Generate token and set expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpire = Date.now() + 1000 * 60 * 30; // 30 min

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    // Send email with reset link
    const resetUrl = `${
      process.env.FRONTEND_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;
    // Use user.name in the email
    await sendPasswordResetEmail(user.email, resetUrl, null, user.name);

    return res.json({
      success: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send reset link." });
  }
};

// Reset Password: Set New Password
export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset link." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password has been reset successfully!",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reset password." });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ name: username }).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the user document, selecting both possible field names
    const userDoc = await User.findById(id).select(
      "name biography bio avatarUrl photoUrl linkedin twitter instagram"
    );
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert to plain object so we can remap fields
    const user = userDoc.toObject();

    // Respond with a consistent shape
    res.json({
      _id: user._id,
      name: user.name,
      bio: user.biography ?? user.bio ?? "",
      photoUrl: user.avatarUrl ?? user.photoUrl ?? "",
      linkedin: user.linkedin ?? "",
      twitter: user.twitter ?? "",
      instagram: user.instagram ?? "",
    });
  } catch (err) {
    console.error("Error in getInstructorById:", err);
    res.status(500).json({ message: "Server error" });
  }
};
