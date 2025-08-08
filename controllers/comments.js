import Comment from "../models/comment.js";
import Post from "../models/post.js" ;

const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Optional: Check if the post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Populate the userId field to get user details (e.g., name, email) from your User model
    const comments = await Comment.find({ postId }).populate("userId", "name email").sort({ createdAt: 1 })
    res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      comments,
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id 

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required for a comment.",
      })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found, cannot add comment.",
      })
    }

    const newComment = await Comment.create({
      content,
      userId, // Assign the authenticated user's ID
      postId,
    })

    // Populate the userId field for the response
    const populatedComment = await newComment.populate("userId", "name email")

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      comment: populatedComment,
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body
    const userId = req.user._id // Get user ID from authenticated request

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required to update a comment.",
      })
    }


    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      })
    }

    // Authorization: Only the comment's owner can update it
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment.",
      })
    }

    comment.content = content;
    comment.updatedAt = Date.now();
    await comment.save()

    // Populate the userId field for the response
    const populatedComment = await comment.populate("userId", "name email")

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: populatedComment,
    })
  } catch (error) {
    console.error("Error updating comment:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id // Get user ID from authenticated request

    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      })
    }

    // Authorization: Only the comment's owner or an admin can delete it
    // This relies on your User model having a 'role' field and 'admin' enum value
    if (comment.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment.",
      })
    }

    await Comment.findByIdAndDelete(commentId)

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

export { getCommentsForPost, createComment, updateComment, deleteComment }


