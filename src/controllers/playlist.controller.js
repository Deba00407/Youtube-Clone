import asyncHandler from "../utils/asyncHandler.js";
import Playlist from "../models/playlist.models.js";
import Video from "../models/video.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

class PlayListFunctions {

    createPlaylist = asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        const owner = req.user?.id;

        const playlist = await Playlist({
            name: name,
            description: description,
            owner: owner,
            videos: []
        })

        const createdPlaylist = await playlist.save();

        if (!createdPlaylist) {
            throw new ApiError(400, 'Error creating playlist');
        }

        return res.status(200).json(
            new ApiResponse({
                data: createdPlaylist,
                message: 'Playlist created successfully'
            })
        )
    });

    getUserPlaylists = asyncHandler(async (req, res) => {
        const { userID } = req.params;
        const playlists = await Playlist.find({ owner: userID });

        if (playlists.length === 0) {
            throw new ApiError(404, 'No playlists found');
        }

        return res.status(200).json(
            new ApiResponse({
                data: playlists,
                message: 'Playlists fetched successfully'
            })
        )
    });

    addVideoToPlaylist = asyncHandler(async (req, res) => {
        const { playlistID, videoID } = req.params;
        const playlist = await Playlist.findById(playlistID);
        if (!playlist) {
            throw new ApiError(404, 'Playlist not found');
        }

        const video = await Video.findById(videoID);
        if (!video) {
            throw new ApiError(404, 'Video not found');
        }

        playlist.videos.push(videoID);
        const updatedPlaylist = await playlist.save();

        if (!updatedPlaylist) {
            throw new ApiError(400, 'Error adding video to playlist');
        }

        return res.status(200).json(
            new ApiResponse({
                message: 'Video added to playlist successfully'
            })
        )
    });

    getPlaylistByID = asyncHandler(async (req, res) => {
        const { playlistID } = req.params;
        console.log(playlistID);


        const playlist = await Playlist.findById(playlistID);

        if (!playlist) {
            throw new ApiError(404, 'Playlist not found');
        }

        return res.status(200).json(
            new ApiResponse({
                data: playlist,
                message: 'Playlist fetched successfully'
            })
        )
    });

    removeVideoFromPlaylist = asyncHandler(async (req, res) => {
        const { playlistID, videoID } = req.params;
        const playlist = await Playlist.findById(playlistID);
        if (!playlist) {
            throw new ApiError(404, 'Playlist not found');
        }

        const videoIndex = playlist.videos.indexOf(videoID);
        if (videoIndex === -1) {
            throw new ApiError(404, 'Video not found in playlist');
        }

        playlist.videos.splice(videoIndex, 1);
        const updatedPlaylist = await playlist.save();

        if (!updatedPlaylist) {
            throw new ApiError(400, 'Error removing video from playlist');
        }

        return res.status(200).json(
            new ApiResponse({
                message: 'Video removed from playlist successfully'
            })
        )
    });

    deletePlaylist = asyncHandler(async (req, res) => {
        const { playlistID } = req.params;
        const playlist = await Playlist.findById(playlistID);

        if (!playlist) {
            throw new ApiError(404, 'Playlist not found');
        }

        const response = await Playlist.findByIdAndDelete(playlistID);
        if (!response) {
            throw new ApiError(400, 'Error deleting playlist');
        }

        return res.status(200).json(
            new ApiResponse({
                message: 'Playlist deleted successfully'
            })
        )
    });

    updatePlaylist = asyncHandler(async (req, res) => {
        const { playlistID } = req.params;
        const { name, description } = req.body;

        const playlist = await Playlist.findById(playlistID);

        if (!playlist) {
            throw new ApiError(404, 'Playlist not found');
        }

        playlist.name = name;
        playlist.description = description;

        const updatedPlaylist = await playlist.save();

        if (!updatedPlaylist) {
            throw new ApiError(400, 'Error updating playlist');
        }

        return res.status(200).json(
            new ApiResponse({
                message: 'Playlist updated successfully'
            })
        )
    });

}

const playlistFunctions = new PlayListFunctions();

export default playlistFunctions;