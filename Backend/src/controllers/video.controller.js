import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utilis/cloudinary.js";
import { User } from "../models/user.model.js";





const getAllVideos = asyncHandlar(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    console.log(userId);
    const pipeline = [];

    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'
    
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"] //search only on title, desc
                }
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: true } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});


const getVideoById = asyncHandlar(async (req, res) => {
    const { videoId } = req.params;
    // let userId = req.body;
    
    // userId = new mongoose.Types.ObjectId(userId)
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
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
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

     // add this video to user watch history
     await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
});



const publishVideo = asyncHandlar(async(req,res)=>{

   console.log('user for publsih vidreo ' ,req.user);
   

try {
    const {title,description} = req.body
    
    if([title,description].some((field)=>field.trim()===0)){
        throw new ApiError(401,`All Fields are Required`)
    }
    


    if (!req.user?._id) {
        throw new ApiError(401, 'Unauthorized: User not authenticated');
      }

     const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    
    if(!videoFileLocalPath){
    throw new ApiError(400, `videoLocalpath is required`)
    }
    if(!thumbnailLocalPath){
    throw new ApiError(400, `thumbnailLocalPath is required`)
    }
    
    
    
      const videoFile = await uploadOnCloudinary(videoFileLocalPath)
      const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
      if(!videoFile){
        throw new ApiError(400, `videoFile is required`)
      }
      if(!thumbnail){
        throw new ApiError(400, ` thumbnail is required`)
      }
    
    
      const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner:req.user?._id,
        isPublished: false
    });
    
     const videoUploaded = await Video.findById(video._id)
    
    
    if(!videoUploaded){
        throw new ApiError(400, `Uploading failed please try again`)
    }
    
    return res
            .status(200)
            .json(new ApiResponse(200, video, "Video uploaded successfully"));
    
} catch (error) {
    console.error(`Error while Publishing video`,error);
    
}
})



const updateVideo = asyncHandlar(async(req,res)=>{
console.log(`user`, req.user);

console.log(`user which was undefiend`, req.user);
console.log('Uploaded file firdt tome :', req.file);

try {
    const {title,description} = req.body
    const {videoId} = req.params
    
    if([title,description].some((field)=>field?.trim()===0)){
        throw new ApiError(401,`All Fields are Required`)
    }
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    
     const video = await Video.findById(videoId)
    
    
     if (!video) {
        throw new ApiError(404, 'Video not found');
      }
  
      if (!video.owner) {
        throw new ApiError(400, 'Video owner information is missing');
      }
     
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

    
    
    
    const thumbnailToDelete = video.thumbnail.public_id
    
    const thumbnailLocalPath = req.file?.path
    
    
    
    if(!thumbnailLocalPath){
        throw new ApiError(400, `thumbnailLocalPath is required`)
        }
        
    
     const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if(!thumbnail){
        throw new ApiError(400, `cannot found thumbnail`)
    }
    
     const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set :{
                title,
                description,
                thumbnail :{
    public_id :thumbnail.public_id,
    url:thumbnail.url
                }
                }
            },
        {new :true}
     )
    
    
    
    
    if(updatedVideo){
   await  deleteOnCloudinary(thumbnailToDelete)
    }
    
    return res
            .status(200)
            .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
    
    
} catch (error) {
    console.error(`cannot Update Video`, error);
    
}
})







const deleteVideo = asyncHandlar(async(req,res)=>{
    
    
   
    
    try {

        const {videoId} = req.params
        
       
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId");
        }
        
         const video = await Video.findById(videoId)
        
        
         if (!video) {
            throw new ApiError(404, 'Video not found');
          }
      
          if (!video.owner) {
            throw new ApiError(400, 'Video owner information is missing');
          }
         
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't edit this video as you are not the owner"
            );
        }
    
       const videoDeleted =  await Video.findByIdAndDelete(video?._id)
        
        if(!videoDeleted){
            throw new ApiError(400,`Failed to delete the video pls try again`)
        }
        
await deleteOnCloudinary(video.thumbnail.public_id)
await deleteOnCloudinary(video.videoFile.public_id,"video")



        return res
                .status(200)
                .json(new ApiResponse(200, "Video deleted successfully"));
        
        
    } catch (error) {
        console.error(`cannot Update Video`, error);
        
    }
    })
    
    
    const isTogglePublished = asyncHandlar(async(req,res)=>{
        const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
    })





export {
    publishVideo,
    updateVideo,
    deleteVideo,
    isTogglePublished,
    getAllVideos,
    getVideoById
}