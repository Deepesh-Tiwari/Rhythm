import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAction } from '../features/user/userThunks';

// A simple sun/moon icon for the theme switcher
const ThemeIcon = ({ theme }) => (
    theme === 'forest' ? (
        // Sun Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    ) : (
        // Moon Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
    )
);

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get user state from Redux
    const { user, isAuthenticated } = useSelector((state) => state.user);

    // State for managing the theme
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'forest');

    // Effect to apply the theme to the HTML tag
    useEffect(() => {
        document.querySelector('html').setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(theme === 'forest' ? 'cupcake' : 'forest');
    };

    const handleLogout = async () => {
        await dispatch(logoutAction());
        // After logout, redirect to the login page
        navigate('/login');
    };

    return (
        // Using DaisyUI's navbar component
        <div className="navbar bg-base-200 shadow-md px-4">
            {/* Left Side: Logo and App Name */}
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl font-bold text-primary">
                    <img src="/svg1.svg" alt="Rhythm Logo" className="h-8 w-8 mr-2" />
                    Rhythm
                </Link>
            </div>

            {/* Center: Navigation Links (can be added later) */}
            <div className="navbar-center hidden lg:flex">
                {/* Example Links */}
                {isAuthenticated && (
                    <ul className="menu menu-horizontal px-1 font-semibold">
                        <li><Link to="/">Discover</Link></li>
                        <li><Link to="/rooms/YS8TIE">Rooms</Link></li>
                        <li><Link to="/connections">Connections</Link></li>
                        <li><Link to="/requests">Requests</Link></li>
                    </ul>
                )}
            </div>

            {/* Right Side: Theme Toggle and User Actions */}
            <div className="navbar-end space-x-2">
                {/* Theme Toggle Button */}
                <label className="swap swap-rotate btn btn-ghost btn-circle">
                    <input type="checkbox" onChange={handleThemeToggle} checked={theme === 'cupcake'} />
                    <ThemeIcon theme="forest" />
                    <ThemeIcon theme="cupcake" />
                </label>

                {isAuthenticated ? (
                    // --- User is Logged In: Show Profile Dropdown ---
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                <img alt="User Profile" src={user?.profilePic || 'https://via.placeholder.com/150'} />
                            </div>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52">
                            <li className="menu-title">
                                <span>Welcome, {user?.displayName || user?.username}!</span>
                            </li>
                            <li>
                                <Link to="/profile/me">Profile</Link>
                            </li>
                            <li>
                                <a onClick={handleLogout}>Logout</a>
                            </li>
                        </ul>
                    </div>
                ) : (
                    // --- User is Logged Out: Show Login/Signup Buttons ---
                    <div className="space-x-2">
                        <Link to="/login" className="btn btn-ghost">Log In</Link>
                        <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;