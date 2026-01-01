import { createSlice } from '@reduxjs/toolkit';
import { joinRoomThunk } from './roomThunks';

const initialState = {
    room: null,          
    activeMembers: [],   
    queue: [],          
    currentPlayback: {  
        isPlaying: false,
        youtubeId: null,
        lastUpdated: null, // T0
        position: 0
    },
    chatHistory: [],     
    isConnected: false  
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setRoomData: (state, action) => {
            state.room = action.payload;
        },
        setSocketStatus: (state, action) => {
            state.isConnected = action.payload;
        },
        updateMembers: (state, action) => {
            state.activeMembers = action.payload;
        },
        updateQueue: (state, action) => {
            state.queue = action.payload;
        },
        updatePlayback: (state, action) => {
            // Merge existing playback state with updates
            state.currentPlayback = { ...state.currentPlayback, ...action.payload };
        },
        addMessage: (state, action) => {
            // ✅ FIX: Check if message already exists
            const exists = state.chatHistory.some(msg => msg._id === action.payload._id);
            if (!exists) {
                state.chatHistory.push(action.payload);
            }
        },
        setChatHistory: (state, action) => {
            state.chatHistory = action.payload;
        },
        resetRoom: (state) => {
            // Clear everything when leaving
            return initialState;
        },
        updateHost: (state, action) => {
            if(state.room){
                state.room.host = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        // When joinRoomThunk succeeds:
        builder.addCase(joinRoomThunk.fulfilled, (state, action) => {
            state.room = action.payload.room;
            // Depending on your API structure, activeMembers might be inside room
            state.activeMembers = action.payload.room.activeMembers || [];
            state.queue = action.payload.room.queue || [];
            state.currentPlayback = action.payload.room.currentPlayback || state.currentPlayback;
            state.chatHistory = action.payload.chat; // Initial load
        });
    }
});

export const { 
    setRoomData, setSocketStatus, updateMembers, 
    updateQueue, updatePlayback, addMessage, 
    setChatHistory, resetRoom, updateHost
} = roomSlice.actions;

export default roomSlice.reducer;