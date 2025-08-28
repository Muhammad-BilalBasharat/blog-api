import Post from "../models/post.js";
import imagekit from "../utils/imagekit.js";
import { uploadAndOptimizeImageToImageKit } from "../utils/imageUpload.js";
import slugify from "slugify";
import fs from "fs";
import generateText from "../utils/gemini.js";

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Post fetched successfully by slug",
      post,
    });
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, author, tags, category, isPublished, excerpt } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and author are required fields.",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    let mainImageData = { url: "", fileId: "" };
    let otherImagesData = [];

    // Handle main image upload
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      mainImageData = await uploadAndOptimizeImageToImageKit(
        req.files.mainImage[0],
        "/blog-posts/main",
        ["blog-post", "main-image"]
      );
    }

    // Handle other images upload
    if (req.files && req.files.otherImages && req.files.otherImages.length > 0) {
      for (const imageFile of req.files.otherImages) {
        if (otherImagesData.length < 5) {
          try {
            const uploaded = await uploadAndOptimizeImageToImageKit(
              imageFile,
              "/blog-posts/others",
              ["other-image", "blog-post"]
            );
            otherImagesData.push(uploaded);
          } catch (uploadError) {
            console.warn("Failed to upload other image:", uploadError);
            // Clean up the file
            if (fs.existsSync(imageFile.path)) {
              fs.unlinkSync(imageFile.path);
            }
          }
        } else {
          console.warn("Maximum number of other images reached. Skipping upload for:", imageFile.originalname);
          if (fs.existsSync(imageFile.path)) {
            fs.unlinkSync(imageFile.path);
          }
        }
      }
    }

    const newPost = await Post.create({
      title,
      slug,
      content,
      author,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      mainImage: mainImageData,
      otherImages: otherImagesData,
      category,
      isPublished,
      excerpt,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);

    // Clean up uploaded files if they exist
    if (req.files) {
      if (req.files.mainImage) {
        req.files.mainImage.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.files.otherImages) {
        req.files.otherImages.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, content, author, tags, removeMainImage, removeOtherImageIds } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    let updatedSlug = post.slug;
    if (title && title !== post.title) {
      updatedSlug = slugify(title, { lower: true, strict: true });
    }

    let currentMainImage = post.mainImage ? { ...post.mainImage } : { url: "", fileId: "" };
    let currentOtherImages = post.otherImages ? [...post.otherImages] : [];

    // Handle mainImage update
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      // Delete old main image if it exists
      if (currentMainImage && currentMainImage.fileId) {
        try {
          await imagekit.deleteFile(currentMainImage.fileId);
        } catch (deleteError) {
          console.warn("Failed to delete old main image:", deleteError);
        }
      }

      const imageFile = req.files.mainImage[0];
      currentMainImage = await uploadAndOptimizeImageToImageKit(
        imageFile,
        "/blog-posts/main",
        ["main-image", "blog-post"]
      );
    } else if (removeMainImage === "true" && currentMainImage && currentMainImage.fileId) {
      // Remove main image
      try {
        await imagekit.deleteFile(currentMainImage.fileId);
      } catch (deleteError) {
        console.warn("Failed to delete main image:", deleteError);
      }
      currentMainImage = { url: "", fileId: "" };
    }

    // Handle otherImages removal
    if (removeOtherImageIds) {
      const idsToRemove = Array.isArray(removeOtherImageIds)
        ? removeOtherImageIds
        : removeOtherImageIds.split(",").map(id => id.trim());

      const imagesToKeep = [];
      for (const img of currentOtherImages) {
        if (idsToRemove.includes(img.fileId)) {
          try {
            await imagekit.deleteFile(img.fileId);
          } catch (deleteError) {
            console.warn("Failed to delete other image:", deleteError);
          }
        } else {
          imagesToKeep.push(img);
        }
      }
      currentOtherImages = imagesToKeep;
    }

    // Handle otherImages addition
    if (req.files && req.files.otherImages && req.files.otherImages.length > 0) {
      for (const imageFile of req.files.otherImages) {
        if (currentOtherImages.length < 5) {
          try {
            const uploaded = await uploadAndOptimizeImageToImageKit(
              imageFile,
              "/blog-posts/others",
              ["other-image", "blog-post"]
            );
            currentOtherImages.push(uploaded);
          } catch (uploadError) {
            console.warn("Failed to upload other image:", uploadError);
            // Clean up the file
            if (fs.existsSync(imageFile.path)) {
              fs.unlinkSync(imageFile.path);
            }
          }
        } else {
          console.warn("Maximum number of other images reached. Skipping upload for:", imageFile.originalname);
          if (fs.existsSync(imageFile.path)) {
            fs.unlinkSync(imageFile.path);
          }
        }
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        slug: updatedSlug,
        content,
        author,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : post.tags,
        mainImage: currentMainImage,
        otherImages: currentOtherImages,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);

    // Clean up any uploaded files if there's an error
    if (req.files) {
      if (req.files.mainImage) {
        req.files.mainImage.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (req.files.otherImages) {
        req.files.otherImages.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Delete main image from ImageKit if it exists
    if (post.mainImage && post.mainImage.fileId) {
      try {
        await imagekit.deleteFile(post.mainImage.fileId);
      } catch (deleteError) {
        console.warn("Failed to delete main image:", deleteError);
      }
    }

    // Delete other images from ImageKit if they exist
    if (post.otherImages && post.otherImages.length > 0) {
      for (const img of post.otherImages) {
        if (img.fileId) {
          try {
            await imagekit.deleteFile(img.fileId);
          } catch (deleteError) {
            console.warn("Failed to delete other image:", deleteError);
          }
        }
      }
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const generatePostWithGemini = async (req, res) => {
  try {
    const { title, category, tags, excerpt } = req.body;
    const prompt = `
Write a fully original, plagiarism-free, and SEO-optimized blog post in markdown format.  
Topic: ${title}  
Category: ${category}  
Tags: ${tags}  
Excerpt: ${excerpt}  
Requirements:  
- Length: 1200–1500 words. 
- Write in a natural, conversational, and human-like tone with varied sentence structures.  
- Use storytelling, relatable examples, and practical insights.  
- Structure content with a clear title, H2/H3 subheadings, bullet points, and short paragraphs.  
- Add a strong hook in the introduction and a conclusion with a clear call-to-action.  
- Naturally integrate relevant keywords without keyword stuffing.  
- Make it engaging, easy to read, and valuable for the target audience.  
- Avoid AI-sounding or generic filler content.  
- Return **only** the final markdown content.  
`;
    const post = await generateText(prompt);
    res.status(200).json({
      success: true,
      message: "Post generated successfully",
      post,
    });
  } catch (error) {
    console.error("Error generating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export { getPosts, getPostById, createPost, updatePost, deletePost, getPostBySlug, generatePostWithGemini };
