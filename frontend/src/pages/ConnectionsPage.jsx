import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetConnectionsQuery } from '../features/social/socialApiSlice';
import ConnectionCard from '../components/ConnectionCard';
import { UsersIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/solid';

const ConnectionsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        data: connections,
        isLoading,
        isError,
        error
    } = useGetConnectionsQuery();

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="text-base-content/50 animate-pulse font-medium">Loading your circle...</span>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (isError) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center p-4">
                <div role="alert" className="alert alert-error max-w-lg shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h3 className="font-bold">Error loading connections</h3>
                        <div className="text-xs">{error?.data?.message || "Something went wrong. Please try again."}</div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Filter Logic ---
    const filteredConnections = connections?.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // --- Empty State (No Connections at all) ---
    if (!connections || connections.length === 0) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center bg-base-100">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <UsersIcon className="h-10 w-10 text-base-content/20" />
                </div>
                <h2 className="text-3xl font-extrabold text-base-content mb-2">
                    Your Circle is Empty
                </h2>
                <p className="text-base-content/60 max-w-md mb-8">
                    Music is better with friends! Discover people with similar taste and start building your network.
                </p>
                <button
                    className="btn btn-primary btn-lg gap-2 shadow-xl hover:scale-105 transition-transform"
                    onClick={() => navigate('/')} 
                >
                    <SparklesIcon className="w-5 h-5" />
                    Find People
                </button>
            </div>
        );
    }

    // --- Main UI ---
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-base-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8 border-b border-base-300 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            Connections
                            <div className="badge badge-primary badge-lg text-white font-mono shadow-sm">
                                {connections.length}
                            </div>
                        </h1>
                        <p className="text-base-content/60 mt-1">
                            Your network of music buddies.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                        <input 
                            type="text" 
                            placeholder="Search friends..." 
                            className="input input-bordered w-full pl-10 focus:input-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid Content */}
                {filteredConnections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredConnections.map((user) => (
                            <div key={user._id} className="transition-transform hover:-translate-y-1 duration-200">
                                <ConnectionCard user={user} />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Search Empty State
                    <div className="py-20 text-center opacity-50">
                        <p className="text-lg font-medium">No results found for "{searchTerm}"</p>
                        <button 
                            className="btn btn-link btn-sm mt-2 text-primary no-underline"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionsPage;