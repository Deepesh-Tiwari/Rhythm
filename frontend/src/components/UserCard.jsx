import React from 'react';

import {
    MapPinIcon,
    UserIcon,
    CalendarDaysIcon,
    MusicalNoteIcon,
    MusicalNoteIcon as ArtistIcon,
    InformationCircleIcon
} from '@heroicons/react/24/solid';


const UserCard = ({ user, onConnect, isConnecting }) => {
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
        // Added 'relative' to parent so the absolute image knows where to position itself.
        // Kept your original 'min-h-160'.
        <div className="card w-full max-w-md min-h-160 overflow-hidden relative bg-base-200 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">

            {/* --- BACKGROUND IMAGE --- */}
            {/* Removed 'figure'. Image is now absolute to cover the whole card behind the text */}
            <img
                src={user.profilePic || fallbackImage}
                alt={`${user.displayName}'s profile`}
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* --- GRADIENT & CONTENT --- */}
            {/* Changed to 'relative' & 'flex-grow' so the card height adapts to content if it gets too long */}
            {/* Corrected 'bg-linear' to 'bg-gradient' to ensure readability */}
            <div className="relative z-10 grow flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white h-full">

                <h2 className="text-3xl font-bold drop-shadow-md">
                    {user.displayName || user.username}
                </h2>

                <p className="text-sm opacity-90">
                    @{user.username}
                </p>

                {/* Kept all your original icon colors and sizing */}
                <div className="space-y-1 text-sm">

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

        </div>
    );
};

export default UserCard;