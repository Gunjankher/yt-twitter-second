import { Router } from "express";
import {
    deleteVideo,
    isTogglePublished,
    publishVideo,
    updateVideo,
    getVideoById,
    getAllVideos
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Route for getting all videos and publishing a new video
router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishVideo
    );

// Route for publishing a new video (separate endpoint "/new")
router
    .route("/new")
    .post(
        verifyJWT,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishVideo
    );

// Route for getting, updating, or deleting a specific video by ID
router
    .route("/v/:videoId")
    .get(verifyJWT, getVideoById)
    .patch(
        verifyJWT,
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(
        verifyJWT,
        deleteVideo
    );

// Route for toggling the publish status of a video
router
    .route("/toggle/publish/:videoId")
    .patch(verifyJWT, isTogglePublished);

export default router;
