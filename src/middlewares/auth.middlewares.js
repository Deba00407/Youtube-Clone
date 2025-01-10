import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import accessDetails from "../../config.js"
import { User } from "../models/user.models.js";

// req has access to all cookies due to cookie-parser middleware
const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

        if (!accessToken) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized request" });
        }

        const decodedToken = jwt.verify(accessToken, accessDetails.accessTokenSecret)

        const user = await User.findById(decodedToken?.id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError({ statusCode: 401, message: "Invalid access token" });
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError({ statusCode: 401, message: "Invalid access token" });
    }
});

export default verifyJWT;