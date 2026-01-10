import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addSongThunk } from '../features/room/roomThunks';
import { toast } from 'react-toastify';
import { ServerIcon, PlusIcon } from '@heroicons/react/24/outline';

// 🎵 HARDCODED LIST FROM YOUR DATABASE
// Excluded: "Status" by Khasa Aala Chahar
const CACHED_LIBRARY = [
    { id: '2bHBUs-k3ac', name: 'Despacito', artist: 'Luis Fonsi' },
    { id: '6Iovt3Pe0S4', name: 'Desi Kalakaar', artist: 'Yo Yo Honey Singh' },
    { id: 'lzgfqc9duik', name: 'Same Beef', artist: 'Bohemia' },
    { id: 'Rif-RTvmmss', name: 'Starboy', artist: 'The Weeknd' },
    { id: '7u1Jj6aRIec', name: 'Stan', artist: 'Eminem' },
    { id: '_wtGQROctKg', name: 'Dil Pe Chalai Churiya', artist: 'Sonu Nigam' },
    { id: 'FjVjHkezTIM', name: 'Mockingbird', artist: 'Eminem' },
    { id: 'qsDfFE2i0Ws', name: 'Often - Kygo Remix', artist: 'The Weeknd' },
    { id: 'BWczaSneA0Q', name: 'Jhol - Acoustic', artist: 'Maanu' },
    { id: 'V1Z586zoeeE', name: 'As It Was', artist: 'Harry Styles' },
    { id: '7-x3uD5z1bQ', name: 'Watermelon Sugar', artist: 'Harry Styles' },
    { id: 'dccjQT-D_34', name: 'Why This Kolaveri Di?', artist: 'Anirudh Ravichander' },
    { id: '6c3mAtStIxo', name: 'Khalasi', artist: 'Aditya Gadhvi' },
    { id: 'cCmZ7aFU1xY', name: 'Kala Chashma', artist: 'Prem & Hardeep' },
    { id: 'mX19AV35PhI', name: 'Timeless', artist: 'The Weeknd' },
    { id: 'E3QiD99jPAg', name: 'In Your Eyes', artist: 'The Weeknd' },
    { id: 'XQM71BafJog', name: 'Popular', artist: 'The Weeknd' },
    { id: 'T6eK-2OQtew', name: 'Not Like Us', artist: 'Kendrick Lamar' },
    { id: 'SbbUXOZg5S4', name: 'Harleys In Hawaii', artist: 'Katy Perry' },
    { id: 'dnz1rB4p3OI', name: 'Blowing Up', artist: 'KR$NA' },
    { id: '2a8PgqWrc_4', name: 'STARGAZING', artist: 'Travis Scott' },
    { id: 'DwAXkGq7NaU', name: 'No Fluke', artist: 'Dhanda Nyoliwala' },
    { id: 'Xy1Pzu1yZGg', name: 'Dhundhala', artist: 'Yashraj' },
    { id: 'sUf2PtEZris', name: 'Shaky', artist: 'Sanju Rathod' },
    { id: 'uom_jWSs_44', name: 'Party All Night', artist: 'Yo Yo Honey Singh' },
    { id: 'gaJR15qWTDA', name: 'Mera Bhola Hai Bhandari', artist: 'Hansraj Raghuwanshi' },
    { id: 'LhBx4wBh7co', name: 'Namo Namo', artist: 'Amit Trivedi' },
    { id: 'nogCvtsFAdk', name: 'Mast Punjabi', artist: 'Anand Raj Anand' },
    { id: 'm1a_GqJf02M', name: "God's Plan", artist: 'Drake' }
];

const CachedSongsList = () => {
    const dispatch = useDispatch();
    const { room } = useSelector(state => state.room);

    const handleAdd = (song) => {
        // Use placeholder image since we don't have Spotify images for all
        const track = {
            id: song.id, 
            name: song.name,
            artist: song.artist,
            image: "https://placehold.co/100x100/1a1a1a/ffffff?text=MP3", 
            youtubeId: song.id,
            duration: 0 
        };

        dispatch(addSongThunk({ code: room.code, track }))
            .unwrap()
            .then(() => toast.success(`Added: ${song.name}`))
            .catch(err => toast.error("Failed to add song"));
    };

    return (
        <div className="bg-base-200/50 rounded-xl p-3 mb-4 border border-base-300">
            <h3 className="text-xs font-bold opacity-60 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <ServerIcon className="w-3 h-3 text-success" /> 
                Instant Jukebox ({CACHED_LIBRARY.length})
            </h3>
            
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                {CACHED_LIBRARY.map((song) => (
                    <div 
                        key={song.id} 
                        className="flex items-center justify-between p-2 hover:bg-base-300/50 rounded-lg group cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-base-300 flex items-center justify-center shrink-0 text-xs font-bold opacity-50">
                                🎵
                            </div>
                            
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate text-base-content/90">{song.name}</p>
                                <p className="text-[10px] truncate opacity-50">{song.artist}</p>
                            </div>
                        </div>
                        
                        {/* <button className="btn btn-ghost btn-xs btn-circle text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlusIcon className="w-4 h-4" />
                        </button> */}
                    </div>
                ))}
            </div>
            <div className="text-[9px] text-center opacity-30 mt-2">
                Server-cached • Plays instantly
            </div>
        </div>
    );
};

export default CachedSongsList;