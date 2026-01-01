import { createAsyncThunk } from "@reduxjs/toolkit";
import * as roomService from "../../services/roomService"

export const joinRoomThunk = createAsyncThunk(
    'room/join',
    async (code, { rejectWithValue }) => {
        try {
        
            const roomData = await roomService.getRoomByCode(code);
            const chatData = await roomService.getChatHistory(code);
            
            return { room: roomData.room, chat: chatData };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to join');
        }
    }
)

export const addSongThunk = createAsyncThunk(
    'room/addSong',
    async ({ code, track }, { rejectWithValue }) => {
        try {
            const data = await roomService.addSongToQueue(code, track);
            return data.queue; // We might not strictly need this if Socket updates us, but good for optimistic UI
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const voteSkipThunk = createAsyncThunk(
    'room/voteSkip',
    async (code, { rejectWithValue }) => {
        try {
            const data = await roomService.voteToSkip(code);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);