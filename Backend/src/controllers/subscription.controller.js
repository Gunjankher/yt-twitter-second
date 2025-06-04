import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";
import { Subscription } from "../models/subscription.model.js";



const toggleSubscription = asyncHandlar(async(req,res)=>{
    // get the channel id for params
    // check object id 
    // find the channel by findone  subscriber , channel 
    // find find by id and delete subsciebed 
    // return res

    const { channelId } = req.params;
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "unsunscribed successfully"
                )
            );
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        );
    
})


const getUserChannelSubscribers = asyncHandlar(async(req,res)=>{
    // get the channel id 
    // check if that is valid obj id
    // aggregate the subscirbers 

    let { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    channelId = new mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        },
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedToSubscriber.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubscriber",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "subscribers fetched successfully"
            )
        );


})



// const getSubscribedChannels = asyncHandlar(async(req,res)=>{

//     const { subscriberId } = req.params;

//     const subscribedChannels = await Subscription.aggregate([
//         {
//             $match: {
//                 subscriber: new mongoose.Types.ObjectId(subscriberId),
//             },
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "channel",
//                 foreignField: "_id",
//                 as: "subscribedChannel",
//                 pipeline: [
//                     {
//                         $lookup: {
//                             from: "videos",
//                             localField: "_id",
//                             foreignField: "owner",
//                             as: "videos",
//                         },
//                     },
//                     {
//                         $addFields: {
//                             latestVideo: {
//                                 $last: "$videos",
//                             },
//                         },
//                     },
//                 ],
//             },
//         },
//         {
//             $unwind: "$subscribedChannel",
//         },
//         {
//             $project: {
//                 _id: 0,
//                 subscribedChannel: {
//                     _id: 1,
//                     username: 1,
//                     fullName: 1,
//                     "avatar.url": 1,
//                     latestVideo: {
//                         _id: 1,
//                         "videoFile.url": 1,
//                         "thumbnail.url": 1,
//                         owner: 1,
//                         title: 1,
//                         description: 1,
//                         duration: 1,
//                         createdAt: 1,
//                         views: 1
//                     },
//                 },
//             },
//         },
//     ]);

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 subscribedChannels,
//                 "subscribed channels fetched successfully"
//             )
//         );
// })

const getSubscribedChannels = asyncHandlar(async (req, res) => {
    const { subscriberId } = req.params;

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos",
                        },
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscribedChannel",
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
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
                subscribedChannels,
                "subscribed channels fetched successfully"
            )
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}