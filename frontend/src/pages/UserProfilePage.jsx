// src/pages/UserProfilePage.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import UserCard from '../components/UserCard'; // Your beautiful, full-image card
import {
    UserCircleIcon, AtSymbolIcon, CakeIcon, SparklesIcon,
    IdentificationIcon, MapPinIcon, InformationCircleIcon, MusicalNoteIcon
} from '@heroicons/react/24/outline';

// A reusable component for each "field" in our display form
const ProfileField = ({ icon, label, value, description }) => (
    <div>
        <label className="text-sm font-medium text-base-content/60">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <div className="shrink-0">{icon}</div>
            <p className="text-lg font-semibold text-base-content">{value || <span className="italic text-base-content/50">Not set</span>}</p>
        </div>
        {description && <p className="text-xs text-base-content/50 mt-1 ml-9">{description}</p>}
    </div>
);

const UserProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.user);

    if (!user) {
        return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    const age = user.dateOfBirth ? `${new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()} years old` : null;
    const maskedEmail = user.email ? user.email.replace(/(?<=.).(?=[^@]*?@)/g, "*") : null;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- COLUMN 1: THE "DISPLAY FORM" (takes 2/3 of the width) --- */}
                <div className="lg:col-span-2 bg-base-200 p-6 md:p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Your Profile</h1>
                        <button onClick={() => navigate('/profile/edit')} className="btn btn-secondary">
                            Edit Profile
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* --- Public Profile Section --- */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Public Profile</h2>
                            <div className="space-y-6">
                                <ProfileField 
                                    icon={<UserCircleIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Display Name"
                                    value={user.displayName}
                                    description="This is how other users will see you on the platform."
                                />
                                <ProfileField 
                                    icon={<InformationCircleIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Bio"
                                    value={user.bio}
                                    description="A short description about yourself."
                                />
                                <ProfileField 
                                    icon={<MapPinIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Location"
                                    value={user.location}
                                    description="Your city and state."
                                />
                            </div>
                        </div>

                        {/* --- Account Details Section --- */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Account Details</h2>
                            <div className="space-y-6">
                                <ProfileField 
                                    icon={<AtSymbolIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Username"
                                    value={`@${user.username}`}
                                    description="Your unique handle. This cannot be changed."
                                />
                                <ProfileField 
                                    icon={<CakeIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Age"
                                    value={age}
                                    description="Your age is calculated from your date of birth."
                                />
                                <ProfileField 
                                    icon={<IdentificationIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Gender"
                                    value={user.gender}
                                    description="Your gender identity."
                                />
                            </div>
                        </div>
                        
                        {/* --- Music Taste Section (Extra Content!) --- */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Music Taste</h2>
                            <div className="space-y-6">
                                <ProfileField 
                                    icon={<MusicalNoteIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Top Genres"
                                    value={user.musicTaste?.topGenres?.slice(0, 5).join(', ')}
                                    description="Generated from your listening history."
                                />
                                <ProfileField 
                                    icon={<SparklesIcon className="h-5 w-5 text-base-content/70"/>}
                                    label="Your Anthem"
                                    value="Not set" // Placeholder for a future feature
                                    description="Set a song that represents you right now."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COLUMN 2: THE VISUAL CARD (takes 1/3 of the width) --- */}
                <div className="hidden lg:block">
                    <div className="sticky top-24"> {/* Makes the card "stick" on scroll */}
                        <UserCard user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;