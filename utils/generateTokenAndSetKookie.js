import jwt from "jsonwebtoken"
import {JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, NODE_ENV} from "../config/envConfig.js"


const generateTokensAndSetKookie = (res, userId, role) => {
  // Generate Access Token
  const accessToken = jwt.sign({ id: userId, role: role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY || "15m", // Default to 15 minutes
  })

  // Generate Refresh Token
  const refreshToken = jwt.sign({ id: userId, role: role }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY || "7d", // Default to 7 days
  })

  // Set Access Token as an HTTP-only cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maxAge: 1000 * 60 * 15, // 15 minutes in milliseconds (should match ACCESS_TOKEN_EXPIRY)
  })

  // Set Refresh Token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure:NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds (should match REFRESH_TOKEN_EXPIRY)
  })
}

export { generateTokensAndSetKookie }
