import React, { useState } from 'react'; // <-- 1. Import useState
import { useGetRecommendationsQuery, useSendConnectionRequestMutation, useGetUserProfileQuery } from "../features/social/socialApiSlice";
import UserCard from '../components/UserCard';
import MusicInterestPanel from '../components/MusicIntrestPanel';
import ActiveRoomsPanel from '../components/ActiveRoomsPanel';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/solid'; // For the new buttons

const HomePage = () => {
    // --- LOGIC SECTION (Almost no changes here) ---

    // 2. Add state to track the current card's index
    const [currentIndex, setCurrentIndex] = useState(0);
    const [overlayState, setOverlayState] = useState('none');
    const [isAnimating, setIsAnimating] = useState(false);

    const {
        data: recommendations,
        isLoading: isLoadingRecs, // Renamed from isLoading
        isError: isRecsError,     // Renamed from isError
    } = useGetRecommendationsQuery();

    const [sendConnectionRequest, { isLoading: isConnecting }] = useSendConnectionRequestMutation();

    // 3. Get the single user to display based on the current index
    const currentUser = recommendations?.[currentIndex];
    const currentUsername = recommendations?.[currentIndex]?.username;

    const {
        data: fullUser,
        isLoading: isLoadingProfile, // Renamed from isLoading
        isError: isProfileError,     // Renamed from isError
        error, // We can keep 'error' as is if we handle it carefully
    } = useGetUserProfileQuery(currentUsername, {
        skip: !currentUsername, // This is correct and very important!
    });

    const ANIMATION_DURATION = 300;

    // 4. Create a function to move to the next card
    const goToNextCard = () => {
        setOverlayState('none');
        setIsAnimating(false);
        setCurrentIndex(prevIndex => prevIndex + 1);
    };

    const handleSkip = () => {
        if (isAnimating) return; // Prevent double clicks
        setIsAnimating(true);
        setOverlayState('skip'); // Show red gradient

        setTimeout(() => {
            goToNextCard();
        }, ANIMATION_DURATION);
    };

    const handleConnect = async () => {
        if (isAnimating || !fullUser) return; // Prevent double clicks
        setIsAnimating(true);
        setOverlayState('like'); // Show green gradient

        try {
            await sendConnectionRequest(fullUser._id).unwrap();
            // Wait for animation to finish before moving to the next card
            setTimeout(() => {
                goToNextCard();
            }, ANIMATION_DURATION);
        } catch (err) {
            console.error('Failed to send connection request:', err);
            alert(err.data?.message || 'Could not send request.');
            // Reset state on failure
            setIsAnimating(false);
            setOverlayState('none');
        }
    };

    // --- RENDER SECTION (Only the success state JSX is changed) ---

    if (isLoadingRecs || isLoadingProfile) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (isRecsError || isProfileError) {
        return <div className="alert alert-error m-4">Error: {error.data?.message}</div>;
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8 md:px-6">

            {/* RESPONSIVE GRID DEFINITION:
                1. grid-cols-1: Default for Mobile/Tablet (Stacks vertically).
                2. lg:grid-cols-[...]: Switches to 3 columns only on Large screens.
                3. justify-items-center: Centers the card on Mobile/Tablet.
                4. lg:justify-between: Spreads the 3 panels apart on Desktop.
            */}
            <div className="grid grid-cols-1 lg:grid-cols-[22rem_28rem_22rem] gap-8 lg:gap-16 items-start justify-items-center lg:justify-between">

                {/* --- LEFT PANEL: Hidden on Mobile/Tablet --- */}
                <div className="hidden lg:block w-full sticky top-8 ml-auto">
                    <MusicInterestPanel />
                </div>


                {/* --- CENTER: User Card --- */}
                {/* max-w-md ensures it looks good on Tablet (doesn't stretch too wide). 
                    On lg, the grid column handles the width. */}
                <div className="flex flex-col items-center w-full max-w-md lg:max-w-full relative z-0">
                    {fullUser ? (
                        <div className="relative group w-full">
                            <UserCard user={fullUser} />

                            {/* --- BUTTONS --- 
                                Updates for Mobile:
                                1. opacity-100 lg:opacity-0: Always visible on mobile (no hover), fade on desktop.
                                2. left-4 / right-4: Inside the screen on mobile.
                                3. -left-16 / -right-16: Outside the card on desktop.
                            */}

                            {/* Skip Button (Left Inside) */}
                            <button
                                onClick={goToNextCard}
                                disabled={isConnecting}
                                className="absolute top-1/2 -translate-y-1/2 
                                            left-4 
                                            btn btn-circle btn-lg bg-base-100/90 backdrop-blur-sm shadow-xl z-20 border-none
                                            opacity-100 lg:opacity-0 lg:group-hover:opacity-100
                                            transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white"
                                aria-label="Skip"
                            >
                                <XMarkIcon className="h-8 w-8 text-error" />
                            </button>

                            {/* Connect Button (Right Inside) */}
                            <button
                                onClick={() => handleConnect(fullUser._id)}
                                disabled={isConnecting}
                                className="absolute top-1/2 -translate-y-1/2 
                                            right-4
                                            btn btn-circle btn-lg bg-base-100/90 backdrop-blur-sm shadow-xl z-20 border-none
                                            opacity-100 lg:opacity-0 lg:group-hover:opacity-100
                                            transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white"
                                aria-label="Connect"
                            >
                                <HeartIcon className="h-8 w-8 text-primary" />
                            </button>
                        </div>

                    ) : (
                        <div className="text-center py-16 h-96 flex flex-col justify-center w-full">
                            <h2 className="text-2xl font-bold">All Caught Up!</h2>
                            <p className="text-base-content/70 mt-2">You've seen all recommendations for now.</p>
                        </div>
                    )}
                </div>


                {/* --- RIGHT PANEL: Hidden on Mobile/Tablet --- */}
                <div className="hidden lg:block w-full sticky top-8 mr-auto">
                    <ActiveRoomsPanel />
                </div>

            </div>
        </div>
    );
};

export default HomePage;