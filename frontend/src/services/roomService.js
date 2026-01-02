import axios from 'axios';

// Assuming you have a configured axios instance (e.g., api.js) 
// If not, use standard axios with Credentials true
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/rooms`,
    withCredentials: true // Crucial for sending Cookies/Auth
});

export const getStreamUrl = (videoId) => {
    return `${API_BASE_URL}/music/stream/${videoId}`;
};

// 1. Room Management
export const createRoom = async (roomData) => {
    // roomData: { name, description, isPublic, genres }
    const response = await api.post('/', roomData);
    return response.data;
};

export const getPublicRooms = async (page = 1, limit = 10) => {
    const response = await api.get(`/?page=${page}&limit=${limit}`);
    return response.data;
};

export const getRoomByCode = async (code) => {
    const response = await api.get(`/${code}`);
    return response.data; // Returns { room, myRole }
};

export const updateRoomSettings = async (code, updates) => {
    const response = await api.put(`/${code}`, updates);
    return response.data;
};

export const closeRoom = async (code) => {
    const response = await api.delete(`/${code}`);
    return response.data;
};

// 2. Playback & Queue
export const addSongToQueue = async (code, spotifyTrack) => {
    const response = await api.post(`/${code}/queue`, { spotifyTrack });
    return response.data;
};

export const removeSongFromQueue = async (code, songId) => {
    const response = await api.delete(`/${code}/queue/${songId}`);
    return response.data;
};

export const voteToSkip = async (code) => {
    const response = await api.post(`/${code}/vote`);
    return response.data;
};

// 3. Chat
export const getChatHistory = async (code, limit = 50, beforeId = null) => {
    let url = `/${code}/messages?limit=${limit}`;
    if (beforeId) url += `&before=${beforeId}`;
    
    const response = await api.get(url);
    return response.data;
};

export const sendMessage = async (code, content) => {
    const response = await api.post(`/${code}/messages`, { content });
    return response.data;
};

// 4. Membership
export const getRoomMembers = async (code) => {
    const response = await api.get(`/${code}/members`);
    return response.data;
};

export const generateInvite = async (code) => {
    const response = await api.post(`/${code}/invite`);
    return response.data;
};