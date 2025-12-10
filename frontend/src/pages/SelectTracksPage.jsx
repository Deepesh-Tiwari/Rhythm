import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
// We'll create these service functions
import { getDiscoveryList, searchMusic } from '../services/musicService';

// A reusable card component for displaying a track
const TrackCard = ({ track, onSelect, isSelected }) => (
    <div
        className={`card card-compact bg-base-200 shadow-md cursor-pointer transition-all duration-200 ease-in-out ${isSelected ? 'border-2 border-primary' : 'hover:bg-base-300'}`}
        onClick={() => onSelect(track)}
    >
        <figure><img src={track.imageUrl || 'https://via.placeholder.com/150'} alt={track.name} className="aspect-square object-cover" /></figure>
        <div className="card-body text-center p-2">
            <h2 className="card-title text-sm justify-center truncate">{track.name}</h2>
            <p className="text-xs text-base-content/70 truncate">{track.artists.map(a => a.name).join(', ')}</p>
        </div>
    </div>
);

const SelectTracksPage = () => {
    const navigate = useNavigate();
    const [trendingTracks, setTrendingTracks] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch initial discovery data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { trendingTracks } = await getDiscoveryList();
                setTrendingTracks(trendingTracks);
            } catch (error) {
                console.error("Failed to fetch discovery data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Handle search term changes with a debounce effect
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            const results = await searchMusic(searchTerm, 'track');
            setSearchResults(results);
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectTrack = (track) => {
        setSelectedTracks(prev => {
            const isAlreadySelected = prev.some(t => t.id === track.id);
            if (isAlreadySelected) {
                return prev.filter(t => t.id !== track.id); // Deselect
            } else {
                return [...prev, track]; // Select
            }
        });
    };

    const handleNext = () => {
        if (selectedTracks.length < 5) {
            alert('Please select at least 5 tracks.');
            return;
        }
        // Use navigate's state to pass the selected tracks to the next page
        navigate('/select-artists', { state: { selectedTracks } });
    };

    const tracksToShow = searchTerm.trim() ? searchResults : trendingTracks;

    return (
        <div className="min-h-screen bg-base-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-4xl font-bold text-primary">Welcome to Rhythm</h1>
                    <p className="text-lg text-base-content/80">Let's find your taste. Select at least 5 of your favorite tracks.</p>
                </div>

                {/* Search Bar */}
                <div className="form-control mb-8">
                    <input
                        type="text"
                        placeholder="Search for a track..."
                        className="input input-bordered w-full md:w-1/2 mx-auto bg-base-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tracks Grid */}
                {loading ? (
                    <div className="text-center"><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {tracksToShow.map(track => (
                            <TrackCard
                                key={track.id}
                                track={track}
                                onSelect={handleSelectTrack}
                                isSelected={selectedTracks.some(t => t.id === track.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Floating Action Button */}
                <div className="fixed bottom-8 right-8">
                    <button
                        className="btn btn-primary btn-lg shadow-lg"
                        disabled={selectedTracks.length < 5}
                        onClick={handleNext}
                    >
                        Next ({selectedTracks.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectTracksPage;