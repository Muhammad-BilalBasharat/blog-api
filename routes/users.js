import express from "express"
import dotenv from "dotenv"
import {
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
} from "../controllers/users.js"
import verifyToken from "../middlewares/verifyToken.js"
import verifyAdmin from "../middlewares/verifyAdmin.js"

const router = express.Router()
dotenv.config()

router.post("/signup", signup)
router.post("/verify-email", verifyEmail)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.post("/refresh-token", refreshAccessToken)
router.get("/users", verifyToken, verifyAdmin, getUser)
router.get("/me", verifyToken, getUserById)
router.put("/change-password", verifyToken, changePassword)
router.delete("/delete-user", verifyToken, verifyAdmin, deleteUser)


export default router;
