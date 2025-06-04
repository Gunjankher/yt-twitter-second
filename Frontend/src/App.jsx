 import { useEffect } from 'react';
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "./store/Slices/authSlice";
import { Suspense, lazy } from "react";
import Loader from "./components/Loader"; // Simple loading spinner

// Lazy-loaded route components
const Layout = lazy(() => import('./Layout'));
const AuthLayout = lazy(() => import('./components/AuthLayout'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./components/Login'));
const SignUp = lazy(() => import('./components/Signup'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const LikedVideos = lazy(() => import('./pages/LikedVidoes'));
const History = lazy(() => import('./pages/History'));
const Channel = lazy(() => import('./pages/Channel/Channel'));
const ChannelVideos = lazy(() => import('./pages/Channel/ChannelVideos'));
const ChannelSubscribers = lazy(() => import('./pages/Channel/ChannelSubscribers'));
const ChannelPlaylist = lazy(() => import('./pages/Channel/ChannelPlaylist'));
const ChannelTweets = lazy(() => import('./pages/Channel/ChannelTweets'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EditChannel = lazy(() => import('./pages/EditChannel'));
const EditPersonalInfo = lazy(() => import('./components/EditPersonalInfo'));
const ChangePassword = lazy(() => import('./components/ChangePassword'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));
const MySubscriptions = lazy(() => import('./pages/MySubscription'));
const SearchVideos = lazy(() => import('./pages/SearchVideos'));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route
              index
              element={
                <AuthLayout authentication={false}>
                  <HomePage />
                </AuthLayout>
              }
            />
            <Route
              path="login"
              element={
                <AuthLayout authentication={false}>
                  <Login />
                </AuthLayout>
              }
            />
            <Route
              path="signup"
              element={
                <AuthLayout authentication={false}>
                  <SignUp />
                </AuthLayout>
              }
            />
            <Route
              path="terms&conditions"
              element={
                <AuthLayout authentication={false}>
                  <TermsAndConditions />
                </AuthLayout>
              }
            />
            <Route
              path="search/:query"
              element={
                <AuthLayout authentication={false}>
                  <SearchVideos />
                </AuthLayout>
              }
            />

            {/* Protected Routes */}
            <Route
              path="history"
              element={
                <AuthLayout authentication>
                  <History />
                </AuthLayout>
              }
            />
            <Route
              path="liked-videos"
              element={
                <AuthLayout authentication>
                  <LikedVideos />
                </AuthLayout>
              }
            />
            <Route
              path="subscriptions"
              element={
                <AuthLayout authentication>
                  <MySubscriptions />
                </AuthLayout>
              }
            />
            <Route
              path="collections"
              element={
                <AuthLayout authentication>
                  <AdminDashboard />
                </AuthLayout>
              }
            />
            <Route
              path="watch/:videoId"
              element={
                <AuthLayout authentication>
                  <VideoDetail />
                </AuthLayout>
              }
            />

            {/* Channel Routes with Nested Routes */}
            <Route
              path="channel/:username"
              element={
                <AuthLayout authentication>
                  <Channel />
                </AuthLayout>
              }
            >
              <Route
                path="videos"
                element={
                  <AuthLayout authentication>
                    <ChannelVideos />
                  </AuthLayout>
                }
              />
              <Route
                path="playlists"
                element={
                  <AuthLayout authentication>
                    <ChannelPlaylist />
                  </AuthLayout>
                }
              />
              <Route
                path="tweets"
                element={
                  <AuthLayout authentication>
                    <ChannelTweets />
                  </AuthLayout>
                }
              />
              <Route
                path="subscribed"
                element={
                  <AuthLayout authentication={false}>
                    <ChannelSubscribers />
                  </AuthLayout>
                }
              />
            </Route>

            {/* Edit Channel Routes with Nested Personal Info and Password Routes */}
            <Route
              path="edit"
              element={
                <AuthLayout authentication>
                  <EditChannel />
                </AuthLayout>
              }
            >
              <Route
                path="personalInfo"
                element={
                  <AuthLayout authentication>
                    <EditPersonalInfo />
                  </AuthLayout>
                }
              />
              <Route
                path="password"
                element={
                  <AuthLayout authentication>
                    <ChangePassword />
                  </AuthLayout>
                }
              />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        reverseOrder={true}
        toastOptions={{
          error: { style: { borderRadius: "0", color: "red" } },
          success: { style: { borderRadius: "0", color: "green" } },
          duration: 2000,
        }}
      />
    </>
  );
}

export default App;
