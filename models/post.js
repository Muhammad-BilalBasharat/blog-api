import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
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
  imageUrl: {
    type: String, 
    default: "",
  },
  cloudinaryId: {
    type: String, 
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
