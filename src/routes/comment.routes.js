import commentFunctions from "../controllers/comment.controller.js";
import userVerification from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(userVerification);

// Add a comment and get all comments for a video
router.route("/:videoID").post(upload.none(), commentFunctions.addComment).get(commentFunctions.getAllVideoComments);

router.route("/:commentID").patch(upload.none(), commentFunctions.updateComment).delete(commentFunctions.deleteComment);

export default router;