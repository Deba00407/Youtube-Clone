import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import details from '../../config.js';

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
                $set: { refreshToken: "" },
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
}

const userFunctions = new UserFunctions();

export default userFunctions;