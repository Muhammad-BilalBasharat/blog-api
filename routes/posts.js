import express from "express"
import { getPosts, getPostById, createPost, updatePost, deletePost ,getPostBySlug} from "../controllers/posts.js"
import upload from "../middlewares/uploadImage.js";
import verifyAdmin from "../middlewares/verifyAdmin.js";
import verifyToken from "../middlewares/verifyToken.js";
import commentsRoutes from "./comments.js";
const router = express.Router( );
router.use("/:postId/comments", commentsRoutes);


router.get("/posts",verifyToken,verifyAdmin, getPosts)
router.get("/post/:id", verifyToken, getPostById)
router.get("/post-by-slug/:slug",verifyToken, getPostBySlug)
router.post("/create-post", upload.single("image"), verifyToken,verifyAdmin,createPost) 
router.put("/update-post/:id", upload.single("image"),verifyToken,verifyAdmin, updatePost) 
router.delete("/delete-post/:id",verifyToken,verifyAdmin, deletePost)

export default router;
