import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String, // URL of the image from Cloudinary
    default: "",
  },
  cloudinaryId: {
    type: String, // Public ID from Cloudinary for deletion
    default: "",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
},{timestamps: true});

const Post = mongoose.model("Post", postSchema);

export default Post;
