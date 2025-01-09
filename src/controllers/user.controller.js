import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js'
import { ApiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

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
            throw new ApiError({statusCode: 400, message: "User already exists"})
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
            coverImage: coverImage?.url || ""
        });
        await user.save();

        // Checking if user is created
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
        if (!createdUser) {
            throw new ApiError({statusCode: 500, message: "User not created"})
        }

        return res.status(201).json(
            new ApiResponse({
                data: createdUser,
                message: "User registered successfully"
            })
        );
    })

    
}

const userFunctions = new UserFunctions();

export default userFunctions;