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
    const { 
      title, 
      content, 
      author, 
      tags, 
      category, 
      excerpt, 
      isPublished, 
      removeMainImage, 
      removeOtherImageIds 
    } = req.body;
    
    const postId = req.params.id;

    // Find the existing post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Generate new slug if title changed
    let updatedSlug = post.slug;
    if (title && title !== post.title) {
      updatedSlug = slugify(title, { lower: true, strict: true });
      
      // Check if slug already exists
      const existingPost = await Post.findOne({ 
        slug: updatedSlug, 
        _id: { $ne: postId } 
      });
      if (existingPost) {
        updatedSlug = `${updatedSlug}-${Date.now()}`;
      }
    }

    // Handle main image removal
    let currentMainImage = post.mainImage;
    if (removeMainImage === 'true' && post.mainImage) {
      // Delete the old main image file
      const oldImagePath = path.join(__dirname, '../../uploads', post.mainImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      currentMainImage = null;
    }

    // Handle other images removal
    let currentOtherImages = post.otherImages || [];
    if (removeOtherImageIds && removeOtherImageIds.length > 0) {
      const idsToRemove = Array.isArray(removeOtherImageIds) 
        ? removeOtherImageIds 
        : removeOtherImageIds.split(',');
      
      idsToRemove.forEach(imageId => {
        const imageToRemove = currentOtherImages.find(img => img._id.toString() === imageId);
        if (imageToRemove) {
          // Delete the image file
          const imagePath = path.join(__dirname, '../../uploads', imageToRemove.filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
          // Remove from array
          currentOtherImages = currentOtherImages.filter(img => img._id.toString() !== imageId);
        }
      });
    }

    // Handle new main image upload
    if (req.files && req.files.mainImage) {
      // Delete old main image if exists
      if (post.mainImage) {
        const oldImagePath = path.join(__dirname, '../../uploads', post.mainImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      currentMainImage = req.files.mainImage[0].filename;
    }

    // Handle new other images upload
    if (req.files && req.files.otherImages) {
      const newOtherImages = req.files.otherImages.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date()
      }));
      currentOtherImages = [...currentOtherImages, ...newOtherImages];
    }

    // Prepare update data
    const updateData = {
      title: title || post.title,
      slug: updatedSlug,
      content: content || post.content,
      author: author || post.author,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : post.tags,
      category: category || post.category,
      excerpt: excerpt || post.excerpt,
      isPublished: isPublished !== undefined ? 
        (isPublished === 'true' || isPublished === true) : 
        post.isPublished,
      mainImage: currentMainImage,
      otherImages: currentOtherImages,
      updatedAt: new Date(),
    };

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });

  } catch (error) {
    console.error("Error updating post:", error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      if (req.files.mainImage) {
        req.files.mainImage.forEach(file => {
          const filePath = path.join(__dirname, '../../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      if (req.files.otherImages) {
        req.files.otherImages.forEach(file => {
          const filePath = path.join(__dirname, '../../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    Write a fully original, plagiarism-free, and SEO-optimized blog post in clean, structured markdown format.
    Topic: ${title}  
    Category: ${category}  
    Tags: ${tags}  
    Excerpt: ${excerpt}  
    
    Style & Structure Requirements:
    - Total length: 1200–1500 words.
    - Use a clear, engaging **title** as H1.
    - Write a short, compelling **introduction** (2–3 sentences) with a hook.
    - Use multiple **H2** and **H3 subheadings** for structure.
    - Write concise paragraphs (2–3 sentences each) for easy readability.
    - Include **bold key phrases** and **bullet points** where appropriate.
    - Use storytelling and practical examples to make it relatable.
    - Naturally integrate keywords without sounding forced.
    - End with a strong **conclusion** and a **call-to-action**.
    - Avoid generic AI-like content or filler phrases.
    - Return ONLY the final markdown content, no extra text.
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
