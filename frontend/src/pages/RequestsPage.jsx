// src/pages/RequestsPage.jsx

import React, { useState } from 'react';
import { useGetRequestsQuery, useUpdateConnectionRequestMutation } from '../features/social/socialApiSlice'; // Adjust path
import RequestCard from '../components/RequestCard'; // Adjust path
import { InboxIcon } from '@heroicons/react/24/outline';

const RequestsPage = () => {
    // State to track which request is currently being processed
    const [processingId, setProcessingId] = useState(null);

    // RTK Query Hooks
    const {
        data: requests,
        isLoading,
        isError,
        error,
    } = useGetRequestsQuery();

    const [updateRequest] = useUpdateConnectionRequestMutation();

    const handleUpdateRequest = async (requestId, status) => {
        setProcessingId(requestId); // Set loading state for this specific card
        try {
            await updateRequest({ requestId, status }).unwrap();
            // The list will automatically update because of the 'invalidatesTags' in your slice.
        } catch (err) {
            console.error(`Failed to ${status} request:`, err);
            alert(`There was an error. Could not ${status} the request.`);
        } finally {
            setProcessingId(null); // Clear loading state regardless of outcome
        }
    };

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // 2. Error State
    if (isError) {
        console.error("Failed to load requests:", error);
        return (
            <div role="alert" className="alert alert-error max-w-lg mx-auto">
                <span>Error: Could not load your connection requests.</span>
            </div>
        );
    }

    // 3. Empty State
    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <InboxIcon className="mx-auto h-16 w-16 text-base-content/30" />
                <h2 className="mt-4 text-2xl font-bold text-base-content">
                    No Pending Requests
                </h2>
                <p className="mt-2 text-base-content/70">
                    You're all caught up!
                </p>
            </div>
        );
    }

    // 4. Success State
    return (
        <div className="container mx-auto max-w-2xl p-4">
            <h1 className="text-3xl font-bold mb-6 text-base-content">
                Connection Requests ({requests.length})
            </h1>
            
            <div className="space-y-4">
                {requests.map(request => (
                    <RequestCard 
                        key={request._id} 
                        request={request}
                        onAccept={() => handleUpdateRequest(request._id, 'accepted')}
                        onDecline={() => handleUpdateRequest(request._id, 'declined')}
                        isUpdating={processingId === request._id}
                    />
                ))}
            </div>
        </div>
    );
};

export default RequestsPage;