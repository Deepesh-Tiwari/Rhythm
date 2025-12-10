import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { MusicalNoteIcon, UserIcon, PlayCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const MusicInterestPanel = () => {
    // In the future, you would get the user's music taste from the Redux store here.

    const { user } = useSelector(state => state.user);

    const navigate = useNavigate();

    const musicTaste = user?.musicTaste;
    const isSpotifyConnected = user?.isSpotifyConnected;

    const topGenres = musicTaste?.topGenres?.slice(0, 8) || [];
    const topArtists = musicTaste?.topArtists?.slice(0, 5) || [];
    const topTracks = musicTaste?.topTracks?.slice(0, 5) || [];

    return (
        <div className="card bg-base-200 shadow-lg h-full hidden lg:block overflow-hidden">
            <div className="card-body p-6">

                {/* Header */}
                <h2 className="card-title text-xl mb-2 flex items-center gap-2">
                    <MusicalNoteIcon className="h-6 w-6 text-primary" />
                    <span className='pr-30'>Music Taste</span>

                    <button
                    onClick={() => navigate('/music/edit')}
                    className="btn btn-ghost btn-sm btn-circle tooltip tooltip-left"
                    data-tip="Edit Favorites"
                >
                    <PencilSquareIcon className="h-5 w-5 text-base-content/50 hover:text-primary transition-colors" />
                </button>
                </h2>


                {/* Content Logic */}
                {(!musicTaste && !isConnected) ? (
                    // FALLBACK: If no music data is found
                    <div className="flex flex-col items-center justify-center h-full opacity-60 mt-4">
                        <p className="text-center italic">No music data connected yet.</p>
                    </div>
                ) : (
                    // DYNAMIC CONTENT
                    <div className="space-y-5">

                        {/* Section 1: Top Genres */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Top Genres</p>
                            <div className="flex flex-wrap gap-2">
                                {topGenres.length > 0 ? (
                                    topGenres.map((genre, index) => (
                                        <div key={index} className="badge badge-neutral border-none capitalize py-3">
                                            {genre}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm opacity-50">No genres found</span>
                                )}
                            </div>
                        </div>

                        <div className="divider my-1"></div>

                        {/* Section 2: Top Artists */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Top Artists
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {topArtists.map((artist) => (
                                    <div key={artist.id} className="badge badge-neutral gap-1">
                                        {artist.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="divider my-1"></div>

                        {/* Section 3: Top Tracks (Optional - looks good for detail) */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1">
                                <PlayCircleIcon className="w-3 h-3" /> SONGS YOU LOVE
                            </p>
                            <ul className="space-y-1">
                                {topTracks.map((track) => (
                                    <li key={track.id} className="text-sm truncate hover:text-primary transition-colors cursor-default" title={`${track.name} by ${track.artists[0]}`}>
                                        <span className="font-medium">{track.name}</span>
                                        <span className="opacity-60 text-xs ml-1">- {track.artists[0]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                )}

                {/* Footer Note */}
                <div className="mt-auto pt-4">
                    <p className="text-xs text-base-content/50 italic text-center">
                        Based on Spotify listening history
                    </p>
                </div>

            </div>
        </div>
    );
};

export default MusicInterestPanel;