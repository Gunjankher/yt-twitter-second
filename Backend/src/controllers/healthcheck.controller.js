import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { asyncHandlar } from "../utilis/asyncHandlar.js";

const healthcheck = asyncHandlar(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { message: "Everything is O.K" }, "ok"));  // Fixed quote here
});


export { healthcheck };
