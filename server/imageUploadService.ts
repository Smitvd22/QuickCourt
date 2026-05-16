import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudApiKey = process.env.CLOUDINARY_API_KEY;
const cloudApiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudFolder = process.env.CLOUDINARY_FOLDER || "quickcourt";

const ensureCloudinaryConfig = () => {
  if (!cloudName || !cloudApiKey || !cloudApiSecret) {
    throw new Error("Cloudinary configuration is missing");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
    secure: true,
  });
};

export interface UploadedImage {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export class ImageUploadService {
  private static instance: ImageUploadService;

  private constructor() {}

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * Upload an image file to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'facilities'
  ): Promise<UploadedImage> {
    ensureCloudinaryConfig();

    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: `${cloudFolder}/${folder}`,
      resource_type: "image",
      overwrite: false,
    });

    const uploadedImage: UploadedImage = {
      id: result.public_id,
      filename: result.public_id,
      url: result.secure_url,
      size: result.bytes,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };

    return uploadedImage;
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(filename: string): Promise<boolean> {
    try {
      ensureCloudinaryConfig();

      const publicId = filename;
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      return result.result === "ok" || result.result === "not found";
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Cloudinary does not use presigned URLs in this flow
   */
  async generatePresignedUploadUrl(): Promise<string> {
    throw new Error("Presigned uploads are not supported with Cloudinary in this project");
  }

  /**
   * Get image info from URL
   */
  getImageInfoFromUrl(url: string): { filename: string; folder: string } | null {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const uploadIndex = parts.findIndex((part) => part === "upload");
      if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) {
        return null;
      }

      const publicIdWithExt = parts.slice(uploadIndex + 1).join("/");
      const lastDot = publicIdWithExt.lastIndexOf(".");
      const publicId = lastDot > -1 ? publicIdWithExt.slice(0, lastDot) : publicIdWithExt;
      const folder = publicId.split("/").slice(0, -1).join("/");

      return { filename: publicId, folder };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    return { valid: true };
  }
}

export const imageUploadService = ImageUploadService.getInstance();
