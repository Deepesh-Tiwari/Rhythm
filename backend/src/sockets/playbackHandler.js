const Room = require("../models/room");
const { addSongToQueue, playNextSong } = require("../services/roomService");
const Message = require("../models/message")

const playbackHandler = (io, socket) => {

    socket.on('get_server_time', (callback) => {
        if (typeof callback === 'function') {
            callback(Date.now());
        }
    })

    socket.on('sync_event', (data) => {
        const { roomId } = data;

        socket.to(roomId).emit('sync_event', data);
    })

    // Add a song to queue
    socket.on('queue_add', async ({ roomId, spotifyTrack, userId }) => {

        try {

            console.log(`➕ Adding to queue: ${roomId}`);

            const room = await addSongToQueue(roomId, spotifyTrack, userId);

            const isIdle = !room.currentPlayback || !room.currentPlayback.youtubeId;

            if (isIdle) {
                console.log(`🚀 Queue was empty. Auto-playing first song.`);

                // A. Move song from Queue to CurrentPlayback
                room = await playNextSong(roomId);

                if (room && room.currentPlayback && room.currentPlayback.youtubeId) {
                    const serverTime = Date.now();
                    const nextTrack = room.currentPlayback;

                    // B. Set Anchor Point (Start Playing)
                    await Room.findByIdAndUpdate(roomId, {
                        'currentPlayback.isPlaying': true,
                        'currentPlayback.isPaused': false, // Ensure it's not paused
                        'currentPlayback.lastUpdated': serverTime,
                        'currentPlayback.position': 0
                    });

                    // C. Broadcast PLAY immediately
                    io.to(roomId).emit('playback_sync', {
                        action: 'play',
                        youtubeId: nextTrack.youtubeId,
                        seekTime: 0,
                        serverTime,
                        name: nextTrack.name,
                        artist: nextTrack.artist,
                        image: nextTrack.image
                    });

                    try {
                    const systemMsg = new Message({
                        room: room._id,
                        sender: null,
                        content: `🎵 Now Playing: ${nextTrack.name} - ${nextTrack.artist}`,
                        type: 'system'
                    });
                    await systemMsg.save();
                    io.to(room._id.toString()).emit('new_message', systemMsg);
                } catch (msgErr) {
                    console.error("System Msg Error:", msgErr);
                }
                }
            }

            io.to(roomId).emit('queue_update', {
                queue: room.queue
            });

        } catch (error) {
            console.error("Socket Queue Error:", err);
            socket.emit('error', { message: "Failed to add song" });
        }
    })


    // PLAY (Host Only)
    socket.on('player_play', async ({ roomId, youtubeId, seekTime }) => {
        try {
            const serverTime = Date.now();
            console.log(`▶️ Play ${roomId} | Anchor: ${seekTime}s`);

            // Update DB State
            await Room.findByIdAndUpdate(roomId, {
                'currentPlayback.isPlaying': true,
                'currentPlayback.youtubeId': youtubeId,
                'currentPlayback.lastUpdated': serverTime, // T0
                'currentPlayback.position': seekTime || 0  // P0
            });

            // Broadcast Sync Command
            io.to(roomId).emit('playback_sync', {
                action: 'play',
                youtubeId,
                seekTime,
                serverTime // Helping clients sync
            });

        } catch (err) {
            console.error("Play Error:", err);
        }
    });

    // PAUSE (Host Only)
    socket.on('player_pause', async ({ roomId , seekTime}) => {
        try {
            console.log(`⏸️ Pause ${roomId} | Frozen at: ${seekTime}s`);

            await Room.findByIdAndUpdate(roomId, {
                'currentPlayback.isPlaying': false,
                'currentPlayback.lastUpdated': Date.now(),
                'currentPlayback.position': seekTime || 0
            });

            io.to(roomId).emit('playback_sync', { 
                action: 'pause', 
                seekTime 
            });
        } catch (err) {
            console.error("Pause Error:", err);
        }
    });

    // 4. TRACK ENDED / START QUEUE (Auto-DJ)
    socket.on('track_ended', async ({ roomId }) => {
        try {
            console.log(`🏁 Track Ended signal received for Room ${roomId}`);

            const updatedRoom = await playNextSong(roomId);

            // FIX: Check if room exists and has playback
            if (updatedRoom && updatedRoom.currentPlayback && updatedRoom.currentPlayback.youtubeId) {
                const nextTrack = updatedRoom.currentPlayback;
                const serverTime = Date.now(); 
                console.log(`🚀 Playing Next: ${nextTrack.name}`);

                await Room.findByIdAndUpdate(roomId, {
                    'currentPlayback.isPlaying': true,
                    'currentPlayback.lastUpdated': serverTime,
                    'currentPlayback.position': 0,
                    'currentPlayback.skipVotes': [] 
                });

                // 1. Play new song
                io.to(roomId).emit('playback_sync', {
                    action: 'play',
                    youtubeId: nextTrack.youtubeId,
                    seekTime: 0,
                    serverTime,
                    name : nextTrack.name,
                    artist : nextTrack.artist,
                    image : nextTrack.image
                });

                try {
                    const systemMsg = new Message({
                        room: roomId,
                        sender: null,
                        content: `🎵 Now Playing: ${nextTrack.name} - ${nextTrack.artist}`,
                        type: 'system'
                    });
                    await systemMsg.save();
                    io.to(roomId).emit('new_message', systemMsg);
                } catch (msgErr) {
                    console.error("System Msg Error:", msgErr);
                }

                // 2. Update Queue list
                io.to(roomId).emit('queue_update', { queue: updatedRoom.queue });
            } else {
                console.log("🛑 Queue empty. Stopping.");
                io.to(roomId).emit('playback_sync', { action: 'stop' });
            }
        } catch (error) {
            // FIX: Added Error Handling here
            console.error("❌ Track End Error:", error.message);
        }
    });
}

module.exports = playbackHandler;

