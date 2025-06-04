import { ApiError } from "../utilis/ApiError.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandlar(async(req,_,next)=>{

try {
    //  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","").trim()
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","").trim();
    // console.log("Cookies received in verifyJWT:", req.cookies);
    // console.log("this is token",token);
    
     if(!token){
        throw new ApiError(401, "Unatuhorized Request")
     }
    
      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
      // console.log('Decoded Token:', decodedToken); // Log the decoded token
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      )
      // console.log('User:', user); // Log the user
    
      if(!user){
        throw new ApiError(401, "Invalid Access Token")
      }
    
      req.user = user
      next()
      console.log(`this is user in auth`,req.user);
      
    
} catch (error) {
    throw new ApiError(401 , error.message || "Inavalid Access Token ")
}
})