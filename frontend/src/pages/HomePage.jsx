import React, { useState } from 'react';
import { useSendConnectionRequestMutation, useGetUserProfileQuery } from "../features/social/socialApiSlice";
import useSmartRecommendations from '../hooks/useSmartRecommendations';
import UserCard from '../components/UserCard';
import MusicInterestPanel from '../components/MusicIntrestPanel';
import ActiveRoomsPanel from '../components/ActiveRoomsPanel';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/solid';

const HomePage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Smart Data Fetching
    const {
        data: recommendations = [],
        isLoading: isLoadingRecs,
        isError: isRecsError,
        isUsingFallback,
        refetch: refetchRecs
    } = useSmartRecommendations();

    const [sendConnectionRequest, { isLoading: isConnecting }] = useSendConnectionRequestMutation();

    const currentUser = recommendations?.[currentIndex];
    const currentUsername = currentUser?.username;

    const {
        data: fullUser,
        isLoading: isLoadingProfile,
        isFetching: isFetchingProfile
    } = useGetUserProfileQuery(currentUsername, {
        skip: !currentUsername,
    });

    // --- Simple Handlers ---

    const handleSkip = () => {
        setCurrentIndex(prev => prev + 1);
    };

    const handleConnect = async () => {
        if (!fullUser || isConnecting) return;
        try {
            await sendConnectionRequest(fullUser._id).unwrap();
            setCurrentIndex(prev => prev + 1);
        } catch (err) {
            console.error('Failed to send connection request:', err);
        }
    };

    // --- Render Logic ---
    const renderCenterCard = () => {
        // A. Loading
        if (isLoadingRecs || (currentUsername && isFetchingProfile)) {
            return (
                <div className="h-96 flex flex-col items-center justify-center text-base-content/50 w-full">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-sm animate-pulse font-medium">
                        {isUsingFallback ? "Finding new people..." : "Consulting the music AI..."}
                    </p>
                </div>
            );
        }

        // B. Error
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

        // D. Success Card
        return (
            <div className="w-full flex flex-col items-center relative z-10 pb-10">
                {/* Status Badge */}
                {/* <div className="mb-4">
                    {isUsingFallback ? (
                        <div className="badge badge-warning gap-1 text-xs font-mono opacity-80 shadow-sm">
                            ⚠️ Random Mode
                        </div>
                    ) : (
                        <div className="badge badge-primary gap-1 text-xs font-mono opacity-90 shadow-sm">
                            <SparklesIcon className="w-3 h-3" /> AI Match
                        </div>
                    )}
                </div> */}

                {/* The Card Component */}
                <div className="w-full relative shadow-xl rounded-3xl bg-base-100 border border-base-200">
                    <UserCard 
                        user={fullUser} 
                        onSkip={handleSkip}       // ✅ Passed Handler
                        onConnect={handleConnect} // ✅ Passed Handler
                        isConnecting={isConnecting}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 py-8 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr_22rem] gap-8 lg:gap-12 items-start justify-items-center">

                {/* 1. LEFT PANEL */}
                <div className="w-full order-2 lg:order-1 lg:sticky lg:top-8">
                    <MusicInterestPanel />
                </div>

                {/* 2. CENTER PANEL */}
                {/* overflow-visible ensures hover effects aren't clipped */}
                <div className="w-full max-w-md flex flex-col items-center justify-start min-h-[500px] order-1 lg:order-2 mb-8 lg:mb-0 overflow-visible">
                    {renderCenterCard()}
                </div>

                {/* 3. RIGHT PANEL */}
                <div className="w-full order-3 lg:order-3 lg:sticky lg:top-8">
                    <ActiveRoomsPanel />
                </div>

            </div>
        </div>
    );
};

export default HomePage;