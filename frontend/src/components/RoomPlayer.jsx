
import { voteSkipThunk } from "../features/room/roomThunks";
import { updatePlayback, updateMembers, updateHost } from "../features/room/roomSlice";
import { getSocket } from "../services/socketService";
import { getStreamUrl } from "../services/roomService";

import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    ExclamationTriangleIcon,
    SpeakerWaveIcon,
} from "@heroicons/react/24/solid";
import { toast } from 'react-toastify';

import { SyncEngine } from "../utils/syncEngine";

const NO_TRACK_IMG = "https://placehold.co/400x400/1a1a1a/ffffff?text=Waiting+for+music";

const RoomPlayer = () => {
    const dispatch = useDispatch();
    const audioRef = useRef(null);
    const engineRef = useRef(null);

    // 1. Redux State
    const { currentPlayback, room, queue } = useSelector((state) => state.room);
    const { user } = useSelector((state) => state.user);

    // 2. Local UI State
    const [isBuffering, setIsBuffering] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [blockedAutoplay, setBlockedAutoplay] = useState(false);

    // ✅ NEW: Store the clock offset here so Redux loop can use it
    const [clockOffset, setClockOffset] = useState(0);
    const [isClockSynced, setIsClockSynced] = useState(false);

    // 3. Derived State
    const hostId = room?.host?._id || room?.host; // Handle Object OR String
    const isHost = String(hostId) === String(user?._id);
    const isPlaying = currentPlayback?.isPlaying; // True/False
    const anchorPosition = currentPlayback?.position || 0; // P0 (Where it started)
    const lastUpdated = currentPlayback?.lastUpdated;
    const youtubeId = currentPlayback?.youtubeId;
    const trackName = currentPlayback?.name || "Nothing Playing";
    const artistName = currentPlayback?.artist || "Add a song to start";
    const coverImage = currentPlayback?.image || NO_TRACK_IMG;
    const retryCount = useRef(0);


    useEffect(() => {
        retryCount.current = 0;
        setErrorCount(0);
        setIsBuffering(true);
        setBlockedAutoplay(false);
        setProgress(0);
    }, [youtubeId]);

    // --- INITIALIZE SYNC ENGINE ---
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const engine = new SyncEngine(
            socket,
            (status, delayMs) => {
                if (status === 'SCHEDULING') {
                    console.log(`⏳ Sync: Starting in ${delayMs}ms...`);
                }
                else if (status === 'PLAYING') {
                    setIsBuffering(false);
                    audioRef.current?.play().catch(err => {
                        console.warn("Autoplay blocked:", err.message);
                        setBlockedAutoplay(true);
                    });
                }
                else if (status === 'PAUSED') {
                    audioRef.current?.pause();
                }
            },
            (pos) => {
                if (audioRef.current) {
                    if (Math.abs(audioRef.current.currentTime - pos) > 0.2) {
                        audioRef.current.currentTime = pos;
                    }
                }
            }
        );

        // ✅ FIX: Capture the offset after sync finishes
        engine.syncClock().then(() => {
            setClockOffset(engine.offset);
            setIsClockSynced(true);
            console.log("✅ RoomPlayer: Clock synced with offset", engine.offset);
        });

        engineRef.current = engine;

        return () => {
            if (socket) socket.off('sync_event');
        };
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleSync = (data) => {
            console.log("📡 Received Sync:", data);

            if (data.action === 'play') {

                const isNewSong = data.youtubeId !== youtubeId;

                dispatch(updatePlayback({
                    isPlaying: true,
                    isPaused: false,
                    youtubeId: data.youtubeId,
                    ...(data.name && { name: data.name }),
                    ...(data.artist && { artist: data.artist }),
                    ...(data.image && { image: data.image }),
                    lastUpdated: data.serverTime, // T0
                    position: data.seekTime       // P0
                }));
                
                if (isNewSong && data.name) {
                toast.success(`▶️ Now Playing: ${data.name}`, { 
                    icon: "💿",
                    autoClose: 2000 
                });
            }
            }
            else if (data.action === 'pause') {
                dispatch(updatePlayback({
                    isPlaying: false,
                    isPaused: true,
                    // We don't update lastUpdated on pause, just position
                    position: data.seekTime
                }));
            }
            else if (data.action === 'stop') {
                console.log("🛑 Received Stop Command");

                // Stop the Engine
                if (engineRef.current) {
                    // We can just pause locally to stop the loop
                    engineRef.current.pause(0);
                }

                // Reset Redux State
                dispatch(updatePlayback({
                    isPlaying: false,
                    youtubeId: null, // This hides the player
                    name: "Nothing Playing",
                    artist: "Add a song to start",
                    image: null,
                    position: 0,
                    lastUpdated: null
                }));

                // Reset local UI
                setProgress(0);
                setDuration(0);
            }
        };

        socket.on('playback_sync', handleSync);
        return () => socket.off('playback_sync', handleSync);
    }, [dispatch]);


    // --- ANCHOR POINT SYNC LOGIC ---
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !youtubeId) return;

        // Wait for NTP Clock Sync before doing math
        if (!isClockSynced || !lastUpdated) return;

        // CASE A: PLAYING (Dynamic Math)
        if (isPlaying) {
            const t0 = new Date(lastUpdated).getTime();
            const serverNow = Date.now() + clockOffset;

            // FORMULA: Current = Anchor + (Elapsed Time)
            const secondsElapsed = (serverNow - t0) / 1000;
            const targetTime = anchorPosition + secondsElapsed;

            // Safety Check: Is target valid?
            if (targetTime >= 0 && (duration === 0 || targetTime < duration + 5)) {
                // Drift Correction: Only jump if > 2s off
                if (Math.abs(audio.currentTime - targetTime) > 2) {
                    console.log(`⚡ Syncing to Anchor: ${targetTime.toFixed(1)}s`);
                    audio.currentTime = targetTime;
                }
            }

            // Ensure Audio is running
            if (audio.paused && !blockedAutoplay && !isBuffering) {
                audio.play().catch(() => setBlockedAutoplay(true));
            }
        }

        // CASE B: PAUSED (Static Math)
        else {
            // Target is simply the stored position
            const targetTime = anchorPosition;

            // Force Snap to exact pause frame
            if (Math.abs(audio.currentTime - targetTime) > 0.5) {
                console.log(`⏸️ Snapping to Pause Point: ${targetTime.toFixed(1)}s`);
                audio.currentTime = targetTime;
            }

            // Ensure Audio is stopped
            if (!audio.paused) audio.pause();
        }

    }, [
        isPlaying,
        anchorPosition,
        lastUpdated,
        clockOffset,
        isClockSynced,
        duration,
        youtubeId,
        isBuffering,
        blockedAutoplay
    ]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // Listener for Room Updates
        socket.on('room_update', (data) => {
            console.log("Room Update:", data);

            if (data.type === 'MEMBERS_UPDATE') {
                dispatch(updateMembers(data.activeMembers));

                // ✅ CHECK FOR NEW HOST
                if (data.newHostId) {
                    // console.log("👑 New Host Promoted:", data.newHostId);
                    toast.info("👑 The Host has changed!");
                    dispatch(updateHost(data.newHostId));
                }
            }
        });

        return () => {
            socket.off('room_update');
        };
    }, [dispatch]);


    // --- HANDLERS ---
    const handlePlayPause = () => {
        const socket = getSocket();
        if (!socket || !isHost) return;

        const currentTime = audioRef.current ? audioRef.current.currentTime : 0;

        if (isPlaying) {
            // PAUSE
            engineRef.current?.pause(currentTime);
            socket.emit("player_pause", {
                roomId: room._id,
                seekTime: currentTime // ✅ ADDED: Send seekTime to backend
            });
        } else {
            if (youtubeId) {
                engineRef.current?.play(currentTime);
                socket.emit("player_play", {
                    roomId: room._id,
                    youtubeId,
                    seekTime: currentTime
                });
            } else if (queue.length > 0) {
                socket.emit("track_ended", { roomId: room._id });
            } else {
                toast.info("Queue is empty! Add a song to start.");
            }
        }
    };

    const handleVoteSkip = () => {
        if (room?.code) dispatch(voteSkipThunk(room.code));
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const forcePlay = () => {
        if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            engineRef.current?.play(currentTime);
            audioRef.current.play().catch(e => console.error("Force play failed", e));
            setBlockedAutoplay(false);
        }
    };

    const handleError = (e) => {
        const errorCode = e.target?.error?.code;
        // Suppress console spam for initial retries
        if (retryCount.current > 0) {
            console.warn(`⚠️ Stream Error (Code ${errorCode}). Retry: ${retryCount.current}/4`);
        }

        // Increase max retries to 4
        if (retryCount.current < 4) { 
            retryCount.current += 1;
            
            // Don't show buffering spinner immediately if it's a quick fix (prevent flicker)
            if (retryCount.current > 1) setIsBuffering(true);

            // ⚡ FAST RETRY LOGIC
            // Attempt 1: 250ms (Catches the "0 byte file" issue instantly)
            // Attempt 2: 500ms
            // Attempt 3: 1000ms
            // Attempt 4: 2000ms
            const delay = retryCount.current === 1 ? 250 : Math.pow(2, retryCount.current - 1) * 250;
            
            console.log(`⏳ Stream failed. Retrying in ${delay}ms...`);

            setTimeout(() => {
                if (audioRef.current) {
                    const streamUrl = getStreamUrl(youtubeId);
                    // Add timestamp to bust browser cache of the 500 error
                    audioRef.current.src = `${streamUrl}?t=${Date.now()}`;
                    audioRef.current.load();
                    
                    if (isPlaying) {
                        audioRef.current.play().catch(err => {
                            // Ignore play errors during retry, they will be caught by next loop
                        });
                    }
                }
            }, delay);
        } else {
            // Retries exhausted - NOW show the red error
            if (errorCount > 0) return;
            setErrorCount(1);
            setIsBuffering(false);
            
            console.error("❌ Stream failed permanently. Host should auto-skip.");
            
            if (isHost) {
                setTimeout(() => {
                    getSocket()?.emit("track_ended", { roomId: room._id });
                }, 1000);
            }
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl overflow-hidden group border border-base-300">

            {/* --- VISUAL UI --- */}
            <div className="flex flex-col md:flex-row border-b border-base-300">

                {/* Album Art Container */}
                <figure className="w-full md:w-48 h-48 shrink-0 bg-black relative">
                    <img src={coverImage} alt="Album Art" className="w-full h-full object-cover opacity-90" />

                    {/* 1. Error Overlay */}
                    {errorCount > 0 && (
                        <div className="absolute inset-0 bg-error/90 flex flex-col items-center justify-center text-white z-20">
                            <ExclamationTriangleIcon className="h-8 w-8 mb-1" />
                            <span className="text-xs font-bold">Stream Failed</span>
                        </div>
                    )}

                    {/* 2. Autoplay Blocked Overlay */}
                    {blockedAutoplay && !errorCount && (
                        <div
                            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white cursor-pointer z-30 animate-pulse"
                            onClick={forcePlay}
                        >
                            <SpeakerWaveIcon className="h-10 w-10 text-success mb-2" />
                            <span className="text-xs font-bold uppercase tracking-wider">Click to Join</span>
                        </div>
                    )}

                    {/* 3. Buffering Indicator */}
                    {isBuffering && isPlaying && !errorCount && !blockedAutoplay && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                            <span className="loading loading-spinner loading-md text-white"></span>
                        </div>
                    )}

                    {/* 4. Host Controls (Hover) */}
                    {isHost && !errorCount && !blockedAutoplay && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                            onClick={handlePlayPause}
                        >
                            <button className="btn btn-circle btn-primary pointer-events-none shadow-xl transform scale-110 border-none">
                                {isPlaying ? (
                                    <PauseIcon className="h-10 w-10" />
                                ) : (
                                    <PlayIcon className="h-10 w-10 pl-1" />
                                )}
                            </button>
                        </div>
                    )}
                </figure>

                {/* Track Info */}
                <div className="card-body p-4 justify-center flex-1">
                    <h2 className="card-title text-xl line-clamp-1">
                        {trackName}
                    </h2>
                    <p className="text-base-content/60 font-medium text-sm">{artistName}</p>

                    {/* Progress Bar */}
                    <div className="w-full mt-4">
                        <progress
                            className={`progress w-full h-2 ${errorCount ? 'progress-error' : 'progress-primary'}`}
                            value={progress}
                            max={duration || 100}
                        ></progress>
                        <div className="flex justify-between text-[10px] font-mono opacity-50 mt-1">
                            <span>{new Date(progress * 1000).toISOString().substr(14, 5)}</span>
                            <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
                        </div>
                    </div>

                    <div className="card-actions justify-end mt-2">
                        <button
                            className="btn btn-sm btn-ghost gap-2 hover:bg-base-300"
                            onClick={handleVoteSkip}
                        >
                            <ForwardIcon className="h-4 w-4" />
                            Vote Skip
                        </button>
                    </div>
                </div>
            </div>

            {/* --- HIDDEN NATIVE AUDIO ELEMENT --- */}
            {youtubeId && (
                <audio
                    ref={audioRef}
                    src={getStreamUrl(youtubeId)}
                    preload="auto"
                    className="hidden"

                    onCanPlay={() => setIsBuffering(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => {
                        setIsBuffering(false);
                        setBlockedAutoplay(false);
                    }}
                    onTimeUpdate={handleTimeUpdate}

                    onEnded={() => {
                        console.log("🏁 Song Finished");
                        if (isHost) {
                            getSocket()?.emit("track_ended", { roomId: room._id });
                        }
                    }}

                    onError={handleError}
                />
            )}
        </div>
    );
};

export default RoomPlayer;