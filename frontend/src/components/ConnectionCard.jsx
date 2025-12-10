// src/components/ConnectionCard.jsx

import React from 'react';
import { useNavigate } from 'react-router';
import { UserIcon } from '@heroicons/react/24/solid'; // A nice icon for the button

const ConnectionCard = ({ user }) => {
    const navigate = useNavigate();
    const fallbackImage = `https://i.pravatar.cc/150?u=${user._id}`;

    // This function will navigate to a user's public profile page.
    // We'll need to add this route to App.jsx later.
    const handleViewProfile = () => {
        navigate(`/profile/${user.username}`);
    };

    return (
        <div className="card bg-base-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <figure className="px-8 pt-8">
                <div className="avatar">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                        <img src={user.profilePic || fallbackImage} alt={`${user.displayName}'s profile`} />
                    </div>
                </div>
            </figure>

            <div className="card-body items-center text-center">
                <h2 className="card-title text-lg font-bold text-base-content">
                    {user.displayName || user.username}
                </h2>
                <p className="text-sm text-base-content/70 -mt-1">
                    @{user.username}
                </p>

                <div className="card-actions mt-4 w-full">
                    <button
                        className="btn btn-secondary w-full"
                        onClick={handleViewProfile}
                    >
                        <UserIcon className="h-4 w-4 mr-2" />
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionCard;