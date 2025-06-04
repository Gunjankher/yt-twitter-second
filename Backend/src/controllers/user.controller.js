import { asyncHandlar } from "../utilis/asyncHandlar.js";
import { ApiError } from "../utilis/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utilis/cloudinary.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import jwt from "jsonwebtoken";
import { json } from "express";
import mongoose from "mongoose";

const generateAccessTokenAndRefeshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      401,
      "Something went Wrong while Generating Access and Refesh Token ",
    );
  }
};

const registerUser = asyncHandlar(async (req, res) => {
  // get user details from frontend
  // validation- not empty
  // check if user already exits
  // check for images and avatar
  // upload them at cloudinary
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creation
  // return response

  //    (1) getting the data from user
  const { fullName, email, username, password } = req.body;
  console.log("email", email);

  // (2)  validation - not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  // (3) check if user already exits
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or usename already exists");
  }

  // (4) check for images and avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path
  //   console.log(req.files);

  // handling the coverImage

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  //(5) upload them at cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Image is Must required");
  }

  // (6) create user object and create entry in Database
  // (7) remove password and refresh token field
  // (8) check for user Creation

  const user = await User.create({
    fullName,
    password,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went wrong while registering the  User");
  }

  // (9) return response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandlar(async (req, res) => {
  // req data from body
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  // (1) req data from body

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required.");
  }

  // (2) email or username
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // (3) check for password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Password is invalid ");
  }

  // (4) Access and Refesh token  and method of generating is on above the code
  const { accessToken, refreshToken } = await generateAccessTokenAndRefeshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if(loggedInUser){
    console.log(`he is in`);
    
  }
  // (5) send cookie

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ true only in prod
    sameSite: "none", // ✅ allows cross-origin cookies
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },

        "User Logged in SuccessFully",
      ),
    );
});

const logoutUser = asyncHandlar(async (req, res) => {
  

  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},

        "User Logged out SuccessFully",
      ),
    );
});

// refresh token api end point

const refreshAccessToken = asyncHandlar(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh Token is expired or used ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefeshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },

          "Access Token Refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandlar(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed SuccessFully"));
});

const getCurrentUser = asyncHandlar(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current User fatched SuccesFully"));
});

const updateAccountDetails = asyncHandlar(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError("Fullname and Email is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },

    {
      new: true,
    },
  ).select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))





});



const updateUserAvatar = asyncHandlar(async(req,res)=>{
 const avatarLocalPath = req.file?.path 

 if (!avatarLocalPath) {
  throw new ApiError(400, "Avatar file is missing")
}

const avatar = await  uploadOnCloudinary(avatarLocalPath)


if (!avatar.url) {
  throw new ApiError(400, "Error while uploading on avatar")
  
}


  const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    avatar: avatar.url
  },{new : true}
).select("-password")

return res
.status(200)
.json(
    new ApiResponse(200, user, "Avatar image updated successfully")
)
})

const updateUserCoverImage = asyncHandlar(async(req,res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing")
  }

  //TODO: delete old image - assignment


  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading on avatar")
      
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              coverImage: coverImage.url
          }
      },
      {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
      new ApiResponse(200, user, "Cover image updated successfully")
  )
})


const getUserChannelProfile = asyncHandlar(async(req,res)=>{

const {username} = req.params

 
if(!username?.trim()){
  throw new ApiError(401, "UserName is Missing")
}

 const channel =  await User.aggregate([


  // first Pipeline
{
  $match:{
    username : username?.toLowerCase()
  }
},


// Second pipline to get channel subscribers

{

  $lookup:{
    from : "subscriptions",
    localField:"_id",
    foreignField : "channel",
    as : "subscribers"
  }
},

// third pipeline to get channel he subscribed to 
{

  $lookup:{
    from : "subscriptions",
    localField:"_id",
    foreignField : "subscriber",
    as : "subscribedTo"
  }
},

// fourth pipeline to count the subscribers

{

$addFields :{
 subscribersCount :{
   $size : "$subscribers"
 },

 channelIsSubscribedCount :{
  $size : "$subscribedTo"
 },
 
 // checck if user is subscribe or not and give to the front end

isSubscribed :{
  $cond :{
    if : {$in:[req.user?._id, "$subscribers.subscriber"]},
    then : true,
    else :false
  }
}


}

},

// fifth pipeline 
{
  $project: {
      fullName: 1,
      username: 1,
      subscribersCount: 1,
      channelIsSubscribedCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1

  }
}


])



if (!channel?.length) {
  throw new ApiError(404, "channel does not exists")
}

return res
.status(200)
.json(
  new ApiResponse(200, channel[0], "User channel fetched successfully")
)


})


const getWatchHistory = asyncHandlar(async(req,res)=>{

  const user = await User.aggregate([

{
  $match :{
    _id: new mongoose.Types.ObjectId(req.user._id)
  }
},


{
  $lookup : {
    from : "videos",   // we are in user field
    localField : "watchHistory",
    foreignField: "_id",
    as : "watchHistory",
pipeline:[   
  {
    $lookup :{     // now we traveled to the videofield
      from : "users",
      localField : "owner",
      foreignField : "_id",
      as : "owner",
pipeline :[   // we travel to user field again  probabely
  
  {
    $project :{
      fullName : 1,
      username : 1,
      avatar : 1
    }
  },

]


    }
  },{
    $addFields :{
      owner : {
        $first : "$owner"
      }
    }
  }
]
  }
}


  ])


  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )

})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory
};
