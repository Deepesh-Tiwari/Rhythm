import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
    withCredentials: true,
});

export const saveMusicProfile = async (musicProfileData) => {
    try {
        // The backend route is /users/me/profile/music
        const response = await apiClient.post('/users/me/profile/music', musicProfileData);
        return response.data;
    } catch (error) {
        console.error("API Error saving music profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (userProfileData) => {
    try {
        
        const response = await apiClient.patch("/users/me", userProfileData);
        return response.data;
    } catch (error) {
        console.error("API error while updating user profile", error);
        throw error;
    }
}

export const syncSpotifyyProfile = async (userProfileData) => {
    try {
        
        const response = await apiClient.post("/users/me/sync-spotify", userProfileData);
        return response.data;
    } catch (error) {
        console.error("API error while updating user profile", error);
        throw error;
    }
}