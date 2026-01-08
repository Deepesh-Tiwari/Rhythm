import React from 'react';
import { CheckIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/solid';

const RequestCard = ({ request, onAccept, onDecline, isUpdating }) => {
    const user = request.fromUserId; 

    if (!user) return null; 

    const fallbackImage = `https://i.pravatar.cc/150?u=${user._id}`;

    return (
        <div className="flex items-center gap-4 p-4 bg-base-100 hover:bg-base-200/50 rounded-2xl shadow-sm border border-base-200 transition-colors group">
            
            {/* Avatar */}
            <div className="avatar shrink-0">
                <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={user.profilePic || fallbackImage} alt={user.username} />
                </div>
                {/* Icon Badge */}
                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-sm">
                    <UserPlusIcon className="w-3 h-3" />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-base-content truncate">
                    {user.displayName || user.username}
                </h3>
                <p className="text-xs text-base-content/60 truncate font-mono">
                    @{user.username}
                </p>
                {/* Optional: Add "Sent 2h ago" if available in request object */}
                <p className="text-xs text-base-content/40 mt-1">wants to connect</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {isUpdating ? (
                    <span className="loading loading-spinner text-primary"></span>
                ) : (
                    <>
                        <button 
                            onClick={() => onDecline(request._id)}
                            className="btn btn-circle btn-sm btn-ghost hover:bg-error/10 text-error tooltip tooltip-left"
                            data-tip="Decline"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => onAccept(request._id)}
                            className="btn btn-circle btn-sm btn-primary shadow-md hover:scale-105 transition-transform tooltip tooltip-left"
                            data-tip="Accept"
                        >
                            <CheckIcon className="w-5 h-5 text-white" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestCard;