import React from 'react';
import { useSelector } from 'react-redux';
import { UserGroupIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';

const RoomSidebar = () => {
    const { activeMembers } = useSelector(state => state.room);

    // Sort: Host first, then Mods, then Listeners
    const sortedMembers = [...activeMembers].sort((a, b) => {
        const roles = { 'host': 1, 'moderator': 2, 'listener': 3 };
        return roles[a.role] - roles[b.role];
    });

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-14 border-b border-base-300 flex items-center px-4 bg-base-200/50">
                <UserGroupIcon className="h-5 w-5 mr-2 opacity-50" />
                <span className="font-bold text-sm">Members ({activeMembers.length})</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {sortedMembers.map((member, index) => (
                    // ✅ FIX: Use combination of ID and Index to guarantee uniqueness
                    <div 
                        key={`${member.user?._id || 'ghost'}-${index}`} 
                        className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors cursor-pointer group"
                    >
                        
                        {/* Avatar with Status Indicator */}
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                                {member.user?.profilePic ? (
                                    <img src={member.user.profilePic} alt={member.user.username} />
                                ) : (
                                    <span className="text-xs">{member.user?.username?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        {/* Name & Role */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                                {member.user?.displayName || member.user?.username || 'Unknown'}
                                {member.role === 'host' && <StarIcon className="h-3 w-3 text-warning" title="Host" />}
                                {member.role === 'moderator' && <ShieldCheckIcon className="h-3 w-3 text-info" title="Mod" />}
                            </p>
                            <p className="text-[10px] opacity-40 truncate capitalize">
                                {member.role}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomSidebar;