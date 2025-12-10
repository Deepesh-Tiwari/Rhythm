import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { getUser } from '../services/authService';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from '../features/user/userThunks';


const SpotifySuccess = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const fetchUser = async () => {
        try {
            
            dispatch(checkAuthStatus()); // store serializable user data only
            navigate("/");
        } catch (error) {
            console.error('Error fetching Spotify user:', error);
            navigate('/login');
        }
    };

    useEffect(() => {
        
        const timer = setTimeout(() => {
            fetchUser();
        }, 200); // 200ms is a safe and still unnoticeable delay

        return () => clearTimeout(timer);
    }, [dispatch, navigate])

    return (
        <div>Logging you in via spotify</div>
    )
}

export default SpotifySuccess