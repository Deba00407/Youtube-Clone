import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Comment from "../models/comment.models.js"
import { ApiResponse } from "../utils/apiResponse.js";
import Video from "../models/video.models.js";
import mongoose from "mongoose";


class CommentFunctions {
    addComment = asyncHandler(async (req, res) => {
        const { videoID } = req.params;
        const { content } = req.body;

        if (content?.trim() === "") {
            throw new ApiError({ statusCode: 400, message: "Comment cannot be empty" });
        }

        // Add comment to database
        const newComment = await Comment.create({
            content: content.trim(),
            owner: req.user.id,
            video: videoID
        })

        const response = await newComment.save();

        const addedComment = await Comment.findById(response._id)

        if (!addedComment) {
            throw new ApiError({ statusCode: 400, message: "Error adding the comment" });
        }

        res.status(200).json(
            new ApiResponse({
                data: addedComment,
                message: "Comment added succeessfully"
            })
        )

    });

    updateComment = asyncHandler(async (req, res) => {
        const { commentID } = req.params;
        const { content } = req.body;

        if (content?.trim() === "") {
            throw new ApiError({ statusCode: 400, message: "Comment cannot be empty" });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentID,
            { content: content.trim() },
            { new: true }
        );

        if (!updatedComment) {
            throw new ApiError({ statusCode: 400, message: "Error updating the comment" });
        }

        return res.status(200).json(
            new ApiResponse({
                data: updatedComment,
                message: "Comment updated successfully"
            })
        )
    });

    deleteComment = asyncHandler(async (req, res) => {
        const { commentID } = req.params;

        const exisitingComment = await Comment.findByIdAndDelete(commentID);

        if (!exisitingComment) {
            throw new ApiError({ statusCode: 400, message: "Error deleting the comment" });
        }

        return res.status(200).json(
            new ApiResponse({
                message: "Comment deleted successfully"
            })
        )
    });

    getAllVideoComments = asyncHandler(async (req, res) => {
        const { videoID } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 30;


        const comments = await Video.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(`${videoID}`) } },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments"
                }
            },
            {
                $addFields: {
                    totalComments: { $size: "$comments" },
                    comments: {
                        $slice: ["$comments", (page - 1) * limit, limit]
                    }
                }
            },
            {
                $project: {
                    comments: 1,
                    totalComments: 1
                }
            }
        ])

        if (!comments) {
            throw new ApiError({ statusCode: 404, message: "No comments found" });
        }

        return res.status(200).json(
            new ApiResponse({
                data: comments,
                message: "Comments retrieved successfully"
            })
        )

    });
}

const commentFunctions = new CommentFunctions();

export default commentFunctions;