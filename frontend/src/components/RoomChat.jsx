import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { sendMessage } from "../services/roomService"; // API wrapper we made earlier

const RoomChat = () => {
    const { chatHistory, room } = useSelector(state => state.room);
    const { user } = useSelector(state => state.user);
    
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when chatHistory changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // ❌ REMOVED: Socket Listener
    // The listener is already active in RoomPage.jsx. 
    // Removing it here prevents double messages and key collision crashes.

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const content = input.trim();
        setInput(''); 
        setSending(true);

        try {
            await sendMessage(room.code, content);
        } catch (err) {
            console.error("Failed to send:", err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
            
            {/* Header */}
            <div className="h-14 border-b border-base-300 flex items-center px-4 bg-base-200/50">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 opacity-50" />
                <span className="font-bold text-sm">Room Chat</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Be the first to say hi!</p>
                    </div>
                ) : (
                    chatHistory.map((msg, index) => {
                        // ✅ FIX 1: Robust Key Generation
                        // Uses index as fallback to prevent crash if duplicates exist in Redux
                        const uniqueKey = `${msg._id || 'temp'}-${index}`;

                        // ✅ FIX 2: System Message Logic
                        if (msg.type === 'system' || !msg.sender) {
                            return (
                                <div key={uniqueKey} className="flex justify-center my-4 opacity-60">
                                    <span className="bg-base-300 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-base-content/70">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        // Regular User Message
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        
                        return (
                            <div key={uniqueKey} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                                <div className="chat-image avatar">
                                    <div className="w-8 h-8 rounded-full">
                                        <img 
                                            src={msg.sender?.profilePic || "https://via.placeholder.com/40"} 
                                            alt={msg.sender?.username || "User"} 
                                        />
                                    </div>
                                </div>
                                <div className="chat-header text-xs opacity-50 mb-1">
                                    {msg.sender?.displayName || msg.sender?.username || 'User'}
                                </div>
                                <div className={`chat-bubble text-sm min-h-0 py-2 px-3 ${isMe ? 'chat-bubble-primary' : 'chat-bubble-neutral'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-base-300 bg-base-100">
                <form onSubmit={handleSend} className="join w-full">
                    <input 
                        type="text" 
                        className="input input-bordered input-sm join-item w-full focus:outline-none" 
                        placeholder={`Message #${room?.name || 'room'}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-sm btn-primary join-item"
                        disabled={sending || !input.trim()}
                    >
                        <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                </form>
            </div>

        </div>
    );
};

export default RoomChat;