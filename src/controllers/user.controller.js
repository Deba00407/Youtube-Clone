import asyncHandler from '../utils/asyncHandler.js';

class UserFunctions {
    registerUser = asyncHandler(async (req, res, next) => {
        res.status(200).json({
            success: true,
            message: 'User registered successfully'
        })
    })
}

const userFunctions = new UserFunctions();

export default userFunctions;