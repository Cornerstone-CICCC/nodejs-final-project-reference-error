import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { uploadImage } from "../types/image";
dotenv.config();

const projectUrl = process.env.SUPABASE_PROJECT_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
const bucketName = process.env.SUPABASE_BUCKET_NAME;

if (!projectUrl || !serviceRole || !bucketName) {
  throw new Error(
    "Supabase project URL, service role, or bucket name is missing in environment variables",
  );
}

const supabase = createClient(projectUrl, serviceRole);

export class questionImage {
  async uploadImage(file: uploadImage, quizId: string, questionId: string) {
    try {
      //console.log(file)
      if (bucketName) {
        const { fileBuffer, mimeType } = file;
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(mimeType)) {
          throw new Error("Invalid file type. Allowed: JPEG, PNG, GIF");
        }

        // optimize image
        const optimizedBuffer = await sharp(fileBuffer)
          .resize(1200, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        // Generate file name
        const filedId = uuidv4();
        const fileName = `${Date.now()}_${filedId}`;
        const filePath = `questions/${quizId}/${questionId}/${fileName}`;

        // upload to suppabase storage
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, optimizedBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (error) {
          console.error("Storage upload error:", error);
          throw new Error(`Upload failed: ${error.message}`);
        }
        // generate public url
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error("Failed to generate public URL");
        }

        return {
          imageUrl: urlData.publicUrl,
          path: filePath,
        };
      }
    } catch (error) {
      throw new Error(`Error creating Url: ${error}`);
    }
  }
  async deleteImage(imageUrl: string) {
    if (!imageUrl) return null;
    try {
      const path = await this.extractPathFromUrl(imageUrl);

      if (!path) {
        console.error("Could not get path from URL:", imageUrl);
        return false;
      }

      // Delete from Supabase Storage
      if (bucketName) {
        const { error } = await supabase.storage.from(bucketName).remove([path]);

        if (error) {
          console.error("Storage deletion error:", error);
          return false;
        }
        // image deleted
        return true;
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      return false;
    }
  }

  async extractPathFromUrl(url: string) {
    if (!url) return null;
    try {
      // Match the path pattern in the URL
      const regex = new RegExp(`public/${bucketName}/(.+)`);
      const match = url.match(regex);

      if (match?.[1]) {
        return match[1];
      }

      // Alternative extraction method if the above doesn't work
      const imageUrl = new URL(url);
      const pathParts = imageUrl.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucketName);

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }

      return null;
    } catch (error) {
      console.error("Error extracting path from URL:", error);
      return null;
    }
  }
}
