import { Router } from "express";
import tweetFunctions from "../controllers/tweet.controller.js";
import userVerification from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.use(userVerification);

// Create a tweet
router.route("/").post(
    upload.array("media", 10),
    tweetFunctions.createTweet
);

// Get all tweets of a user
router.route("/users/:userID").get(tweetFunctions.getUserTweets);

// Update and delete user tweet
router.route("/:tweetID").patch(upload.none(), tweetFunctions.updateTweet).delete(upload.none(), tweetFunctions.deleteTweet);

export default router;