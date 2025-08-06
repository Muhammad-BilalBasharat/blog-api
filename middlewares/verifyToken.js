import jwt from "jsonwebtoken"
import User from "../models/user.js"

const verifyToken = async (req, res, next) => {
  try {
    // Get access token from cookies
    const accessToken = req.cookies.accessToken

    if (!accessToken) {
      return res.status(401).json({ message: "No access token, authorization denied." })
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)
    console.log("Access Token successfully decoded:", decoded) // See the payload

    // Fetch user from DB to get latest role and info
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: "User not found." })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired." })
    }
    return res.status(401).json({ message: "Access token is not valid." })
  }
}

export default verifyToken
