import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
  withCredentials: true,
});

export const getDiscoveryList = async () => {
  try {
    const response = await apiClient.get('/music/discover');
    return response.data; // { trendingTracks: [...], trendingArtists: [...] }
  } catch (error) {
    console.error("API Error fetching discovery list:", error);
    throw error;
  }
};

export const searchMusic = async (query, type) => {
  try {
    const response = await apiClient.get('/music/search', {
      params: { q: query, type: type }
    });
    return response.data;
  } catch (error) {
    console.error(`API Error searching for ${type}:`, error);
    throw error;
  }
};