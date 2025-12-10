import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})

export const SignupUser = async (username, email, password) => {
    try {
        const response = await apiClient.post('/auth/signup', {
            username,
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Signup failed. Please try again.');
    }
}

export const loginUser = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
}

export const redirectToSpotify = () => {
  window.location.href = `http://127.0.0.1:3000/auth/spotify`;
};

export const getUser = async () => {
    try {
        const response = await apiClient.get('/users/me');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
}

export const logoutUser = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'API call failed, Please try again.');
    }
}

