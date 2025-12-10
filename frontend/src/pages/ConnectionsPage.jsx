import React from 'react'
import { useNavigate } from 'react-router';
import { useGetConnectionsQuery } from '../features/social/socialApiSlice';
import ConnectionCard from '../components/ConnectionCard';
import { UsersIcon } from '@heroicons/react/24/solid';



const ConnectionsPage = () => {
    const navigate = useNavigate();

    const {
        data: connections,
        isLoading,
        isError,
        error
    } = useGetConnectionsQuery();
    console.log(connections)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // 2. Error State
    if (isError) {
        console.error("Failed to load connections:", error);
        return (
            <div role="alert" className="alert alert-error max-w-lg mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error: Could not load your connections. Please try again later.</span>
            </div>
        );
    }

    if (!connections || connections.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <UsersIcon className="mx-auto h-16 w-16 text-base-content/30" />
                <h2 className="mt-4 text-2xl font-bold text-base-content">
                    Your Network is Empty
                </h2>
                <p className="mt-2 text-base-content/70">
                    You haven't made any connections yet. Start by finding people with similar music taste!
                </p>
                <div className="mt-6">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')} 
                    >
                        Find People to Connect With
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-base-content">My Connections ({connections.length})</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {connections.map(user => (
                    <ConnectionCard key={user._id} user={user} />
                ))}
            </div>
        </div>
    )
}

export default ConnectionsPage;