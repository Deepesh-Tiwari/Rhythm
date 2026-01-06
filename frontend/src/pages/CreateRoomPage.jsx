import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRoom } from '../services/roomService';
import { MusicalNoteIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { joinRoomThunk } from '../features/room/roomThunks';

const GENRE_OPTIONS = [
    "Pop", "Hip-Hop", "Rock", "Indie", "R&B", "Electronic", "K-Pop", "Jazz", "Classical", "Metal", "Lo-Fi", "Bollywood", "Punjabi"
];

const CreateRoomPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: true,
        genres: []
    });

    const handleGenreToggle = (genre) => {
        setFormData(prev => {
            const currentGenres = prev.genres;
            if (currentGenres.includes(genre)) {
                return { ...prev, genres: currentGenres.filter(g => g !== genre) };
            } else {
                if (currentGenres.length >= 3) return prev; // Max 3 genres
                return { ...prev, genres: [...currentGenres, genre] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error("Room name is required");
            return;
        }

        setIsLoading(true);

        try {
            const response = await createRoom(formData);
            const newRoomCode = response.room.code;
            toast.success("Room created successfully!");
            // Redirect to the new room

            await dispatch(joinRoomThunk(newRoomCode)).unwrap();
            navigate(`/rooms/${newRoomCode}`);
        } catch (error) {
            console.error("Create Room Error:", error);
            const msg = error.response?.data?.message || "Failed to create room";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-base-100">
            <div className="card w-full max-w-lg bg-base-200 shadow-xl">
                <div className="card-body">
                    
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                            <MusicalNoteIcon className="w-8 h-8 text-primary" />
                            Create a Vibe
                        </h2>
                        <p className="text-base-content/60 mt-1">Start a listening party for your friends.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Room Name */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-bold">Room Name</span>
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g. Late Night Lo-Fi" 
                                className="input input-bordered w-full focus:input-primary"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                maxLength={30}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-control w-full flex flex-col">
                            <label className="label">
                                <span className="label-text">Description (Optional)</span>
                            </label>
                            <textarea 
                                className="textarea textarea-bordered h-24 focus:textarea-primary w-full" 
                                placeholder="What kind of music are we jamming to?"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                maxLength={100}
                            ></textarea>
                        </div>

                        {/* Public Note (Visual only, no toggle) */}
                        <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-300 opacity-60 cursor-not-allowed">
                            <div className="p-2 rounded-full bg-base-300">
                                <GlobeAltIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-sm font-bold block">Public Room</span>
                                <span className="text-xs block text-base-content/60">
                                    Private rooms are coming soon.
                                </span>
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">Tags (Max 3)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GENRE_OPTIONS.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => handleGenreToggle(genre)}
                                        className={`btn btn-sm ${formData.genres.includes(genre) ? 'btn-primary' : 'btn-outline btn-neutral'} rounded-full`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading || !formData.name.trim()}
                        >
                            {isLoading ? 'Creating Room...' : 'Start Party'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateRoomPage;