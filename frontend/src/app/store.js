import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice"
import { socialApiSlice } from "../features/social/socialApiSlice";
import { setupListeners } from '@reduxjs/toolkit/query';

const store = configureStore({
    reducer : {
        user : userReducer,
        [socialApiSlice.reducerPath]: socialApiSlice.reducer,
    },

    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socialApiSlice.middleware),
})
setupListeners(store.dispatch);

export default store;