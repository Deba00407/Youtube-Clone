import Tweet from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


class TweetFunctions {

    createTweet = asyncHandler(async (req, res) => {
        // If the user wants to upload an image or a group of images
        const { content } = req.body;
        console.log(content);

        // Getting all files from the request and uploading them to cloudinary
        const tweetMedia = await Promise.all(
            req.files?.map(async (file) => {
                const localFilePath = file.path;
                const result = await uploadOnCloudinary(localFilePath);
                if (!result) {
                    res.status(500).json(
                        new ApiError({
                            statusCode: 500,
                            message: "Failed to upload media to Cloudinary"
                        })
                    );
                    throw new Error("Failed to upload media to Cloudinary"); // Ensure execution stops in case of an error
                }

                return {
                    mediaUrl: result.url
                };
            })
        );

        // Creating the tweet
        const tweet = await Tweet({
            content,
            owner: req.user._id,
            media: tweetMedia
        });

        const createdTweet = await tweet.save();
        if (!createdTweet) {
            res.status(500).json(
                new ApiError({
                    statusCode: 500,
                    message: "Failed to create tweet"
                })
            )
        }

        res.status(200).json(
            new ApiResponse({
                data: createdTweet,
                message: "Tweet created successfully"
            })
        )
    });

    getUserTweets = asyncHandler(async (req, res) => {
        const { userID } = req.params;

        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(`${userID}`)
                }
            },

            {
                $lookup: {
                    from: "tweets",
                    localField: "_id",
                    foreignField: "owner",
                    as: "tweets"
                }
            },

            {
                $addFields: {
                    tweetCount: {
                        $size: "$tweets"
                    },
                    tweets: {
                        $slice: ["$tweets", 0, 10]
                    }
                }
            },

            {
                $project: {
                    _id: 1,
                    username: 1,
                    tweetCount: 1,
                    tweets: 1
                }
            }
        ])

        if (!user) {
            res.status(404).json(
                new ApiError({
                    statusCode: 404,
                    message: "User not found"
                })
            )
        }

        res.status(200).json(
            new ApiResponse({
                data: user,
                message: "User tweets retrieved successfully"
            })
        )
    });

    updateTweet = asyncHandler(async (req, res) => {
        const { tweetID } = req.params;
        const { content } = req.body;

        // Validating the content
        if (content?.trim() === "") {
            throw new ApiError({ statusCode: 400, message: "Content cannot be empty" });
        }

        // Allowing user to only update the content of the tweet
        const tweet = await Tweet.findById(tweetID);

        if (!tweet) {
            throw new ApiError({ statusCode: 404, message: "Tweet not found" });
        }

        tweet.content = content;

        const updateTweet = await tweet.save({ validateBeforeSave: false });

        if (!updateTweet) {
            res.status(404).json(
                new ApiError({
                    statusCode: 404,
                    message: "Error updating tweet"
                })
            )
        }

        return res.status(200).json(
            new ApiResponse({
                data: updateTweet,
                message: "Tweet updated successfully"
            })
        )
    });

    deleteTweet = asyncHandler(async (req, res) => {
        const { tweetID } = req.params;

        const response = await Tweet.findByIdAndDelete(tweetID, { new: true });

        if (!response) {
            throw new ApiError({ statusCode: 404, message: "Tweet not found" });
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Tweet deleted successfully"
            })
        );
    });
}

const tweetFunctions = new TweetFunctions();

export default tweetFunctions;