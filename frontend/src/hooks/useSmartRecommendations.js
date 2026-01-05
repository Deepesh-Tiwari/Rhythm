import { useGetRecommendationsQuery, useGetRandomRecommendationsQuery } from "../features/social/socialApiSlice";

const useSmartRecommendations = () => {
    
    const aiQuery = useGetRecommendationsQuery(20, {
        pollingInterval: 15000, 
    });

    // Determine if we need Fallback
    // If AI Error OR (AI Success but Empty List)
    const useFallback = aiQuery.isError || (aiQuery.isSuccess && aiQuery.data?.length === 0);

    // Try Random Recommendations (Only if fallback needed)
    const randomQuery = useGetRandomRecommendationsQuery(20, {
        skip: !useFallback, // Don't fetch random if AI is working
    });

    // 4. Merge Results
    return {
        // Return Random data if fallback is active, otherwise AI data
        data: useFallback ? randomQuery.data : aiQuery.data,
        
        // Loading if either is strictly loading (ignore background refetching)
        isLoading: aiQuery.isLoading || (useFallback && randomQuery.isLoading),
        
        // Helper flags for UI
        isUsingFallback: useFallback,
        isError: useFallback && randomQuery.isError, // Only error if BOTH fail
        
        // Pass refetch functions
        refetch: () => {
            aiQuery.refetch();
            if (useFallback) randomQuery.refetch();
        }
    };
};

export default useSmartRecommendations;