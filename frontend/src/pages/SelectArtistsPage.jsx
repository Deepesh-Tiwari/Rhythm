import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
// We'll create these service functions
import { getDiscoveryList, searchMusic } from '../services/musicService';
import { saveMusicProfile } from '../services/userService'; // New service
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from '../features/user/userThunks';

const ArtistCard = ({ artist, onSelect, isSelected }) => (
    <div
        className={`card card-compact bg-base-200 shadow-md cursor-pointer transition-all duration-200 ease-in-out ${isSelected ? 'border-2 border-primary' : 'hover:bg-base-300'}`}
        onClick={() => onSelect(artist)}
    >
        <figure><img src={artist.imageUrl || 'https://via.placeholder.com/150'} alt={artist.name} className="aspect-square object-cover rounded-full p-2" /></figure>
        <div className="card-body text-center p-2">
            <h2 className="card-title text-sm justify-center truncate">{artist.name}</h2>
        </div>
    </div>
);

const SelectArtistsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { selectedTracks } = location.state || { selectedTracks: [] };

    const [trendingArtists, setTrendingArtists] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Redirect if user lands here directly without selecting tracks
    useEffect(() => {
        if (selectedTracks.length === 0) {
            console.warn("No tracks selected, redirecting back.");
            navigate('/select-tracks');
        }
    }, [selectedTracks, navigate]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { trendingArtists } = await getDiscoveryList();
                setTrendingArtists(trendingArtists);
            } catch (error) {
                console.error("Failed to fetch discovery data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            const results = await searchMusic(searchTerm, 'artist');
            setSearchResults(results);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectArtist = (artist) => {
        setSelectedArtists(prev => {
            const isAlreadySelected = prev.some(a => a.id === artist.id);
            if (isAlreadySelected) {
                return prev.filter(a => a.id !== artist.id);
            } else {
                return [...prev, artist];
            }
        });
    };

    const handleSubmitProfile = async () => {
        if (selectedArtists.length < 5) {
            alert('Please select at least 5 artists.');
            return;
        }
        setSubmitting(true);
        try {
            await saveMusicProfile({
                topTracks: selectedTracks,
                topArtists: selectedArtists,
            });
    
            // This will update the user's onboardingStatus in Redux.
            dispatch(checkAuthStatus());

            // On success, navigate to the main dashboard
            navigate('/');
        } catch (error) {
            console.error("Failed to save music profile:", error);
            alert("There was an error saving your profile. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const artistsToShow = searchTerm.trim() ? searchResults : trendingArtists;

    return (
        <div className="min-h-screen bg-base-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-4xl font-bold text-primary">Almost there!</h1>
                    <p className="text-lg text-base-content/80">Now, pick at least 5 of your favorite artists.</p>
                </div>

                <div className="form-control mb-8">
                    <input
                        type="text"
                        placeholder="Search for an artist..."
                        className="input input-bordered w-full md:w-1/2 mx-auto bg-base-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center"><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {artistsToShow.map(artist => (
                            <ArtistCard
                                key={artist.id}
                                artist={artist}
                                onSelect={handleSelectArtist}
                                isSelected={selectedArtists.some(a => a.id === artist.id)}
                            />
                        ))}
                    </div>
                )}

                <div className="fixed bottom-8 right-8">
                    <button
                        className="btn btn-success btn-lg shadow-lg"
                        disabled={selectedArtists.length < 5 || submitting}
                        onClick={handleSubmitProfile}
                    >
                        {submitting ? <span className="loading loading-spinner"></span> : `Finish (${selectedArtists.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectArtistsPage;