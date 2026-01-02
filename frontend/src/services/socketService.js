import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

let socket;

export const connectSocket = () => {
    if(!socket){
        socket = io(API_BASE_URL, {
            withCredentials: true,
            autoConnect: false
        });
    }
    return socket;
}

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

