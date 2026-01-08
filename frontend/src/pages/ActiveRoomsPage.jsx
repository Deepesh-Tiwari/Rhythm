import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getPublicRooms } from '../services/roomService';
import { SignalIcon, UserIcon, PlayIcon, PlusIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/solid';

const GRADIENTS = [
    "from-purple-600/20 to-blue-600/20",
    "from-red-600/20 to-orange-600/20",
    "from-teal-600/20 to-emerald-600/20",
    "from-pink-600/20 to-rose-600/20",
    "from-indigo-600/20 to-cyan-600/20"
];

const ActiveRoomsPage = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("All");

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const data = await getPublicRooms(1, 50);
                setRooms(data.rooms || []);
                setFilteredRooms(data.rooms || []);
            } catch (error) {
                console.error("Failed to fetch rooms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = rooms;

        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(r => 
                r.name.toLowerCase().includes(query) || 
                r.code.toLowerCase().includes(query)
            );
        }

        if (selectedGenre !== "All") {
            result = result.filter(r => r.genres.includes(selectedGenre));
        }

        setFilteredRooms(result);
    }, [search, selectedGenre, rooms]);

    // Extract unique genres for filter dropdown
    const allGenres = ["All", ...new Set(rooms.flatMap(r => r.genres))];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-base-100">
            
            {/* HERO SECTION */}
            <div className="bg-base-200/50 py-12 px-6 border-b border-base-300">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold flex items-center gap-3">
                            <span className="text-secondary">Live</span> Parties
                            <span className="flex relative h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                            </span>
                        </h1>
                        <p className="text-base-content/60 mt-2 text-lg">
                            Jump into a room and start listening together.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/create-room')}
                        className="btn btn-primary btn-lg shadow-lg hover:scale-105 transition-transform gap-3"
                    >
                        <PlusIcon className="w-6 h-6" />
                        Host a Room
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                        <input 
                            type="text" 
                            placeholder="Search rooms..." 
                            className="input input-bordered w-full pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="select select-bordered w-full sm:w-48"
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                    >
                        {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                {/* CONTENT */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-secondary"></span>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-xl font-bold">No rooms found</p>
                        <p>Try clearing your filters or create a new one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRooms.map((room, index) => (
                            <div 
                                key={room._id} 
                                onClick={() => navigate(`/rooms/${room.code}`)}
                                className={`card bg-linear-to-br ${GRADIENTS[index % GRADIENTS.length]} hover:brightness-110 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1 group border border-white/5`}
                            >
                                <div className="card-body p-5">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="card-title text-lg font-bold text-base-content">{room.name}</h3>
                                            <p className="text-xs font-mono opacity-60">#{room.code}</p>
                                        </div>
                                        <div className="badge badge-neutral gap-1 border-none bg-black/20 text-white">
                                            <UserIcon className="w-3 h-3" /> {room.activeMemberCount}
                                        </div>
                                    </div>

                                    {/* Track Info */}
                                    <div className="mt-4 p-3 bg-black/10 backdrop-blur-sm rounded-xl flex items-center gap-3">
                                        {room.currentTrack?.image ? (
                                            <img src={room.currentTrack.image} alt="art" className="w-10 h-10 rounded object-cover shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                                                <PlayIcon className="w-5 h-5 opacity-50" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold truncate">
                                                {room.currentTrack?.name || "No music playing"}
                                            </p>
                                            <p className="text-xs opacity-70 truncate">
                                                {room.currentTrack?.artist || "Queue is empty"}
                                            </p>
                                        </div>
                                        {room.currentTrack?.name && (
                                            <div className="flex gap-0.5 items-end h-3">
                                                <span className="w-1 bg-secondary animate-bounce h-full"></span>
                                                <span className="w-1 bg-secondary animate-bounce h-2 delay-75"></span>
                                                <span className="w-1 bg-secondary animate-bounce h-3 delay-150"></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div className="card-actions mt-4">
                                        {room.genres.slice(0, 3).map((g, i) => (
                                            <div key={i} className="badge badge-outline border-white/20 text-xs text-base-content/80">{g}</div>
                                        ))}
                                        {room.genres.length > 3 && (
                                            <span className="text-xs opacity-50 self-center">+{room.genres.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveRoomsPage;