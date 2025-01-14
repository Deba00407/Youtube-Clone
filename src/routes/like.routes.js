import { Router } from "express";
import likeFunctions from "../controllers/like.controller.js";
import userVerification from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/video/:videoID", userVerification, likeFunctions.toggleVideoLike);
router.post("/comment/:commentID", userVerification, likeFunctions.toggleCommentLike);
router.post("/tweet/:tweetID", userVerification, likeFunctions.toggleTweetLike);
router.get("/likedVideos", userVerification, likeFunctions.getAllUserLikedVideos);

export default router;