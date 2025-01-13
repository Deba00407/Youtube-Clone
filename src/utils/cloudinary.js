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

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) {
            console.log('No public id provided');
            return null;
        }

        const deleteResponse = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        if (deleteResponse) {
            return deleteResponse;
        }

    } catch (error) {
        console.log(`Error deleting ${resourceType} from cloudinary: ${error}`);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };