import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MagnifyingGlassIcon, TrashIcon, PlusIcon, QueueListIcon } from '@heroicons/react/24/outline';

// Actions & Services
import { addSongThunk } from '../features/room/roomThunks';
import { removeSongFromQueue } from '../services/roomService';
import { searchMusic } from '../services/musicService';
import { toast } from 'react-toastify';

const RoomQueue = () => {
    const dispatch = useDispatch();
    
    // Global State
    const { queue, room } = useSelector(state => state.room);
    const { user } = useSelector(state => state.user);

    // Local Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 1. Debounced Search Effect
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const tracks = await searchMusic(query, 'track');
                setResults(tracks || []);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // 2. Handlers
    const handleAdd = (track) => {
        setQuery('');
        setResults([]);
        
        dispatch(addSongThunk({ code: room.code, track }))
            .unwrap()
            .catch(err => toast.error("Song Download Service is not working, Try playing Starboy or popular"));
    };

    const handleRemove = async (songId) => {
        // Optimistic check: prevent accidental clicks
        if (!songId) return;
        
        try {
            await removeSongFromQueue(room.code, songId);
        } catch (err) {
            console.error(err);
        }
    };

    const canDelete = (song) => {
        return room.host?._id === user?._id || song.addedBy === user?._id;
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-300 h-full flex flex-col overflow-visible">
            
            {/* --- HEADER --- */}
            <div className="p-4 border-b border-base-300 flex items-center gap-2 bg-base-200/50 rounded-t-xl">
                <QueueListIcon className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Queue ({queue.length})</h3>
            </div>

            {/* --- SEARCH BAR --- */}
            <div className="p-4 relative z-50">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search songs..." 
                        className="input input-bordered w-full pl-10 focus:outline-none focus:border-primary"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    
                    {isSearching && (
                        <span className="loading loading-spinner loading-xs absolute right-3 top-1/2 -translate-y-1/2 text-primary"></span>
                    )}
                </div>

                {/* SEARCH RESULTS DROPDOWN */}
                {results.length > 0 && (
                    <ul className="absolute top-full left-4 right-4 bg-base-100 shadow-2xl rounded-xl border border-base-200 max-h-64 overflow-y-auto mt-2 p-2 z-50 custom-scrollbar">
                        {results.map((track) => (
                            <li 
                                key={track.id} 
                                className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer group transition-colors" 
                                onClick={() => handleAdd(track)}
                            >
                                <img src={track.imageUrl} alt={track.name} className="h-10 w-10 rounded object-cover shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{track.name}</p>
                                    <p className="text-xs opacity-60 truncate">
                                        {track.artists[0]?.name}
                                    </p>
                                </div>
                                <button className="btn btn-xs btn-circle btn-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* --- QUEUE LIST --- */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar z-0">
                {queue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
                        <div className="text-4xl grayscale">🎵</div>
                        <p className="text-sm font-medium">Queue is empty.</p>
                        <p className="text-xs">Add a song to start the party!</p>
                    </div>
                ) : (
                    queue.map((song, index) => (
                        <div 
                            key={song._id || index} 
                            className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors group border border-transparent hover:border-base-300"
                        >
                            {/* Track Number */}
                            <span className="text-xs font-bold opacity-30 w-6 text-center">{index + 1}</span>
                            
                            {/* Art */}
                            <img src={song.image} alt={song.name} className="h-10 w-10 rounded object-cover bg-neutral shadow-sm" />
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{song.name}</p>
                                <p className="text-xs opacity-50 truncate">{song.artist}</p>
                            </div>

                            {/* Delete Action */}
                            {canDelete(song) && (
                                <button 
                                    onClick={() => handleRemove(song._id)} 
                                    className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from queue"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomQueue;