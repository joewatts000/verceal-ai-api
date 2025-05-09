import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
  data: Array<{
    url: string;
  }>;
}

export async function uploadToCloudinary(data: UploadResult) {
  const imageUrl = data.data[0].url;
  const uploadResult = await cloudinary.uploader.upload(
    imageUrl,
    { folder: 'e2-studio-ai-generated-images' }
  );

  return { 
    data: [
      {
        url: uploadResult?.secure_url
      }
    ] 
  };    
}

export async function uploadBase64ToCloudinary(base64Data: string) {
// Cloudinary expects the base64 string to be prefixed with a MIME type
  const base64WithPrefix = `data:image/jpeg;base64,${base64Data}`;

  const uploadResult = await cloudinary.uploader.upload(
    base64WithPrefix,
    { folder: 'e2-studio-ai-generated-images' }
  );

  return { 
    data: [
      {
        url: uploadResult?.secure_url
      }
    ] 
  };    
}
