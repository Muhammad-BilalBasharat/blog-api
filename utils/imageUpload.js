import imagekit from "./imagekit.js";
import fs from "fs";

// Helper function to upload and optimize images
export const uploadAndOptimizeImageToImageKit = async (imageFile, folder, tags = []) => {
  try {
    const fileBuffer = fs.readFileSync(imageFile.path);
    
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: folder,
      tags: tags,
    });

    // Clean up the temporary file
    fs.unlinkSync(imageFile.path);

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "1280" }
      ]
    });

    return {
      url: optimizedImageUrl,
      fileId: response.fileId
    };
  } catch (error) {
    // Clean up the temporary file even if upload fails
    if (fs.existsSync(imageFile.path)) {
      fs.unlinkSync(imageFile.path);
    }
    throw error;
  }
};
