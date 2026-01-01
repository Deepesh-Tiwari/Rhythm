import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

// Hooks & Actions
import useSocketSetup from '../hooks/useSocketSetup';
import { joinRoomThunk } from '../features/room/roomThunks';
import { resetRoom , addMessage} from '../features/room/roomSlice'
import { getSocket } from '../services/socketService';


// Components (We will build these next)
import RoomSidebar from '../components/RoomSidebar';
import RoomPlayer from '../components/RoomPlayer';
import RoomQueue from '../components/RoomQueue';
import RoomChat from '../components/RoomChat';

const RoomPage = () => {
    const { code } = useParams(); // The Room Code from URL
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector(state => state.user);
    const { room, isConnected, loading } = useSelector(state => state.room);

    // 1. Initial Data Fetch (REST)
    useEffect(() => {
        if (code) {
            dispatch(joinRoomThunk(code))
                .unwrap()
                .catch((err) => {
                    console.error("Failed to join:", err);
                    // navigate('/'); // Redirect home if invalid
                });
        }

        // Cleanup when leaving
        return () => {
            dispatch(resetRoom());
        };
    }, [code, dispatch, navigate]);

    useEffect(() => {
        const socket = getSocket();
        
        // ✅ Simplified Check: If socket exists, attach listener. 
        // We keep isConnected in deps to trigger re-run when connection stabilizes.
        if (!socket) return; 

        const handleNewMessage = (message) => {
            dispatch(addMessage(message));
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [isConnected, dispatch]);

    // 2. Connect Socket (Real-Time)
    // Only connect if we have the Room ID (from the fetch above) and User ID
    useSocketSetup(room?._id, user?._id);

    if (!room) {
        return (
            <div className="h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-base-100 flex overflow-hidden">

            {/* LEFT: Members Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block w-64 border-r border-base-300 bg-base-200/50">
                <RoomSidebar />
            </div>

            {/* CENTER: Player & Queue */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 border-b border-base-300 flex items-center justify-between px-6 bg-base-100">
                    <div>
                        <h1 className="font-bold text-lg">{room.name}</h1>
                        <span className="badge badge-neutral text-xs tracking-widest">{code}</span>
                    </div>
                    <button 
                        className="btn btn-sm btn-error btn-outline"
                        onClick={() => navigate('/')}
                    >
                        Leave
                    </button>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* The Music Player */}
                    <RoomPlayer />

                    {/* The Queue */}
                    <RoomQueue />
                </div>
            </div>

            {/* RIGHT: Chat (Collapsible on Mobile usually, but static for now) */}
            <div className="w-80 border-l border-base-300 bg-base-100 flex flex-col">
                <RoomChat />
            </div>

        </div>
    );
};

export default RoomPage;


