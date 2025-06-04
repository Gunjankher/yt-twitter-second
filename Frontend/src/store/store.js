import {configureStore} from '@reduxjs/toolkit'
import userSliceReducer from './Slices/userSlice.js'
import authSliceReducer from './Slices/authSlice.js'
import commentSliceReducer from './Slices/commentSlice.js'
import likeSlice from './Slices/likeSlice.js'
import playlistSlice from './Slices/playlistSlice.js'
import tweetSlice from "./Slices/tweetSlice.js";
import dashboardSlice from "./Slices/dashboard.js";
import videoSliceReducer from "./Slices/videoSlice.js";
import subscriptionSlice from "./Slices/subscripiton.js";


const store = configureStore({
reducer :{
    user:userSliceReducer,
    auth:authSliceReducer,
    comment:commentSliceReducer,
    video: videoSliceReducer,
    subscription: subscriptionSlice,
    like: likeSlice,
    tweet: tweetSlice,
    dashboard: dashboardSlice,
    playlist: playlistSlice
}
})


export default store