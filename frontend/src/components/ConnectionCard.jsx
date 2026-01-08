import React from 'react';
import { useNavigate } from 'react-router';
import { UserIcon } from '@heroicons/react/24/solid';

const ConnectionCard = ({ user }) => {
    const navigate = useNavigate();
    const fallbackImage = `https://i.pravatar.cc/150?u=${user._id}`;

    const handleViewProfile = () => {
        navigate(`/profile/${user.username}`);
    };

    return (
        <div 
            onClick={handleViewProfile}
            className="group relative bg-base-100 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-base-200 hover:border-primary/20 hover:-translate-y-1"
        >
            {/* Top Half: Cover/Avatar Area */}
            <div className="h-32 bg-linear-to-r from-primary/10 to-secondary/10 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <div className="avatar">
                        <div className="w-20 rounded-full ring ring-base-100 ring-offset-2 ring-offset-base-100 shadow-lg group-hover:scale-105 transition-transform">
                            <img src={user.profilePic || fallbackImage} alt={user.username} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Half: Info */}
            <div className="pt-12 pb-6 px-4 text-center">
                <h3 className="font-bold text-lg text-base-content group-hover:text-primary transition-colors">
                    {user.displayName || user.username}
                </h3>
                <p className="text-xs text-base-content/60 font-mono mb-3">@{user.username}</p>
                
                {user.bio && (
                    <p className="text-sm text-base-content/80 line-clamp-2 mb-4 italic">
                        "{user.bio}"
                    </p>
                )}

                <button className="btn btn-sm btn-outline btn-primary w-full gap-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <UserIcon className="w-4 h-4" /> View Profile
                </button>
            </div>
        </div>
    );
};

export default ConnectionCard;