import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { checkAuthStatus } from '../features/user/userThunks';
import { searchMusic } from '../services/musicService';
import ExpandedMusicPreview from '../components/ExpandedMusicPreview'; // IMPORT THE COMPONENT
import {
    MusicalNoteIcon, MagnifyingGlassIcon, XMarkIcon,
    PlusIcon, PlayCircleIcon, UserIcon, ExclamationTriangleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { updateMusicProfile } from '../services/userService';

const MusicTasteEditPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.user);

    // --- STATE ---
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [derivedGenres, setDerivedGenres] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('artist');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.musicTaste) {
            setSelectedArtists(user.musicTaste.topArtists || []);
            setSelectedTracks(user.musicTaste.topTracks || []);
            setDerivedGenres(user.musicTaste.topGenres || []);
        }
    }, [user]);

    // --- HANDLERS (Same as before) ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchMusic(searchQuery, searchType); // calling your service
                setSearchResults(results || []);
            } catch (err) {
                console.error(err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchType]);

    const addItem = (item) => {
        if (searchType === 'artist') {
            if (selectedArtists.some(a => a.id === item.id)) return;
            const newArtist = {
                id: item.id,
                name: item.name,
                genres: item.genres || [],
                image: item.imageUrl
            };
            setSelectedArtists([...selectedArtists, newArtist]);
        } else {
            if (selectedTracks.some(t => t.id === item.id)) return;
            const newTrack = {
                id: item.id,
                name: item.name,
                artists: item.artists,
                image: item.imageUrl
            };
            setSelectedTracks([...selectedTracks, newTrack]);
        }

        setSearchQuery('');
        setSearchResults([]);
    };

    const handleTabChange = (type) => {
        setSearchType(type);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeItem = (id, type) => {
        if (type === 'artist') setSelectedArtists(selectedArtists.filter(a => a.id !== id));
        else setSelectedTracks(selectedTracks.filter(t => t.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedArtists.length < 5 || selectedTracks.length < 5) {
            setError("Please select at least 5 Artists and 5 Tracks.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payloadArtists = selectedArtists.map(artist => {
                //console.log(artist);
                return {
                id: artist.id,
                name: artist.name,
                genres: artist.genres || [],
                imageUrl: artist.image
            }});

            const payloadTracks = selectedTracks.map(track => {

                const formattedArtists = (Array.isArray(track.artists) ? track.artists : []).map(artist => {
                    // If it's a string (Old Data), wrap it in an object
                    if (typeof artist === 'string') {
                        return { name: artist };
                    }
                    // If it's already an object (New Data), keep it, ensuring it has name
                    if (typeof artist === 'object' && artist && artist.name) {
                        return { name: artist.name };
                    }
                    return { name: "Unknown Artist" }; // Fallback
                });

                return {
                    id: track.id,
                    name: track.name,
                    // CHANGE: Frontend state uses 'image', Backend expects 'imageUrl'
                    imageUrl: track.image,
                    artists: formattedArtists
                };
            });

            const payload = {
                topArtists: payloadArtists,
                topTracks: payloadTracks
            };

            // Replace with your actual endpoint
            updateMusicProfile(payload);
            await dispatch(checkAuthStatus());
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update music taste");
        } finally { setLoading(false); }
    };

    if (!user) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner"></span></div>;

    // --- FINAL LAYOUT RENDER ---
    return (
        <div className="min-h-screen bg-base-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ==========================================
                    LEFT COLUMN: FORM & SEARCH (Span 8/12)
                   ========================================== */}
                <div className="lg:col-span-8 space-y-6">

                    {/* 1. Header Card */}
                    <div className="bg-base-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <MusicalNoteIcon className="h-7 w-7 text-primary" />
                                Edit Music Taste
                            </h1>
                            <p className="text-sm opacity-60 mt-1">Select your favorites to find better matches.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => navigate('/')} className="btn btn-ghost">Cancel</button>
                            <button onClick={handleSubmit} className="btn btn-primary px-8" disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* 2. Error Alert */}
                    {error && (
                        <div role="alert" className="alert alert-error">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 3. Progress Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`stat bg-base-200 rounded-2xl border-l-4 ${selectedArtists.length >= 5 ? 'border-success' : 'border-warning'}`}>
                            <div className="stat-title text-xs font-bold uppercase">Artists</div>
                            <div className="stat-value text-2xl flex items-baseline gap-2">
                                {selectedArtists.length} <span className="text-sm font-normal opacity-50">/ 5</span>
                                {selectedArtists.length >= 5 && <CheckCircleIcon className="h-5 w-5 text-success" />}
                            </div>
                        </div>
                        <div className={`stat bg-base-200 rounded-2xl border-l-4 ${selectedTracks.length >= 5 ? 'border-success' : 'border-warning'}`}>
                            <div className="stat-title text-xs font-bold uppercase">Tracks</div>
                            <div className="stat-value text-2xl flex items-baseline gap-2">
                                {selectedTracks.length} <span className="text-sm font-normal opacity-50">/ 5</span>
                                {selectedTracks.length >= 5 && <CheckCircleIcon className="h-5 w-5 text-success" />}
                            </div>
                        </div>
                    </div>

                    {/* 4. Search Interface */}
                    {/* 4. Search Interface (UPDATED) */}
                    <div className="bg-base-200 p-6 rounded-2xl shadow-sm relative z-20">

                        {/* Tabs */}
                        <div className="tabs tabs-boxed bg-base-100 mb-4 inline-flex">
                            <a className={`tab ${searchType === 'artist' ? 'tab-active' : ''}`} onClick={() => handleTabChange('artist')}>Artists</a>
                            <a className={`tab ${searchType === 'track' ? 'tab-active' : ''}`} onClick={() => handleTabChange('track')}>Tracks</a>
                        </div>

                        {/* Search Input (Button Removed, Spinner Added) */}
                        <div className="relative w-full">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-50" />
                            <input
                                className="input input-bordered w-full pl-10"
                                placeholder={`Type to search ${searchType}s...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            // No onKeyDown needed anymore
                            />
                            {isSearching && (
                                <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-primary"></span>
                            )}
                        </div>

                        {/* Search Results Dropdown (Absolute Positioned) */}
                        {searchQuery && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-xl shadow-2xl border border-base-300 max-h-80 overflow-y-auto z-30 p-2 custom-scrollbar">
                                {searchResults.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => addItem(item)}
                                        className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer transition-colors group"
                                    >
                                        <img
                                            src={item.images?.[0]?.url || item.album?.images?.[0]?.url || item.imageUrl || 'https://via.placeholder.com/40'}
                                            alt={item.name}
                                            className="w-10 h-10 rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{item.name}</p>
                                            <p className="text-xs opacity-50 truncate">
                                                {searchType === 'track' ? item.artists?.[0]?.name : 'Artist'}
                                            </p>
                                        </div>
                                        <PlusIcon className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {searchQuery && !isSearching && searchResults.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-xl shadow-xl p-4 text-center z-30">
                                <p className="text-sm opacity-50">No results found.</p>
                            </div>
                        )}

                    </div>

                    {/* 5. Selection Lists (Mobile/Desktop Visible) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Artist List */}
                        <div className="bg-base-200 p-4 rounded-2xl">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">Selected Artists</h3>
                            <ul className="space-y-2">
                                {selectedArtists.length === 0 && <li className="text-sm opacity-30 italic text-center py-4">No artists selected</li>}
                                {selectedArtists.map((artist) => (
                                    <li key={artist.id} className="flex justify-between items-center p-2 bg-base-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={artist.image || 'https://via.placeholder.com/40'} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                                            <span className="text-sm font-bold truncate">{artist.name}</span>
                                        </div>
                                        <button onClick={() => removeItem(artist.id, 'artist')} className="btn btn-ghost btn-xs btn-circle text-error"><XMarkIcon className="h-4 w-4" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Track List */}
                        <div className="bg-base-200 p-4 rounded-2xl">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">Selected Tracks</h3>
                            <ul className="space-y-2">
                                {selectedTracks.length === 0 && <li className="text-sm opacity-30 italic text-center py-4">No tracks selected</li>}
                                {selectedTracks.map((track) => (
                                    <li key={track.id} className="flex justify-between items-center p-2 bg-base-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={track.image || 'https://via.placeholder.com/40'} alt={track.name} className="w-8 h-8 rounded-md object-cover" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{track.name}</p>
                                                <p className="text-[10px] opacity-50 truncate">{Array.isArray(track.artists) ? track.artists[0]?.name || track.artists[0] : ''}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(track.id, 'track')} className="btn btn-ghost btn-xs btn-circle text-error"><XMarkIcon className="h-4 w-4" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ==========================================
                    RIGHT COLUMN: PREVIEW (Span 4/12)
                    Hidden on Mobile, Sticky on Desktop
                   ========================================== */}
                <div className="hidden lg:block lg:col-span-4">
                    <div className="sticky top-6">
                        <ExpandedMusicPreview
                            artists={selectedArtists}
                            tracks={selectedTracks}
                            genres={derivedGenres}
                        />
                        <div className="mt-4 text-center px-4">
                            <p className="text-xs opacity-40">
                                This preview shows all your selections. The actual profile card will show a condensed summary.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MusicTasteEditPage;