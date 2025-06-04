import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserTweets } from "../../store/Slices/tweetSlice";
import { TweetAndComment, TweetsList } from "../../components/index";

function ChannelTweets() {
    const dispatch = useDispatch();
    const authId = useSelector((state) => state.auth?.userData?._id);
    const userId = useSelector((state) => state.user?.profileData?._id);
    const tweets = useSelector((state) => state.tweet?.tweets);

    console.log(`tweets`,tweets);
    

    // useEffect(() => {
    //     if (userId) dispatch(getUserTweets(userId));
    // }, [dispatch, userId]);

    useEffect(() => {
        const fetchTweets = async () => {
            if (userId) {
                await dispatch(getUserTweets(userId));
            }
        };
    
        fetchTweets();
    }, [dispatch, userId]);

    return (
        <>
            {authId === userId && <TweetAndComment tweet={true}/>}
            {tweets?.map((tweet,index) => (
                <TweetsList
                    key={tweet?._id || index}
                    avatar={tweet?.ownerDetails?.avatar?.url}
                    content={tweet?.content}
                    createdAt={tweet?.createdAt}
                    likesCount={tweet?.likesCount}
                    tweetId={tweet?._id}
                    username={tweet?.ownerDetails?.username}
                    isLiked={tweet?.isLiked}
                />
            ))}
        </>
    );
}

export default ChannelTweets;