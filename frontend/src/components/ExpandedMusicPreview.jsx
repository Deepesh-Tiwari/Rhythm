import React from 'react';
import { MusicalNoteIcon, PlayCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const ExpandedMusicPreview = ({ artists, tracks, genres }) => {
    return (
        <div className="card bg-base-100 shadow-xl border border-base-300 h-[calc(100vh-6rem)] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="h-24 bg-linear-to-r from-secondary/10 to-primary/10 flex flex-col items-center justify-center shrink-0">
                <h2 className="text-lg font-bold flex items-center gap-2 opacity-80">
                    <MusicalNoteIcon className="h-6 w-6" />
                    Music Profile
                </h2>
                <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Live Preview</p>
            </div>

            {/* Scrollable Content */}
            <div className="card-body p-4 gap-6 overflow-y-auto custom-scrollbar">

                {/* 1. GENRES */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3">Vibe / Genres</h3>
                    <div className="flex flex-wrap gap-2">
                        {genres.length > 0 ? (
                            genres.slice(0, 10).map((g, i) => (
                                <span key={i} className="badge badge-neutral badge-sm py-3 capitalize">{g}</span>
                            ))
                        ) : (
                            <span className="text-xs italic opacity-40">Auto-generated upon save</span>
                        )}
                    </div>
                </div>

                <div className="divider my-0"></div>

                {/* 2. ARTISTS */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 flex justify-between">
                        Selected Artists <span className="text-primary">{artists.length}</span>
                    </h3>
                    {artists.length === 0 ? (
                        <div className="h-20 flex items-center justify-center border border-dashed border-base-300 rounded-lg text-xs opacity-40">No artists yet</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {artists.map((artist) => (
                                <div key={artist.id} className="flex flex-col items-center p-1">
                                    <div className="avatar mb-1">
                                        <div className="w-14 h-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                                            {artist.image ? <img src={artist.image} alt={artist.name} /> : <div className="bg-neutral w-full h-full"><UserIcon className="p-3 text-neutral-content" /></div>}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{artist.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="divider my-0"></div>

                {/* 3. TRACKS */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 flex justify-between">
                        Selected Tracks <span className="text-primary">{tracks.length}</span>
                    </h3>
                    {tracks.length === 0 ? (
                        <div className="h-20 flex items-center justify-center border border-dashed border-base-300 rounded-lg text-xs opacity-40">No tracks yet</div>
                    ) : (
                        <ul className="space-y-2">
                            {tracks.map((track) => (
                                <li key={track.id} className="flex items-center gap-3 p-2 bg-base-200/50 rounded-lg">
                                    <div className="avatar rounded h-8 w-8 shrink-0">
                                        {track.image ? <img src={track.image} alt="art" className="rounded" /> : <div className="bg-base-300 w-full h-full flex items-center justify-center"><PlayCircleIcon className="h-4 w-4" /></div>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{track.name}</p>
                                        <p className="text-[10px] opacity-60 truncate">
                                            {Array.isArray(track.artists) ? track.artists.map(a => a.name || a).join(', ') : 'Unknown'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpandedMusicPreview;