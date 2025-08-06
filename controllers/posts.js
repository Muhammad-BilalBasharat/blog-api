import Post from "../models/post.js"
import cloudinary from "../utils/cloudinary.js"


const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      posts,
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }
    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    })
  } catch (error) {
    console.error("Error fetching post by ID:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}


const createPost = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body

    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and author are required fields.",
      })
    }

    let imageUrl = ""
    let cloudinaryId = ""

    if (req.file) {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(
        req.file.path || `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      )
      imageUrl = result.secure_url
      cloudinaryId = result.public_id
    }

    const newPost = await Post.create({
      title,
      content,
      author,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [], // Assuming tags come as a comma-separated string
      imageUrl,
      cloudinaryId,
    })

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post:newPost
    })
  } catch (error) {
    console.error("Error creating post:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const updatePost = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body
    const postId = req.params.id;

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    let imageUrl = post.imageUrl
    let cloudinaryId = post.cloudinaryId

    if (req.file) {
      // If a new image is uploaded, delete the old one from Cloudinary
      if (post.cloudinaryId) {
        await cloudinary.uploader.destroy(post.cloudinaryId)
      }
      const result = await cloudinary.uploader.upload(
        req.file.path || `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      )
      imageUrl = result.secure_url
      cloudinaryId = result.public_id
    } else if (req.body.removeImage === "true" && post.cloudinaryId) {
      // Option to remove image without uploading a new one
      await cloudinary.uploader.destroy(post.cloudinaryId)
      imageUrl = ""
      cloudinaryId = ""
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        author,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : post.tags, // Update tags or keep existing
        imageUrl,
        cloudinaryId,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }, // Return the updated document and run schema validators
    )

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    })
  } catch (error) {
    console.error("Error updating post:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Delete image from Cloudinary if it exists
    if (post.cloudinaryId) {
      await cloudinary.uploader.destroy(post.cloudinaryId)
    }

    await Post.findByIdAndDelete(postId)

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

export { getPosts, getPostById, createPost, updatePost, deletePost }
