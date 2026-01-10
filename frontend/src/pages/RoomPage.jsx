import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

// Hooks & Actions
import useSocketSetup from '../hooks/useSocketSetup';
import { joinRoomThunk } from '../features/room/roomThunks';
import { resetRoom, addMessage } from '../features/room/roomSlice';
import { getSocket } from '../services/socketService';

// Components
import RoomSidebar from '../components/RoomSidebar';
import RoomPlayer from '../components/RoomPlayer';
import RoomQueue from '../components/RoomQueue';
import RoomChat from '../components/RoomChat';

const RoomPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector(state => state.user);
    const { room, isConnected } = useSelector(state => state.room);

    // 1. Initial Data Fetch (REST)
    useEffect(() => {
        if (code) {
            dispatch(joinRoomThunk(code))
                .unwrap()
                .catch((err) => {
                    console.error("Failed to join:", err);
                });
        }
        return () => {
            dispatch(resetRoom());
        };
    }, [code, dispatch, navigate]);

    useEffect(() => {
        const socket = getSocket();
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
    useSocketSetup(room?._id, user?._id);

    if (!room) {
        return (
            <div className="h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        // PARENT: Scrollable on Mobile, Hidden Overflow on Desktop
        <div className="w-full bg-base-100 flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] overflow-y-auto lg:overflow-hidden">

            {/* --- LEFT PANEL: Members Sidebar --- */}
            {/* Mobile: Order 2 (Middle). Fixed height so it doesn't take up too much space. */}
            {/* Desktop: Order 1 (Left). Full height. */}
            <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-base-300 bg-base-200/50 order-2 lg:order-1 h-64 lg:h-full overflow-y-auto shrink-0">
                <RoomSidebar />
            </div>

            {/* --- CENTER PANEL: Player & Queue --- */}
            {/* Mobile: Order 1 (Top). Auto height. */}
            {/* Desktop: Order 2 (Center). Scrollable. */}
            <div className="flex-1 flex flex-col min-w-0 order-1 lg:order-2 h-auto lg:h-full lg:overflow-y-auto">
                {/* Header */}
                <div className="h-16 border-b border-base-300 flex items-center justify-between px-6 bg-base-100 shrink-0 sticky top-0 z-20">
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

                {/* Content Area */}
                <div className="p-6 space-y-6">
                    <RoomPlayer />
                    <RoomQueue />
                </div>
            </div>

            {/* --- RIGHT PANEL: Chat --- */}
            {/* Mobile: Order 3 (Bottom). Fixed height so user can scroll messages. */}
            {/* Desktop: Order 3 (Right). Full height. */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-base-300 bg-base-100 flex flex-col order-3 lg:order-3 h-[600px] lg:h-full shrink-0">
                <RoomChat />
            </div>

        </div>
    );
};

export default RoomPage;