import express from "express"
import { getCommentsForPost, createComment, updateComment, deleteComment, getAllComments } from "../controllers/comments.js"
import verifyToken from "../middlewares/verifyToken.js"
import verifyAdmin from "../middlewares/verifyAdmin.js"

const router = express.Router({ mergeParams: true }) // <--- mergeParams: true IS CRUCIAL HERE

// Public route for getting comments for a post
// The full path will be /api/posts/:postId/comments
router.get("/", getCommentsForPost)
router.post("/", verifyToken, createComment) 
router.put("/:commentId", verifyToken, updateComment)
router.delete("/:commentId", verifyToken, deleteComment)
router.get("/all", getAllComments)

export default router;


