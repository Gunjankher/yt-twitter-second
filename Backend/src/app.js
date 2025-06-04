import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'


const app = express()


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "https://images.unsplash.com", "data:"],
      connectSrc: [
        "'self'",
        "blob:",
        "https://yt-twitter-second-dd98.vercel.app",
      ],
    },
  })
);

  

const allowedOrigins = [
  'https://yt-twitter-second-dd98.vercel.app/',
    // 'http://localhost:5173',
    // 'https://youtube-frontend-olive.vercel.app',
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended : true , limit :"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// router 

import userRouter from './routes/user.router.js'
import videoRouter from './routes/video.route.js'
import likeRouter from './routes/like.router.js'
import commentRouter from'./routes/comment.router.js'
import tweetRouter from './routes/tweet.router.js'
import playlistRouter from './routes/playlist.router.js'
// import healthRouter from './routes/healthcheck.router.js' 
import subscripitonRouter from './routes/subscription.router.js'
import dashboardRouter from './routes/dashboard.router.js'

// Route Declaraion 

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/playlist",playlistRouter)
// app.use("/api/v1/healthcheck",healthRouter)
app.use("/api/v1/subscriptions",subscripitonRouter)
app.use("/api/v1/dashboard",dashboardRouter)





export {app}