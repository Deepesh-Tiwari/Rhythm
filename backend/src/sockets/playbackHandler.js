const Room = require("../models/room");
const {addSongToQueue, playNextSong} = require("../services/roomService");

const playbackHandler = (io, socket) => {

    // Add a song to queue
    socket.on('queue_add', async( roomId, spotifyTrack, userId) => {

        try {

            const updatedRoom = await addSongToQueue(roomId, spotifyTrack, userId);

            io.to(roomId).emit('queue_update', {
                queue: updatedRoom.queue
            })
            
        } catch (error) {
            console.error("Socket Queue Error:", err);
            socket.emit('error', { message: "Failed to add song" });
        }
    })


    // PLAY (Host Only)
    socket.on('player_play', async ({ roomId, youtubeId, seekTime }) => {
        console.log(`▶️ Play ${youtubeId} in ${roomId}`);
        
        // Update DB State
        await Room.findByIdAndUpdate(roomId, {
            'currentPlayback.youtubeId': youtubeId,
            'currentPlayback.isPlaying': true,
            'currentPlayback.isPaused': false,
            'currentPlayback.startedAt': new Date(Date.now() - (seekTime * 1000 || 0))
        });

        // Broadcast Sync Command
        io.to(roomId).emit('playback_sync', {
            action: 'play',
            youtubeId: youtubeId,
            seekTime: seekTime || 0
        });
    });

    // PAUSE (Host Only)
    socket.on('player_pause', async ({ roomId }) => {
        console.log(`⏸️ Pause ${roomId}`);

        await Room.findByIdAndUpdate(roomId, {
            'currentPlayback.isPaused': true,
            'currentPlayback.isPlaying': false
        });

        io.to(roomId).emit('playback_sync', { action: 'pause' });
    });

    // TRACK ENDED (Auto-DJ)
    socket.on('track_ended', async ({ roomId }) => {
        console.log(`🏁 Track Ended in ${roomId}`);
        const updatedRoom = await playNextSong(roomId);

        if (updatedRoom.currentPlayback.youtubeId) {
            // Play next song
            io.to(roomId).emit('playback_sync', {
                action: 'play',
                youtubeId: updatedRoom.currentPlayback.youtubeId,
                seekTime: 0
            });
            // Update Queue UI
            io.to(roomId).emit('queue_update', { queue: updatedRoom.queue });
        } else {
            // Stop if empty
            io.to(roomId).emit('playback_sync', { action: 'stop' });
        }
    });
}

module.exports = playbackHandler;

