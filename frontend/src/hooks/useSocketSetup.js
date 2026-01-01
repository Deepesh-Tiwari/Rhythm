import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from '../services/socketService';
import { 
    setSocketStatus, updateMembers, updateQueue, 
    updatePlayback, addMessage 
} from '../features/room/roomSlice';

const useSocketSetup = (roomId, userId) => {
    const dispatch = useDispatch();

    useEffect(() => {
       
        const socket = connectSocket();
        socket.connect();
        
        if (roomId && userId) {
            socket.emit('join_room', { roomId, userId });
        }


        const onConnect = () => dispatch(setSocketStatus(true));
        const onDisconnect = () => dispatch(setSocketStatus(false));
        
        const onRoomUpdate = (data) => {
            if (data.type === 'MEMBERS_UPDATE') {
                dispatch(updateMembers(data.activeMembers));
            }
        };

        const onQueueUpdate = ({ queue }) => {
            console.log("Store: Queue updated", queue.length);
            dispatch(updateQueue(queue));
        };

        const onPlaybackSync = (data) => {
            // data: { action, youtubeId, seekTime }
            if (data.action === 'play') {
                dispatch(updatePlayback({ 
                    isPlaying: true, 
                    youtubeId: data.youtubeId,
                    isPaused: false
                }));
            } else if (data.action === 'pause') {
                dispatch(updatePlayback({ isPlaying: false, isPaused: true }));
            }
        };

        const onNewMessage = (msg) => {
            dispatch(addMessage(msg));
        };

        // 4. Attach Listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room_update', onRoomUpdate);
        socket.on('queue_update', onQueueUpdate);
        socket.on('playback_sync', onPlaybackSync);
        socket.on('new_message', onNewMessage);

        // 5. Cleanup
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room_update', onRoomUpdate);
            socket.off('queue_update', onQueueUpdate);
            socket.off('playback_sync', onPlaybackSync);
            socket.off('new_message', onNewMessage);
            // Optional: disconnectSocket() if you want to close connection completely
        };

    }, [dispatch, roomId, userId]);
};

export default useSocketSetup;