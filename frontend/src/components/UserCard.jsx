import React from 'react';

import {
    MapPinIcon,
    UserIcon,
    CalendarDaysIcon,
    MusicalNoteIcon,
    MusicalNoteIcon as ArtistIcon,
    InformationCircleIcon,
    XMarkIcon,
    HeartIcon
} from '@heroicons/react/24/solid';


const UserCard = ({ user, onConnect, onSkip, isConnecting }) => {
    // A fallback image in case the user's profile picture is missing
    const fallbackImage = 'https://i.pravatar.cc/150?u=' + user._id;

    const age = user.dateOfBirth
        ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
        : null;

    const favTracks = user.musicTaste?.topTracks
        ?.slice(0, 3)
        .map(track => track.name);

    const favArtists = user.musicTaste?.topArtists
        ?.slice(0, 3)
        .map(artist => artist.name);

    return (
        <div className="card w-full max-w-md min-h-160 overflow-hidden relative group bg-base-200 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">

            {/* --- BACKGROUND IMAGE --- */}
            <img
                src={user.profilePic || fallbackImage}
                alt={`${user.displayName}'s profile`}
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* --- GRADIENT & CONTENT --- */}
            {/* Added pointer-events-none so clicks pass through to the buttons */}
            <div className="relative z-10 grow flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white h-full pointer-events-none">

                <h2 className="text-3xl font-bold drop-shadow-md">
                    {user.displayName || user.username}
                </h2>

                <p className="text-sm opacity-90">
                    @{user.username}
                </p>

                {/* ✅ FIXED: Removed mb-16 so content stays at the bottom */}
                <div className="space-y-1 text-sm mt-2">

                    {user.location && (
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{user.location}</span>
                        </div>
                    )}

                    {user.gender && (
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{user.gender}</span>
                        </div>
                    )}

                    {age && (
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>{age} years old</span>
                        </div>
                    )}

                    {user.bio && (
                        <div className="flex items-start gap-2">
                            <InformationCircleIcon className="h-4 w-4 mt-0.5" />
                            <span className="line-clamp-2">{user.bio}</span>
                        </div>
                    )}

                    {favTracks?.length > 0 && (
                        <div className="flex items-start gap-2">
                            <MusicalNoteIcon className="h-4 w-4 mt-0.5" />
                            <span>{favTracks.join(", ")}</span>
                        </div>
                    )}

                    {favArtists?.length > 0 && (
                        <div className="flex items-start gap-2">
                            <ArtistIcon className="h-4 w-4 mt-0.5" />
                            <span>{favArtists.join(", ")}</span>
                        </div>
                    )}

                </div>

            </div>

            {/* --- HOVER ACTION BUTTONS --- */}
            {/* These sit on top (z-20) and only appear on hover */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                
                {/* Skip Button */}
                <button 
                    onClick={onSkip}
                    className="btn btn-circle btn-lg bg-white/20 backdrop-blur-md border-none text-white hover:bg-white hover:text-red-500 shadow-xl transition-transform active:scale-95 pointer-events-auto"
                >
                    <XMarkIcon className="h-8 w-8" />
                </button>

                {/* Connect Button */}
                <button 
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="btn btn-circle btn-lg bg-primary border-none text-white shadow-xl hover:scale-110 transition-transform active:scale-95 pointer-events-auto"
                >
                    {isConnecting ? (
                        <span className="loading loading-spinner"></span>
                    ) : (
                        <HeartIcon className="h-8 w-8" />
                    )}
                </button>

            </div>

        </div>
    );
};

export default UserCard;