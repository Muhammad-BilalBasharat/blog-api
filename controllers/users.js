import User from "../models/user.js"
import { generateTokensAndSetKookie } from "../utils/generateTokenAndSetKookie.js"
import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import {
  sendVerificationEmail,
  welcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../nodemailer/emails.js"

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
      })
    }
    let user = await User.findOne({ email: email })
    if (user) {
      return res.status(400).json({
        success: false,
        message: "user already exists",
      })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationTokenExpires = Date.now() + 3600000
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires,
    })

    generateTokensAndSetKookie(res, user._id, user.role) // Set both tokens as cookies
    await sendVerificationEmail(user.email, verificationToken)
    res.status(201).json({
      success: true,
      message: "user created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.body
  try {
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "invalid verification token",
      })
    }
    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()
    await welcomeEmail(user.email, user.name)
    res.status(200).json({
      success: true,
      message: "email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Verify email error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "invalid credentials",
      })
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" })
    }

    generateTokensAndSetKookie(res, user._id, user.role) // Set both tokens as cookies
    res.status(200).json({
      success: true,
      message: "user logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie("accessToken") // Clear access token cookie
    res.clearCookie("refreshToken") // Clear refresh token cookie
    res.status(200).json({
      success: true,
      message: "user logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      })
    }
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = Date.now() + 3600000
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetTokenExpires
    await user.save()
    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`)
    res.status(200).json({
      success: true,
      message: "password reset email sent successfully",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const resetPassword = async (req, res) => {
  const { newPassword } = req.body
  const { token } = req.params
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    await sendResetSuccessEmail(user.email)
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const getUser = async (req, res) => {
  try {
    const users = await User.find()
    if (!users || users.length === 0) {
      return res.status(400).json({
        message: "No user found",
        error: "No user found",
      })
    }
    // Exclude password from each user
    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user._doc
      return { ...rest }
    })
    res.status(200).json({
      success: true,
      message: "Users fetched",
      users: usersWithoutPassword,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid old password" })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const getUserById = async (req, res) => {
  const userId = req.user._id
  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      })
    }
    res.status(200).json({
      success: true,
      message: "user fetched successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      res.status(404).json({
        success: false,
        message: "user not found",
      })
    }
    res.status(200).json({
      success: true,
      message: "user deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "internal server error",
    })
  }
}

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided." })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Find user to ensure they still exist
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: "User not found for refresh token." })
    }

    // Generate new access and refresh tokens and set them as cookies
    generateTokensAndSetKookie(res, user._id, user.role)

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    if (error.name === "TokenExpiredError") {
      // Clear expired refresh token to force re-login
      res.clearCookie("refreshToken")
      return res.status(401).json({ message: "Refresh token expired. Please log in again." })
    }
    return res.status(401).json({ message: "Invalid refresh token." })
  }
}

export {
  signup,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUser,
  getUserById,
  changePassword,
  deleteUser,
  refreshAccessToken,
}
