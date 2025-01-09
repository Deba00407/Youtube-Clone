import { v2 as cloudinary } from 'cloudinary';
import details from '../../config.js'
import fs from 'fs';

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
            fs.unlinkSync(localFilePath);
            return uploadResponse;
        }

    } catch (error) {
        console.log(`Error uploading image to cloudinary: ${error}`);
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadOnCloudinary };