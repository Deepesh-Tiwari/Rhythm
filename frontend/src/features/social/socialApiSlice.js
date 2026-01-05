import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

export const socialApiSlice = createApi({
    reducerPath: 'socialApi',

    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE_URL}/users`,
        credentials: 'include',
    }),

    tagTypes: ['Recommendations', 'Connections', 'Requests', 'Profile'],

    endpoints: (builder) => ({
        // --- Query Endpoints (for GET requests) ---

        getRecommendations: builder.query({
            query: (limit = 20) => `/recommendations?limit=${limit}`,
            providesTags: ['Recommendations'],
        }),

        getRandomRecommendations : builder.query({
            query : (limit = 20) => `/recommendations/random?limit=${limit}`,
            providesTags: ['Recommendations']
        }),

        getUserProfile: builder.query({
            query: (username) => `/${username}`, // This will make a GET request to /users/:username
            transformResponse: (response) => response.userData,
            providesTags: (result, error, username) => [{ type: 'Profile', id: username }],
        }),

        getConnections: builder.query({
            query: () => '/connections',
            transformResponse: (response) => response.data,
            providesTags: ['Connections'],
        }),

        getRequests: builder.query({
            query: (status = 'pending') => `/requests?status=${status}`,
            transformResponse: (response) => response.data,
            providesTags: ['Requests'],
        }),

        // --- Mutation Endpoints (for POST, PATCH, DELETE) ---

        sendConnectionRequest: builder.mutation({
            query: (toUserId) => ({
                url: '/requests',
                method: 'POST',
                body: { toUserId },
            }),
            invalidatesTags: ['Recommendations'],
        }),

        updateConnectionRequest: builder.mutation({
            query: ({ requestId, status }) => ({
                url: `/requests/${requestId}`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Requests', 'Connections'],
        }),

    })
})

export const {
  useGetRecommendationsQuery,
  useGetRandomRecommendationsQuery,
  useGetUserProfileQuery,
  useGetConnectionsQuery,
  useGetRequestsQuery,
  useSendConnectionRequestMutation,
  useUpdateConnectionRequestMutation,
} = socialApiSlice;