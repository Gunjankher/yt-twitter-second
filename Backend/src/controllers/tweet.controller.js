import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";


const createTweet = asyncHandlar(async(req,res)=>{
    // get the content  from req.body
    // check the content
    // create the tweet 
    // return the response

    const {content} = req.body

    if(!content){
        throw new ApiError(400, 'no content found')
    }


    const tweet = await Tweet.create({
        content,
        owner :req.user?._id
    })

if(!tweet){
    throw new ApiError(404, `faied to create the tweet pls try again`)
}


return res
.status(200)
.json(new ApiResponse(200, createTweet, `crated tweet sucessfully`))

})



const updateTweet = asyncHandlar(async(req,res)=>{
    // get the tweet id
    // get the content from body
    // find the id from the findbyId,
    // check if the user is owner
    // findby id and update the tweet
    // return the response

const {tweetId} = req.params
const {content} = req.body

if(!content){
    throw new ApiError(400, `cant find the content in tweet`)
}

 const tweet = await Tweet.findById(tweetId)
 if(!tweet){
    throw new ApiError(404, `cant find the tweet`)
 }

 if(tweet?.owner?.toString()!== req.user?._id.toString()){
    throw new ApiError(404, `you can't edit this cuz you are not the error`)
 }


  const updateTweet = await Tweet.findByIdAndUpdate(
tweetId,
{
    $set:{
        content
    }
}

 )

if(!updateTweet){
    throw new ApiError(400, `failed to update tweet`)
}


res
.status(200)
.json(200, updateTweet,`Tweet updated Sucesfully`)


})


const deleteTweet = asyncHandlar(async(req,res)=>{
    //get the tweet id
    // check the tweet id
    // check if the user is owner or not 
    // find by id and delete the tweet 
    // delete the like by delete many 

const{tweetId} = req.params

if(!tweetId){
    throw new ApiError(400, "cant not Find the tweetId")
}


const tweet = await Tweet.findById(tweetId)


if(tweet?.owner?.toString() !== req.user?._id.toString()){
    throw new ApiError(400, `cant edit the tweet cuz you are not user`)
}


 await Tweet.findByIdAndDelete(tweetId)


 return res
 .status(200)
 .json(new ApiResponse(200, {tweetId}, "Tweet deleted sucesssFully"))
 
})


const getUserTweets = asyncHandlar(async(req,res)=>{

    // get the userId
    // check if it is a valid userId not 
    // join the pipeline 
    // return the response 

    const {userId} = req.params

if(!isValidObjectId(userId)){
throw new ApiError(400, "Invalid userId")
}


const tweets = await Tweet.aggregate([

    {
        $match :{
            owner :new mongoose.Types.ObjectId(userId)
        }
    },

{
    $lookup :{
        from :"users",
        localField :"owner",
        foreignField :"_id",
        as:"ownerDetails",
        pipeline :[
            {
                $project :{
                    username :1,
                    'avatar.url':1
                },
            }
        ]

    }
},


{
    $lookup :{
        from :"likes",
        localField : "_id",
        foreignField :"tweet",
        as :"likeDetails",
        pipeline :[
{
$project :{
    likedBy :1
}
}
        ]
    }
},

{
    $addFields: {
        likesCount: {
            $size: "$likeDetails",
        },
        ownerDetails: {
            $first: "$ownerDetails",
        },
        isLiked: {
            $cond: {
                if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                then: true,
                else: false
            }
        }
    },
},
{
    $sort: {
        createdAt: -1
    }
},
{
    $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1
    },
},

])


return res
.status(200)
.json(new ApiResponse(200, tweets, "Tweets fetched Sucessfuly"))

})


export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
}