import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.models.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import details from '../../config.js';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // To directly update the refreshtoken without triggering the requirement for other fields to be filled

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError({ statusCode: 500, message: "Error generating tokens" })
    }
}

class UserFunctions {

    registerUser = asyncHandler(async (req, res) => {
        const { username, email, password, fullname } = req.body;

        // Validating user detail fields
        if (
            [username, fullname, email, password].some((field) => {
                return field?.trim() === ""
            })
        ) {
            throw new ApiError({ statusCode: 400, message: "All fields are required" })
        }

        // Searching for exisiting user by the same username or email
        const exisitingUser = await User.findOne({
            $or: [{ username }, { email }]
        })
        if (exisitingUser) {
            throw new ApiError({ statusCode: 400, message: "User already exists" })
        }

        // File handling
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        var avatar = "", coverImage = "";

        if (avatarLocalPath) {
            avatar = await uploadOnCloudinary(avatarLocalPath);
        }
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }

        // Saving user in  database
        const user = await new User({
            username: username.toLowerCase(),
            email,
            fullname,
            password,
            avatar: avatar.url,
            coverImage: coverImage.url
        });
        await user.save();

        // Checking if user is created
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
        if (!createdUser) {
            throw new ApiError({ statusCode: 500, message: "User not created" })
        }

        return res.status(201).json(
            new ApiResponse({
                data: createdUser,
                message: "User registered successfully"
            })
        );
    })

    loginUser = asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;

        if (!(username || email)) {
            throw new ApiError({ statusCode: 400, message: "Username or email is required" })
        }

        // Finding exisiting user
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!existingUser) {
            throw new ApiError({ statusCode: 404, message: "User not found" })
        }

        // Checking password
        const isPasswordValid = await existingUser.checkPassword(password);
        if (!isPasswordValid) {
            throw new ApiError({ statusCode: 401, message: "Password entered is invalid" })
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id)

        // Deselecting sensitive fields of the user before sending the response
        const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

        // Sending cookies
        const options = {
            httpOnly: true, // Makes cookies server modifiable only
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse({
                    data: { user: loggedInUser, accessToken, refreshToken },
                    message: "User logged in successfully"
                })
            )
    })

    logoutUser = asyncHandler(async (req, res) => {
        // As we have set the user in req in jwt verification middleware, we can directly access the user details

        const { id } = req.user.id;
        await User.findByIdAndUpdate(id,
            {
                $unset: {
                    refreshToken: 1
                },
            },
            { new: true }
        )

        // Clearing cookies
        const options = {
            httpOnly: true,
            secure: true
        }

        res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse({
                    statusCode: 200,
                    message: "User logged out successfully"
                })
            )
    })

    refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError({ statusCode: 400, message: "Refresh token is required" })
        }

        try {
            // Verifying the incoming refresh token with the one stored in database
            const decodedToken = jwt.verify(incomingRefreshToken, details.refreshTokenSecret)

            const user = await User.findById(decodedToken.id)
            if (!user) {
                throw new ApiError({ statusCode: 404, message: "Invalid refresh token" })
            }

            // Matching the refresh token
            if (user.refreshToken !== incomingRefreshToken) {
                throw new ApiError({ statusCode: 401, message: "Invalid refresh token" })
            }

            const options = {
                httpOnly: true,
                secure: true
            }

            const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

            return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newrefreshToken, options)
                .json(
                    new ApiResponse({
                        data: { accessToken, newrefreshToken },
                        message: "Access token refreshed successfully"
                    })
                )
        } catch (error) {
            throw new ApiError({ statusCode: 401, message: "Invalid refresh token" })
        }
    })

    updatePassword = asyncHandler(async (req, res) => {
        const id = req.user?.id;
        const { oldPassword, newPassword } = req.body;

        if (!id) {
            throw new ApiError({ statusCode: 400, message: "User id is missing" })
        }

        // checking if the new password is empty string
        if (
            [oldPassword, newPassword].some((field) => { return field?.trim() === "" })
        ) {
            throw new ApiError({ statusCode: 400, message: "All fields are required" })
        }

        const existingUser = await User.findById(id)
        if (!existingUser) {
            throw new ApiError({ statusCode: 404, message: "User not found" })
        }

        // Checking if the old password is correct
        const isPasswordValid = await existingUser.checkPassword(oldPassword)
        if (!isPasswordValid) {
            throw new ApiError({ statusCode: 401, message: "Old password is incorrect" })
        }

        // Updating the password
        existingUser.password = newPassword;
        await existingUser.save({ validateBeforeSave: false });

        return res.status(200)
            .json(
                new ApiResponse({
                    message: "Password updated successfully"
                })
            )
    })

    getUserDetails = asyncHandler(async (req, res) => {
        const user = req.user;
        res.status(200).json(new ApiResponse({
            data: user,
            message: "User details fetched successfully",
        }))
    })

    updateAvatar = asyncHandler(async (req, res) => {
        const id = req.user?.id;
        const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError({ statusCode: 400, message: "Avatar file is missing" })
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        const user = await User.findById(id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError({ statusCode: 404, message: "User not found" })
        }
        // If user is updating from the default avatar
        if (user.avatar == details.defaultAvatar) {
            user.avatar = avatar.url;
            await user.save({ validateBeforeSave: false });
        }

        // If user is updating from a custom avatar
        else {
            const publicId = user.avatar.split("/").pop().split(".")[0];
            const deleteResponse = await deleteFromCloudinary(publicId);
            if (deleteResponse) {
                user.avatar = avatar.url;
                await user.save({ validateBeforeSave: false });
            }
            else {
                throw new ApiError({ statusCode: 500, message: "Error updating avatar" })
            }
        }

        return res.status(200).json(
            new ApiResponse({
                data: user,
                message: "Avatar updated successfully"
            })
        )
    })

    updateCoverImage = asyncHandler(async (req, res) => {
        const id = req.user?.id;
        const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError({ statusCode: 400, message: "Cover image file is missing" })
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        const user = await User.findById(id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError({ statusCode: 404, message: "User not found" })
        }
        // If user is updating from the default cover image
        if (user.coverImage == details.defaultCoverImage) {
            user.coverImage = coverImage.url;
            await user.save({ validateBeforeSave: false });
        }

        // If user is updating from a custom cover image
        else {
            const publicId = user.coverImage.split("/").pop().split(".")[0];
            const deleteResponse = await deleteFromCloudinary(publicId);
            if (deleteResponse) {
                user.coverImage = coverImage.url;
                await user.save({ validateBeforeSave: false });
            }
            else {
                throw new ApiError({ statusCode: 500, message: "Error updating cover image" })
            }
        }

        return res.status(200).json(
            new ApiResponse({
                data: user,
                message: "Cover image updated successfully"
            })
        )
    })

    getUserChannelProfile = asyncHandler(async (req, res) => {
        const { username } = req.params;

        if (!username?.trim()) {
            throw new ApiError({ statusCode: 400, message: "Username is required" })
        }

        // Writing aggregation pipelines
        const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase() // Filtering out channel based on  username
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel", // Finding channel subsribers
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber", // Finding channel subscriptions
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" }, // Evaluating
                    subscribedToCount: { $size: "$subscribedTo" },

                    isSubscribed: { // Checking if the current user is subscribed to the channel
                        $cond: {
                            if: {
                                $in: [req.user?.id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            { // Deselecting sensitive fields before sending the response
                $project: {
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    subscribedToCount: 1,
                    avatar: 1,
                    coverImage: 1,
                    isSubscribed: 1
                }
            }
        ])

        if (channel.length === 0) {
            throw new ApiError({ statusCode: 404, message: "Channel not found" })
        }

        return res.status(200).json(
            new ApiResponse({
                data: channel[0],
                message: "Channel details fetched successfully"
            })
        )
    })

    getUserWatchHistory = asyncHandler(async (req, res) => {
        // We cant directly pass the user id from req.user as it is a string and we need to convert it to ObjectId

        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(`${req.user?.id}`)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",

                    // Nested lookup
                    pipeline: [
                        {
                            // Getting owner details of the video watched
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },

                        {
                            $addFields: {
                                owner: { $arrayElemAt: ["$owner", 0] }
                            }
                        }
                    ]
                }
            }
        ])

        return res.status(200).json(
            new ApiResponse({
                data: user[0].watchHistory,
                message: "Watch history fetched successfully"
            })
        )

    })
}

const userFunctions = new UserFunctions();

export default userFunctions;