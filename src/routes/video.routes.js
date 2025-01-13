import { Router } from "express";
import videoFunctions from "../controllers/video.controller.js";
import userVerification from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.use(userVerification);

// Publish a video
router
    .route("/")
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        videoFunctions.publishVideo
    );


router
    .route("/:videoID")
    .get(videoFunctions.getVideoById)
    .delete(videoFunctions.deleteVideo)
    .patch(upload.single("thumbnail"), videoFunctions.updateVideo);

router.route("/toggle-publish/:videoID").patch(videoFunctions.togglePublishStatus);

export default router;