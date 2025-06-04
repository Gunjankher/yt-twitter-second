import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";
import { Like } from "../models/like.model.js";

// const getVideoComments = asyncHandlar(async (req, res) => {
//   const { videoId } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   const video = await Video.findById(videoId);

//   if (!video) {
//     throw new ApiError(400, `Video Not Found`);
//   }

//   const commentsAggregate = Comment.aggregate([
//     {
//       $match: {
//         Video: new mongoose.Types.ObjectId(videoId),
//       },
//     },

//     // 1st Pipeline
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },

//     // 2nd PipeLine

//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "comment",
//         as: "likes",
//       },
//     },

//     {
//       $addFields: {
//         likesCount: {
//           $size: "$likes",
//         },
//         owner: {
//           $first: "$owner",
//         },

//         isLiked: {
//           $cond: {
//             if: { $in: [req.user?._id, "$likes.likedBy"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },

//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },

//     {
//       $project: {
//         content: 1,
//         createdAt: 1,
//         likesCount: 1,
//         owner: {
//           username: 1,
//           fullName: 1,
//           "avatar.url": 1,
//         },
//         isLiked: 1,
//       },
//     },
//   ]);

//   const options = {
//     page: parseInt(page, 10),
//     limit: parseInt(limit, 10),
//   };

//   const comments = await Comment.aggregatePaginate(commentsAggregate, options);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, comments, "Comments fetched Sucessfully"));
// });


const getVideoComments = asyncHandlar(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);

  if (!video) {
      throw new ApiError(404, "Video not found");
  }

  const commentsAggregate = Comment.aggregate([
      {
          $match: {
              video: new mongoose.Types.ObjectId(videoId)
          }
      },
      {
          $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner"
          }
      },
      {
          $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment",
              as: "likes"
          }
      },
      {
          $addFields: {
              likesCount: {
                  $size: "$likes"
              },
              owner: {
                  $first: "$owner"
              },
              isLiked: {
                  $cond: {
                      if: { $in: [req.user?._id, "$likes.likedBy"] },
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $sort: {
              createdAt: -1
          }
      },
      {
          $project: {
              content: 1,
              createdAt: 1,
              likesCount: 1,
              owner: {
                  username: 1,
                  fullName: 1,
                  "avatar.url": 1
              },
              isLiked: 1
          }
      }
  ]);

  const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
  };

  const comments = await Comment.aggregatePaginate(
      commentsAggregate,
      options
  );

  return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const  addComment = asyncHandlar(async (req, res) => {
  // get videoId and get req.body
  // find the video and check if video is there
  // then create comment
  // check if comment is there
  // return the response

  const { videoId } = req.params;
  const { content } = req.body;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video is not Found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, `Failed to add the new Comment pls try again`);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successFully"));
});

const updateComment = asyncHandlar(async (req, res) => {
  // get the commentid  from params and get req body content
  // find the comment by id
  // check if the user is owner or not
  // find and update the comment by $size

  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(404, "Content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(500, `no Comment Found`);
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only comment owner can edit thier comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    { new: true },
  );

  if (!updateComment) {
    throw new ApiError(500, "Failed to edit the comment pls try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment edited sucessfully"));
});

const deleteComment = asyncHandlar(async (req, res) => {
  // find the comment id and conditon it
  // find the id of comment id
  // check if the user is owner or not
  // find the id and delete
  // delete the like also with deleteMany

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not Found");
  }

  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, `only owner can delete their comment`);
  }

  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(), {commentId}`Comment Deleted Sucessfully`);
});

export { getVideoComments, addComment, updateComment, deleteComment };
