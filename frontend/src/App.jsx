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
import ActiveRoomsPage from './pages/ActiveRoomsPage'
import PublicProfilePage from './pages/PublicProfilePage'

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
		if (loading) return;

		// 1. Define Route Categories
		const authOnlyRoutes = ['/login', '/signup']; // Only for GUESTS (redirects members to home)
		const onboardingRoutes = ['/select-tracks', '/select-artists'];
		const universalRoutes = ['/about', '/spotify-success']; // Accessible by EVERYONE

		const isAuthOnlyRoute = authOnlyRoutes.includes(location.pathname);
		const isOnboardingRoute = onboardingRoutes.includes(location.pathname);
		const isUniversalRoute = universalRoutes.includes(location.pathname);

		// 2. Logic Flow
		if (isAuthenticated) {
			// --- LOGGED IN USER ---
			const isOnboardingComplete = user.onboardingStatus !== "pending_music";

			if (isOnboardingComplete) {
				// User is done with setup.
				// Prevent them from visiting Login/Signup pages, but ALLOW About page.
				if (isAuthOnlyRoute || isOnboardingRoute) {
					// console.log("User is onboarded, redirecting to home...");
					navigate('/');
				}
			} else {
				// User needs to finish onboarding. Force them there unless they are on an allowed universal page.
				if (!isOnboardingRoute && !isUniversalRoute) {
					// console.log("User is pending onboarding, redirecting to select-tracks...");
					navigate('/select-tracks');
				}
			}
		} else {
			// --- GUEST USER ---
			// If they try to visit a private page (not auth-only, not universal), kick them to login.
			if (!isAuthOnlyRoute && !isUniversalRoute) {
				// console.log("User is not authenticated, redirecting to login...");
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
					<Route path='/rooms/active' element={<ActiveRoomsPage />} />
					<Route path='/rooms/:code' element={<RoomPage />} />
					<Route path='/create-room' element={<CreateRoomPage />} />


					<Route path='/connections' element={<ConnectionsPage />} />
					<Route path='/requests' element={<RequestsPage />} />
					<Route path="/profile/:username" element={<PublicProfilePage />} />
					<Route path='/about' element={<AboutPage />} />
				</Routes>
			</Layout>
		</>
	)
}

export default App
