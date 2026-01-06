import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './components/Layout'


// importing pages
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SpotifySuccess from './pages/SpotifySucess'
import SelectTracksPage from './pages/SelectTracksPage'
import SelectArtistsPage from './pages/SelectArtistsPage'
import UserProfilePage from './pages/UserProfilePage'
import UserProfileUpdatePage from './pages/UserProfileUpdatePage'
import ConnectionsPage from './pages/ConnectionsPage'
import MusicTasteEditPage from './pages/MusicTasteEditPage'
import RoomPage from './pages/RoomPage'
import CreateRoomPage from './pages/CreateRoomPage'

// importing thunk functions
import { checkAuthStatus } from './features/user/userThunks'
import RequestsPage from './pages/RequestsPage'


function App() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the necessary state from your Redux store
  const { user, isAuthenticated, loading } = useSelector(state => state.user);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

    useEffect(() => {
    // Don't do anything while the initial auth check is running
    if (loading) {
      return;
    }

    const publicRoutes = ['/login', '/signup'];
    const onboardingRoutes = ['/select-tracks', '/select-artists'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    const isOnboardingRoute = onboardingRoutes.includes(location.pathname);

    if (isAuthenticated) {
      // --- User is LOGGED IN ---
      const isOnboardingComplete = user.onboardingStatus !== "pending_music";
      console.log(user.onboardingStatus);

      if (isOnboardingComplete) {
        // User is fully onboarded. If they are on a public or onboarding page, send them home.
        if (isPublicRoute || isOnboardingRoute) {
          console.log("User is onboarded, redirecting to home...");
          navigate('/');
        }
      } else {
        // User is logged in but has NOT completed onboarding.
        // Force them into the onboarding flow.
        if (!isOnboardingRoute) {
          console.log("User is pending onboarding, redirecting to select-tracks...");
          navigate('/select-tracks');
        }
      }
    } else {
      // --- User is NOT LOGGED IN ---
      // If they are trying to access any page that isn't public, redirect to login.
      if (!isPublicRoute && location.pathname !== '/spotify-success') {
        console.log("User is not authenticated, redirecting to login...");
        navigate('/login');
      }
    }
  }, [isAuthenticated, user, loading, navigate, location.pathname]);


  return (
    <>
      <Layout>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignupPage />} />
          <Route path='/spotify-success' element={<SpotifySuccess />} />
          <Route path='/select-tracks' element={< SelectTracksPage />} />
          <Route path='/select-artists' element={< SelectArtistsPage />} />
          <Route path='/profile/me' element={<UserProfilePage />} />
          <Route path='/profile/me' element={<UserProfilePage />} />
          <Route path='/profile/edit' element={<UserProfileUpdatePage />} />
          <Route path='/music/edit' element={<MusicTasteEditPage />} />
          <Route path='/rooms/:code' element={<RoomPage />} />
          <Route path='/create-room' element={<CreateRoomPage />} />


          <Route path='/connections' element={<ConnectionsPage />} />
          <Route path='/requests' element={<RequestsPage />} />
          <Route path='/about' element={<AboutPage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
