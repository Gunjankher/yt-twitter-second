import mongoose, { isValidObjectId} from "mongoose";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandlar(async (req, res) => {
  const { videoId } = req.params;


  


  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndUpdate(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandlar(async (req, res) => {
  // take id from params
  // check if it is valid object id
  // check if comment is already liked
  // put the if  conditon to remove comment like and return
  // create like instance
  // return res

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid CommentId");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(400, new ApiResponse(200),"this is liked comment",{ isLiked: true });
});

const toggleTweetLike = asyncHandlar(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, `Invlaid TweetId`);
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, { tweetId, isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

// const getLikedVideos = asyncHandlar(async (req, res) => {
  
//   const likedVideosAggegate = await Like.aggregate([
//     {
//         $match: {
//             likedBy: new mongoose.Types.ObjectId(req.user?._id),
//         },
//     },
//     {
//         $lookup: {
//             from: "videos",
//             localField: "video",
//             foreignField: "_id",
//             as: "likedVideo",
//             pipeline: [
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "owner",
//                         foreignField: "_id",
//                         as: "ownerDetails",
//                     },
//                 },
//                 {
//                     $unwind: "$ownerDetails",
//                 },
//             ],
//         },
//     },
//     {
//         $unwind: "$likedVideo",
//     },
//     {
//         $sort: {
//             createdAt: -1,
//         },
//     },
//     {
//         $project: {
//             _id: 0,
//             likedVideo: {
//                 _id: 1,
//                 "videoFile.url": 1,
//                 "thumbnail.url": 1,
//                 owner: 1,
//                 title: 1,
//                 description: 1,
//                 views: 1,
//                 duration: 1,
//                 createdAt: 1,
//                 isPublished: 1,
//                 ownerDetails: {
//                     username: 1,
//                     fullName: 1,
//                     "avatar": 1,
//                 },
//             },
//         },
//     },
// ]);
    

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 likedVideosAggegate,
//                 "liked videos fetched successfully"
//             )
//         );


// })


const getLikedVideos = asyncHandlar(async (req,res) => {
  console.log("req.user:",req?.user?._id);
  const likedVideosAggegate = await Like.aggregate([
      {
          $match: {
              likedBy: new mongoose.Types.ObjectId(req.user?._id),
          },
      },
      {
          $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "likedVideo",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "ownerDetails",
                      },
                  },
                  {
                      $unwind: "$ownerDetails",
                  },
              ],
          },
      },
      {
          $unwind: "$likedVideo",
      },
      {
          $sort: {
              createdAt: -1,
          },
      },
      {
          $project: {
              _id: 0,
              likedVideo: {
                  _id: 1,
                  "videoFile.url": 1,
                  "thumbnail.url": 1,
                  owner: 1,
                  title: 1,
                  description: 1,
                  views: 1,
                  duration: 1,
                  createdAt: 1,
                  isPublished: 1,
                  ownerDetails: {
                      username: 1,
                      fullName: 1,
                      "avatar.url": 1,
                  },
              },
          },
      },
  ]);

  return res
      .status(200)
      .json(
          new ApiResponse(
              200,
              likedVideosAggegate,
              "liked videos fetched successfully"
          )
      );
});


export { toggleVideoLike, toggleCommentLike, toggleTweetLike,getLikedVideos };
