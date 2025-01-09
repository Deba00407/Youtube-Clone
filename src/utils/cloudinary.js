import { v2 as cloudinary } from 'cloudinary';
import details from '../../config.js'

cloudinary.config({
    cloud_name: details.cloudinaryCloudName,
    api_key: details.cloudinaryApiKey,
    api_secret: details.cloudinaryApiSecret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log('No file path provided');
            return null;
        }

        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        if (uploadResponse) {
            console.log('Image uploaded to cloudinary');
            return uploadResponse;
        }
    } catch (error) {
        console.log(`Error uploading image to cloudinary: ${error}`);
        return null;
    }
}

export { uploadOnCloudinary };