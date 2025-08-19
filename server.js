import dotenv from "dotenv"
dotenv.config()

import express from "express"
import connectDB from "./config/connectDB.js"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import usersRoutes from "./routes/users.js"
import postsRoutes from "./routes/posts.js"
import { PORT } from "./config/envConfig.js";
import rateLimit from "express-rate-limit"
// import commentsRoutes from "./routes/comments.js"


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `windowMs`
  message: "Too many requests, please try again later.",
})

const app = express()

app.use(express.json())
app.use(helmet())
app.use(cookieParser())
app.use(cors({ origin: "http://localhost:3000", credentials: true }))

const port = PORT || 5000


// api routes
app.use("/api/auth", limiter, usersRoutes)
app.use("/api/posts", postsRoutes)
// app.use("/api/comments", commentsRoutes)


app.listen(port, () => {
  connectDB()
  console.log(`Example app listening on port http://localhost:${port}`)
})
