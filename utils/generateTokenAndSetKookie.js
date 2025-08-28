import jwt from "jsonwebtoken"
import {JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, NODE_ENV} from "../config/envConfig.js"


const generateTokensAndSetKookie = (res, userId, role) => {
  const accessToken = jwt.sign({ id: userId, role: role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY || "15m",
  })
  const refreshToken = jwt.sign({ id: userId, role: role }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY || "7d",
  })
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: NODE_ENV !== "development", 
    sameSite: "Strict",
    maxAge: 1000 * 60 * 15, 
  })
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure:NODE_ENV !== "development", 
    sameSite: "Strict", 
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  })
}

export { generateTokensAndSetKookie }
