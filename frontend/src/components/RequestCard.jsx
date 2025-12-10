// src/components/RequestCard.jsx

import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const RequestCard = ({ request, onAccept, onDecline, isUpdating }) => {
    // --- FIX IS HERE ---
    // Change 'fromUser' to 'fromUserId' to match your API response
    const user = request.fromUserId; 

    // Now, this check will prevent the error if for some reason the user object is missing
    if (!user) {
        // You can return null to hide the card or show a placeholder
        return null; 
    }

    const fallbackImage = `https://i.pravatar.cc/150?u=${user._id}`;

    return (
        <div className="card card-side bg-base-200 shadow-md transition-all duration-300 hover:shadow-lg">
            <figure className="p-4">
                <div className="avatar">
                    <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src={user.profilePic || fallbackImage} alt={`${user.displayName || user.username}'s profile`} />
                    </div>
                </div>
            </figure>

            <div className="card-body justify-center p-4">
                <h2 className="card-title text-base font-bold text-base-content">
                    {user.displayName || user.username}
                </h2>
                <p className="text-sm text-base-content/70 -mt-1">
                    @{user.username}
                </p>
            </div>

            <div className="card-actions justify-end items-center p-4">
                {isUpdating ? (
                    <span className="loading loading-spinner text-primary"></span>
                ) : (
                    <>
                        <button 
                            className="btn btn-ghost btn-circle" 
                            aria-label="Decline"
                            onClick={() => onDecline(request._id)}
                            disabled={isUpdating}
                        >
                            <XMarkIcon className="h-6 w-6 text-error" />
                        </button>
                        <button 
                            className="btn btn-primary btn-circle" 
                            aria-label="Accept"
                            onClick={() => onAccept(request._id)}
                            disabled={isUpdating}
                        >
                            <CheckIcon className="h-6 w-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestCard;