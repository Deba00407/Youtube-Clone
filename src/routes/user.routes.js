import userFunctions from '../controllers/user.controller.js';
import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js'
import userVerification from '../middlewares/auth.middlewares.js'

const router = Router();

router.route('/register').post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ])
    , userFunctions.registerUser
);

router.route('/login').post(userFunctions.loginUser);

// Secured routes
router.route('/logout').post(userVerification, userFunctions.logoutUser);
router.route('/refresh-token').post(userFunctions.refreshAccessToken);
router.route('/update-password').post(userVerification, userFunctions.updatePassword);
router.route('/userProfile').get(userVerification, userFunctions.getUserDetails);

router.route('/update-avatar').post(userVerification, upload.single('avatar'), userFunctions.updateAvatar);

router.route('/update-cover-image').post(userVerification, upload.single('coverImage'), userFunctions.updateCoverImage);

router.route('/:username').get(userVerification, userFunctions.getUserChannelProfile)

router.route('/watchHistory').get(userVerification, userFunctions.getUserWatchHistory)
export default router;