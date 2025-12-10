import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUser, loginUser, logoutUser } from "../../services/authService";

export const checkAuthStatus = createAsyncThunk(
    'user/checkAuthStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getUser();
            // assuming your backend returns { user: {name, email, ...} }
            return response.user;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
)

export const loginAction = createAsyncThunk(
    'user/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await loginUser(email, password);
            // assuming your loginUser returns { user: {...} }
            return response.user;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutAction = createAsyncThunk(
    'user/logout',
    async (_, { rejectWithValue }) => {
        try {
            await logoutUser();
            return; 
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);