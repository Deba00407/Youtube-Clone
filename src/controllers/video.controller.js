import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import Video from "../models/video.models.js";

class VideoFunctions {
    publishVideo = asyncHandler(async (req, res) => {
        const { title, description } = req.body;
        const owner = req.user?._id;


        const localVideoPath = req.files?.videoFile?.[0]?.path;
        const localThumbnailPath = req.files?.thumbnail?.[0]?.path;

        if (!localVideoPath || !localThumbnailPath) {
            return res.status(400).json({ message: "Video file and thumbnail are required." });
        }

        // Uploading to cloudinary
        const videoFile = await uploadOnCloudinary(localVideoPath);
        const thumbnail = await uploadOnCloudinary(localThumbnailPath);

        if (!videoFile || !thumbnail) {
            throw new ApiError({ statusCode: 500, message: "Error uploading video file or thumbnail." });
        }

        // Save to the database
        const video = new Video({
            title,
            description,
            owner,
            duration: videoFile.duration,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            isPublished: false
        })

        const response = await video.save();

        if (!response) {
            throw new ApiError({ statusCode: 500, message: "Error saving video to the database." });
        }

        return res.status(200).json(
            new ApiResponse({
                data: response,
                message: "Video uploaded successfully."
            })
        )
    });

    getVideoById = asyncHandler(async (req, res) => {
        const { videoID } = req.params;

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError({ statusCode: 404, message: "Video not found." });
        }

        return res.status(200).json(
            new ApiResponse({
                data: video,
                message: "Video retrieved successfully."
            })
        )
    });

    updateVideo = asyncHandler(async (req, res) => {
        const { videoID } = req.params;
        const { title, description } = req.body;

        const localThumbnailPath = req.file?.path;
        console.log(localThumbnailPath);

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError({ statusCode: 404, message: "Video not found." });
        }

        if (title) {
            video.title = title;
        }

        if (description) {
            video.description = description;
        }

        if (localThumbnailPath) {
            // Deleting the previous thumbnail from cloudinary
            const oldThumbnail = video.thumbnail.split("/").pop().split(".")[0];
            const deleteResponse = await deleteFromCloudinary(oldThumbnail);

            if (deleteResponse.result !== "ok") {
                throw new ApiError({ statusCode: 500, message: "Error deleting old thumbnail." });
            }

            const newThumbnail = await uploadOnCloudinary(localThumbnailPath);
            if (!newThumbnail) {
                throw new ApiError({ statusCode: 500, message: "Error uploading new thumbnail." });
            }
            video.thumbnail = newThumbnail.url;
        }

        const response = await video.save();

        if (!response) {
            throw new ApiError({ statusCode: 500, message: "Error updating video." });
        }

        return res.status(200).json(
            new ApiResponse({
                data: response,
                message: "Video updated successfully."
            })
        )
    });

    deleteVideo = asyncHandler(async (req, res) => {
        const { videoID } = req.params;

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError({ statusCode: 404, message: "Video not found." });
        }

        // Deleting the video file and thumbnail from cloudinary
        const videoName = video.videoFile.split("/").pop().split(".")[0];
        const thumbnailName = video.thumbnail.split("/").pop().split(".")[0];

        console.log(videoName, thumbnailName);

        const videoDeleteResponse = await deleteFromCloudinary(videoName, "video");
        const thumbnailDeleteResponse = await deleteFromCloudinary(thumbnailName);

        if (videoDeleteResponse.result !== "ok" || thumbnailDeleteResponse.result !== "ok") {
            throw new ApiError({ statusCode: 500, message: "Error deleting video or thumbnail." });
        }

        const response = await Video.findByIdAndDelete(videoID);

        if (!response) {
            throw new ApiError({ statusCode: 500, message: "Error deleting video." });
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Video deleted successfully."
            })
        )

    });

    togglePublishStatus = asyncHandler(async (req, res) => {
        const { videoID } = req.params;

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError({ statusCode: 404, message: "Video not found." });
        }

        video.isPublished = !video.isPublished;

        const response = await video.save();

        if (!response) {
            throw new ApiError({ statusCode: 500, message: "Error updating video." });
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Video publish status updated successfully."
            })
        )
    });
}

const videoFunctions = new VideoFunctions();

export default videoFunctions;