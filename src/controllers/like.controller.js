import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.models.js";
import Tweet from "../models/tweet.models.js";
import Comment from "../models/comment.models.js";
import Like from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

class LikeFunctions {
    toggleVideoLike = asyncHandler(async (req, res) => {
        const { videoID } = req.params;
        const owner = req.user?.id;

        const video = await Video.findById(videoID);

        if (!video) {
            throw new ApiError({
                statusCode: 404,
                message: "Video not found"
            })
        }

        const like = new Like({
            video: videoID,
            likedBy: owner
        });

        const saveResponse = await like.save();

        if (!saveResponse) {
            throw new ApiError({
                statusCode: 400,
                message: "Failed to save video like to database"
            })
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Video liked successfully",
            })
        )
    });

    toggleCommentLike = asyncHandler(async (req, res) => {
        const { commentID } = req.params;
        const owner = req.user?.id;

        const comment = await Comment.findById(commentID);

        if (!comment) {
            throw new ApiError({
                statusCode: 404,
                message: "Comment not found"
            })
        }

        const like = new Like({
            comment: commentID,
            likedBy: owner
        });

        const saveResponse = await like.save();

        if (!saveResponse) {
            throw new ApiError({
                statusCode: 400,
                message: "Failed to save comment like to database"
            })
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Comment liked successfully",
            })
        )
    });

    toggleTweetLike = asyncHandler(async (req, res) => {
        const { tweetID } = req.params;
        const owner = req.user?.id;

        const tweet = await Tweet.findById(tweetID);

        if (!tweet) {
            throw new ApiError({
                statusCode: 404,
                message: "Tweet not found"
            })
        }

        const like = new Like({
            tweet: tweetID,
            likedBy: owner
        });

        const saveResponse = await like.save();

        if (!saveResponse) {
            throw new ApiError({
                statusCode: 400,
                message: "Failed to save tweet like to database"
            })
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Tweet liked successfully",
            })
        )

    });

    getAllUserLikedVideos = asyncHandler(async (req, res) => {
        const owner = req.user?.id;

        const user = await User.findById(owner);

        if (!user) {
            throw new ApiError({
                statusCode: 404,
                message: "User not found"
            })
        }

        const response = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(String(owner)) }
            },

            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "likedBy",
                    as: "likedVideos",

                    pipeline: [
                        {
                            $match: { video: { $exists: true } }
                        },
                        {
                            $lookup: {
                                from: "videos",
                                localField: "video",
                                foreignField: "_id",
                                as: "video"
                            }
                        },
                        {
                            $unwind: "$video"
                        },
                        {
                            $project: {
                                _id: 0,
                                video: 1
                            }
                        }
                    ]
                }
            },

            {
                $project: {
                    _id: 1,
                    likedVideos: 1,
                    username: 1
                }
            }
        ]);

        return res.status(200).json(
            new ApiResponse({
                message: "User liked videos fetched successfully",
                data: response
            })
        )
    });
}

const likeFunctions = new LikeFunctions();

export default likeFunctions;
