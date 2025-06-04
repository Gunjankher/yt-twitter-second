import {Router} from 'express'
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getVideoComments,addComment,deleteComment,updateComment} from '../controllers/comment.controller.js'

const router = Router()

router.use(verifyJWT,upload.none())

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);



export default router