import React, { useState } from 'react';
// We will import the login service we are about to create
import { loginUser, SignupUser, redirectToSpotify } from '../services/authService';
import { useNavigate } from 'react-router';
import { addUser } from '../features/user/userSlice';
import { useDispatch } from 'react-redux';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use the new service function to handle the API call
            const data = await SignupUser(username, email, password);
            console.log('Login successful:', data);
            // On success, redirect to the dashboard
            dispatch(addUser(data.data));
            navigate("/select-tracks");
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSpotifyLogin = () => {
        // Use the service function for redirection
        redirectToSpotify();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="w-full max-w-md bg-base-200 rounded-xl shadow-lg p-8 space-y-6">

                <div className="flex flex-col items-center space-y-4">
                    <img src="svg1.svg" alt="Rhythm Logo" className="h-16 w-16" />
                    <h1 className="text-3xl font-bold text-base-content tracking-tight">
                        Sign up for Rhythm
                    </h1>
                </div>

                <button
                    className="btn btn-primary w-full font-bold text-lg text-primary-content"
                    onClick={handleSpotifyLogin}
                >
                    CONTINUE WITH SPOTIFY
                </button>

                <div className="divider text-base-content/70 font-semibold">OR</div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div role="alert" className="alert alert-error text-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold text-base-content/80">
                                Username
                            </span>
                        </label>
                        <input
                            type="username" // Changed to 'email' for better semantics and validation
                            placeholder="Enter username"
                            className="input input-bordered w-full bg-base-100 focus:border-primary"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold text-base-content/80">
                                Email
                            </span>
                        </label>
                        <input
                            type="email" // Changed to 'email' for better semantics and validation
                            placeholder="Enter your email"
                            className="input input-bordered w-full bg-base-100 focus:border-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold text-base-content/80">
                                Password
                            </span>
                        </label>
                        <input
                            type="password" // Changed to 'password' to hide characters
                            placeholder="Enter your password"
                            className="input input-bordered w-full bg-base-100 focus:border-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-secondary w-full font-bold text-lg text-secondary-content"
                        disabled={loading}
                    >
                        {loading ? <span className="loading loading-spinner"></span> : 'SIGN UP'}
                    </button>
                </form>

                <div className="text-center pt-4">
                    <span className="text-base-content/70">Do have an account? </span>
                    <a href="/login" className="link link-hover text-primary font-bold">
                        Log In
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;