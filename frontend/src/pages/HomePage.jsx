import React, { useState } from 'react'; // <-- 1. Import useState
import { useSendConnectionRequestMutation, useGetUserProfileQuery } from "../features/social/socialApiSlice";
import useSmartRecommendations from '../hooks/useSmartRecommendations';
import UserCard from '../components/UserCard';
import MusicInterestPanel from '../components/MusicIntrestPanel';
import ActiveRoomsPanel from '../components/ActiveRoomsPanel';
import { XMarkIcon, HeartIcon , ArrowPathIcon} from '@heroicons/react/24/solid'; // For the new buttons

const HomePage = () => {
    // --- UI State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [overlayState, setOverlayState] = useState('none');
    const [isAnimating, setIsAnimating] = useState(false);

    // --- Smart Data Fetching ---
    const {
        data: recommendations = [],
        isLoading: isLoadingRecs,
        isError: isRecsError,
        isUsingFallback, // ✅ Check if using Random or AI
        refetch: refetchRecs
    } = useSmartRecommendations();

    const [sendConnectionRequest, { isLoading: isConnecting }] = useSendConnectionRequestMutation();

    // Safely get current user
    const currentUser = recommendations?.[currentIndex];
    const currentUsername = currentUser?.username;

    // Fetch Full Profile
    const {
        data: fullUser,
        isLoading: isLoadingProfile,
        isFetching: isFetchingProfile
    } = useGetUserProfileQuery(currentUsername, {
        skip: !currentUsername,
    });

    const ANIMATION_DURATION = 300;

    const goToNextCard = () => {
        setOverlayState('none');
        setIsAnimating(false);
        setCurrentIndex(prevIndex => prevIndex + 1);
    };

    const handleSkip = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setOverlayState('skip');

        setTimeout(() => {
            goToNextCard();
        }, ANIMATION_DURATION);
    };

    const handleConnect = async () => {
        if (isAnimating || !fullUser) return;
        setIsAnimating(true);
        setOverlayState('like');

        try {
            await sendConnectionRequest(fullUser._id).unwrap();
            setTimeout(goToNextCard, ANIMATION_DURATION);
        } catch (err) {
            console.error('Failed to send connection request:', err);
            // alert(err.data?.message || 'Could not send request.');
            setIsAnimating(false);
            setOverlayState('none');
        }
    };

    // --- HELPER: Render Center Card (Handles Loading/Error/Success) ---
    const renderCenterCard = () => {
        
        // A. Loading State
        if (isLoadingRecs || (currentUsername && isFetchingProfile)) {
            return (
                <div className="h-96 flex flex-col items-center justify-center text-base-content/50">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-sm animate-pulse font-medium">
                        {isUsingFallback ? "Finding new people..." : "Consulting the music AI..."}
                    </p>
                </div>
            );
        }

        // B. Error State
        if (isRecsError) {
            return (
                <div className="h-96 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-error/30 rounded-3xl bg-error/5 w-full">
                    <h3 className="text-lg font-bold text-error">Connection Error</h3>
                    <p className="text-sm text-base-content/70 mt-2">Could not fetch recommendations.</p>
                    <button onClick={refetchRecs} className="btn btn-sm btn-outline btn-error mt-4 gap-2">
                        <ArrowPathIcon className="w-4 h-4" /> Try Again
                    </button>
                </div>
            );
        }

        // C. End of List
        if (!fullUser) {
             return (
                <div className="text-center py-16 h-96 flex flex-col justify-center w-full bg-base-200/50 rounded-3xl border-2 border-dashed border-base-300">
                    <h2 className="text-2xl font-bold opacity-80">All Caught Up!</h2>
                    <p className="text-base-content/60 mt-2">No more recommendations for now.</p>
                    <button onClick={() => setCurrentIndex(0)} className="btn btn-ghost mt-4 text-primary">Start Over</button>
                </div>
            );
        }

        // D. Success State
        return (
            <div className="relative group w-full">
                {/* Fallback Indicator */}
                {isUsingFallback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="badge badge-warning gap-1 text-xs font-mono opacity-80 shadow-sm">
                            ⚠️ AI Sleeping - Random Mode
                        </div>
                    </div>
                )}
                
                {!isUsingFallback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="badge badge-primary gap-1 text-xs font-mono opacity-90 shadow-sm">
                            <SparklesIcon className="w-3 h-3" /> AI Match
                        </div>
                    </div>
                )}

                <UserCard user={fullUser} />

                {/* Controls */}
                <button
                    onClick={handleSkip}
                    disabled={isConnecting}
                    className="absolute top-1/2 -translate-y-1/2 left-4 btn btn-circle btn-lg bg-base-100/90 backdrop-blur-sm shadow-xl z-20 border-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:scale-110 hover:bg-white text-error"
                >
                    <XMarkIcon className="h-8 w-8" />
                </button>

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="absolute top-1/2 -translate-y-1/2 right-4 btn btn-circle btn-lg bg-base-100/90 backdrop-blur-sm shadow-xl z-20 border-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:scale-110 hover:bg-white text-primary"
                >
                    <HeartIcon className="h-8 w-8" />
                </button>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8 md:px-6">
            
            {/* ✅ RESPONSIVE LAYOUT: 
                - Mobile: Stacked (User Card First, then Music, then Rooms)
                - Desktop: 3 Columns
            */}
            <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr_22rem] gap-8 lg:gap-12 items-start">

                {/* 1. LEFT PANEL (Music Taste) -> Order 2 on Mobile */}
                <div className="w-full order-2 lg:order-1 lg:sticky lg:top-8">
                    <MusicInterestPanel />
                </div>

                {/* 2. CENTER PANEL (User Card) -> Order 1 on Mobile */}
                <div className="flex flex-col items-center w-full max-w-md mx-auto lg:max-w-full relative z-0 order-1 lg:order-2 mb-8 lg:mb-0">
                    {renderCenterCard()}
                </div>

                {/* 3. RIGHT PANEL (Active Rooms) -> Order 3 on Mobile */}
                <div className="w-full order-3 lg:order-3 lg:sticky lg:top-8">
                    <ActiveRoomsPanel />
                </div>

            </div>
        </div>
    );
};

export default HomePage;