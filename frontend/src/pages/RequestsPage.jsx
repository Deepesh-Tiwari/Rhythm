import React, { useState } from 'react';
import { useGetRequestsQuery, useUpdateConnectionRequestMutation } from '../features/social/socialApiSlice'; 
import RequestCard from '../components/RequestCard'; 
import { InboxIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

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
        setProcessingId(requestId);
        try {
            await updateRequest({ requestId, status }).unwrap();
            const action = status === 'accepted' ? 'Connection accepted!' : 'Request declined.';
            toast.success(action);
        } catch (err) {
            console.error(`Failed to ${status} request:`, err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="text-base-content/50 animate-pulse font-medium">Checking inbox...</span>
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
                        <h3 className="font-bold">Error loading requests</h3>
                        <div className="text-xs">{error?.data?.message || "Something went wrong."}</div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Empty State ---
    if (!requests || requests.length === 0) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center bg-base-100">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 shadow-inner animate-in fade-in zoom-in duration-500">
                    <InboxIcon className="h-10 w-10 text-base-content/30" />
                </div>
                <h2 className="text-3xl font-extrabold text-base-content mb-2">
                    All Caught Up!
                </h2>
                <p className="text-base-content/60 max-w-md">
                    You have no pending connection requests at the moment.
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm text-success font-medium bg-success/10 px-4 py-2 rounded-full">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Inbox Zero achieved</span>
                </div>
            </div>
        );
    }

    // --- Main UI ---
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-base-100 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 border-b border-base-300 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Requests
                            <div className="badge badge-secondary badge-lg text-white font-mono shadow-sm">
                                {requests.length}
                            </div>
                        </h1>
                        <p className="text-base-content/60 mt-1">
                            People who want to connect with you.
                        </p>
                    </div>
                </div>

                {/* List Content */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {requests.map((request) => (
                        <div 
                            key={request._id} 
                            className="bg-base-200/50 rounded-2xl p-1 transition-all hover:bg-base-200 hover:shadow-md"
                        >
                            <RequestCard 
                                request={request}
                                onAccept={() => handleUpdateRequest(request._id, 'accepted')}
                                onDecline={() => handleUpdateRequest(request._id, 'rejected')} // Note: 'rejected' is usually the enum in backend, check schema if it's 'declined'
                                isUpdating={processingId === request._id}
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default RequestsPage;