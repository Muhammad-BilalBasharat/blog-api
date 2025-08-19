import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ["technology", "business", "education", "design","life-style","other"],
    default: "",
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
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
  // Updated to support both single image and multiple images
  mainImage: {
    url: {
      type: String,
      default: "",
    },
    fileId: {
      type: String,
      default: "",
    }
  },
  otherImages: [{
    url: {
      type: String,
      required: true,
    },
    fileId: {
      type: String,
      required: true,
    }
  }],
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
export default Post;
