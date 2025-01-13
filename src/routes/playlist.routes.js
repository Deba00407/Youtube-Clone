import { Router } from "express";
import PlaylistFunctions from "../controllers/playlist.controller.js";
import userVerification from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(userVerification);

// Creating a playlist
router.post("/", upload.none(), PlaylistFunctions.createPlaylist);

// Getting all playlists of a user
router.get("/:userID", upload.none(), PlaylistFunctions.getUserPlaylists);

// Adding a video to a playlist
router.route("/add/:videoID/:playlistID").patch(PlaylistFunctions.addVideoToPlaylist);

// Removing a video from a playlist
router.route("/remove/:videoID/:playlistID").patch(PlaylistFunctions.removeVideoFromPlaylist);

// Deleting, updating and fetching a playlist by id
router.route("/:playlistID").patch(upload.none(), PlaylistFunctions.updatePlaylist).delete(PlaylistFunctions.deletePlaylist);
router.route("/getPlaylist/:playlistID").get(PlaylistFunctions.getPlaylistByID);


export default router;