import jwt from "jsonwebtoken"

const generateTokensAndSetKookie = (res, userId, role) => {
  // Generate Access Token
  const accessToken = jwt.sign({ id: userId, role: role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m", // Default to 15 minutes
  })

  // Generate Refresh Token
  const refreshToken = jwt.sign({ id: userId, role: role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d", // Default to 7 days
  })

  // Set Access Token as an HTTP-only cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maxAge: 1000 * 60 * 15, // 15 minutes in milliseconds (should match ACCESS_TOKEN_EXPIRY)
  })

  // Set Refresh Token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds (should match REFRESH_TOKEN_EXPIRY)
  })
}

export { generateTokensAndSetKookie }
