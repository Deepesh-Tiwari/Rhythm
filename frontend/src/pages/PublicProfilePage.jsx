import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useGetUserMusicTasteQuery, useSendConnectionRequestMutation } from '../features/social/socialApiSlice';
import { 
    MapPinIcon, 
    CalendarDaysIcon, 
    MusicalNoteIcon, 
    UserIcon, 
    HeartIcon, 
    ChatBubbleLeftRightIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const PublicProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector(state => state.user);

    // Fetch full profile including music taste
    const { 
        data: profile, 
        isLoading, 
        isError 
    } = useGetUserMusicTasteQuery(username);

    const [sendConnectionRequest, { isLoading: isConnecting }] = useSendConnectionRequestMutation();

    const isOwnProfile = currentUser?.username === username;

    const handleConnect = async () => {
        if (!profile || isConnecting) return;
        try {
            await sendConnectionRequest(profile._id).unwrap();
            toast.success("Connection request sent!");
        } catch (err) {
            console.error(err);
            toast.error(err?.data?.message || "Failed to connect");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold opacity-50">User not found</h2>
                <button onClick={() => navigate(-1)} className="btn btn-ghost mt-4">Go Back</button>
            </div>
        );
    }

    const musicTaste = profile.musicTaste || {};
    const topTracks = musicTaste.topTracks || [];
    const topArtists = musicTaste.topArtists || [];
    const topGenres = musicTaste.topGenres || [];
    const age = profile.dateOfBirth 
        ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() 
        : null;

    return (
        <div className="min-h-screen bg-base-100 pb-20">
            
            {/* --- HERO SECTION --- */}
            <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-4 left-4 btn btn-circle btn-ghost bg-base-100/50 hover:bg-base-100 border-none"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                
                {/* --- PROFILE HEADER --- */}
                <div className="relative -mt-24 mb-8 flex flex-col md:flex-row items-end md:items-start gap-6">
                    {/* Avatar */}
                    <div className="avatar">
                        <div className="w-40 h-40 rounded-full ring ring-base-100 ring-offset-base-100 ring-offset-4 shadow-2xl">
                            <img src={profile.profilePic || `https://i.pravatar.cc/150?u=${profile._id}`} alt={profile.username} />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left mt-4 md:mt-16">
                        <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                            {profile.displayName || profile.username}
                            {/* <span className="badge badge-primary badge-sm">PRO</span> */}
                        </h1>
                        <p className="text-base-content/60 font-mono">@{profile.username}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm opacity-80">
                            {profile.location && (
                                <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {profile.location}</span>
                            )}
                            {age && (
                                <span className="flex items-center gap-1"><CalendarDaysIcon className="w-4 h-4" /> {age} years</span>
                            )}
                            {profile.gender && (
                                <span className="flex items-center gap-1 capitalize"><UserIcon className="w-4 h-4" /> {profile.gender}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-2">
                        {!isOwnProfile && (
                            <button 
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="btn btn-primary shadow-lg gap-2"
                            >
                                {isConnecting ? <span className="loading loading-spinner loading-xs"></span> : <HeartIcon className="w-5 h-5" />}
                                Connect
                            </button>
                        )}
                        {/* <button className="btn btn-ghost btn-circle bg-base-200">
                            <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        </button> */}
                    </div>
                </div>

                {/* --- BIO --- */}
                {profile.bio && (
                    <div className="bg-base-200/50 p-6 rounded-2xl mb-10 border border-base-300">
                        <h3 className="text-sm font-bold uppercase opacity-50 mb-2 tracking-wider">About</h3>
                        <p className="text-lg leading-relaxed italic">"{profile.bio}"</p>
                    </div>
                )}

                {/* --- MUSIC DNA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COL: Genres & Artists */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Genres */}
                        {topGenres.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                    <MusicalNoteIcon className="w-6 h-6 text-secondary" />
                                    Top Genres
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {topGenres.map((genre, i) => (
                                        <div key={i} className="badge badge-lg badge-outline border-secondary/40 text-secondary capitalize py-4 px-4">
                                            {genre}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Artists Grid */}
                        {topArtists.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                    <UserIcon className="w-6 h-6 text-accent" />
                                    Favorite Artists
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {topArtists.slice(0, 6).map((artist) => (
                                        <div key={artist.id} className="flex items-center gap-3 bg-base-200 p-3 rounded-xl hover:bg-base-300 transition-colors">
                                            <div className="avatar">
                                                <div className="w-12 h-12 rounded-full">
                                                    <img src={artist.image || `https://ui-avatars.com/api/?name=${artist.name}`} alt={artist.name} />
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm line-clamp-2">{artist.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: Top Tracks List */}
                    <div className="bg-base-200/30 rounded-3xl p-6 h-fit border border-base-200">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <span className="text-primary">🎵</span> Top Tracks
                        </h3>
                        <div className="space-y-4">
                            {topTracks.slice(0, 10).map((track, i) => (
                                <div key={track.id} className="flex items-center gap-3 group">
                                    <span className="text-xs font-mono opacity-30 w-4">{i + 1}</span>
                                    <img 
                                        src={track.image || track.imageUrl} 
                                        alt={track.name} 
                                        className="w-10 h-10 rounded-md shadow-sm group-hover:scale-105 transition-transform"
                                    />
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm truncate">{track.name}</div>
                                        <div className="text-xs opacity-60 truncate">
                                            {track.artists.map(a => typeof a === 'string' ? a : a.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topTracks.length === 0 && (
                                <p className="text-center opacity-40 text-sm py-4">No tracks visible.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;