import { createSlice } from "@reduxjs/toolkit";
import { checkAuthStatus, loginAction, logoutAction } from './userThunks';

const initialState = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
};

export const userSlice = createSlice({

    name: 'user',
    initialState,
    reducers: {
        addUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuthStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.error = action.payload;
            })
            // --- loginAction ---
            .addCase(loginAction.pending, (state) => {
                state.loading = true;
            })
            .addCase(loginAction.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(loginAction.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.error = action.payload;
            })
            // --- logoutAction ---
            .addCase(logoutAction.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            });
    }
})

export const { addUser } = userSlice.actions;

export default userSlice.reducer;

