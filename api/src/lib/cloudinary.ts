import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  secure_url: string;
  public_id: string;
  bytes: number;
}

export async function uploadPdfBuffer(
  buffer: Buffer,
  folder: string,
  originalFilename?: string
): Promise<UploadResult> {
  const isVideo = originalFilename && /\.(mp4|webm|mov|avi)$/i.test(originalFilename);
  const resourceType = isVideo ? 'video' : 'auto';

  if (!isCloudinaryConfigured) {
    const fileId = crypto.randomUUID();
    const sanitizedName = (originalFilename || (isVideo ? 'video.mp4' : 'doc.pdf')).replace(/[^a-zA-Z0-9.-]/g, '_');
    return {
      secure_url: `https://res.cloudinary.com/demo/${resourceType}/upload/akreditasi/${folder}/${fileId}_${sanitizedName}`,
      public_id: `akreditasi/${folder}/${fileId}`,
      bytes: buffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder: `akreditasi/${folder}`,
      resource_type: resourceType,
    };

    if (!isVideo && originalFilename?.toLowerCase().endsWith('.pdf')) {
      uploadOptions.format = 'pdf';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Gagal mengunggah berkas ke Cloudinary.'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw') {
  if (!isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Gagal menghapus file dari Cloudinary:', err);
  }
}
