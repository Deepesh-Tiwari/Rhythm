import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAction } from '../features/user/userThunks';
import {
    HomeIcon,
    SignalIcon,
    UserGroupIcon,
    BellIcon,
    MoonIcon,
    SunIcon,
    UserCircleIcon,
    PowerIcon,
    Bars3Icon,
    MusicalNoteIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { user, isAuthenticated } = useSelector((state) => state.user);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'forest');

    useEffect(() => {
        document.querySelector('html').setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prev => prev === 'forest' ? 'cupcake' : 'forest');
    };

    const handleLogout = async () => {
        await dispatch(logoutAction());
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'text-primary bg-base-300' : '';

    const ProtectedNavItems = () => (
        <>
            <li>
                <Link to="/" className={isActive('/')}>
                    <HomeIcon className="w-5 h-5" /> Discover
                </Link>
            </li>
            <li>
                <Link to="/rooms/active" className={isActive('/rooms/active')}>
                    <SignalIcon className="w-5 h-5" /> Rooms
                </Link>
            </li>
            <li>
                <Link to="/music/edit" className={isActive('/music/edit')}>
                    <MusicalNoteIcon className="w-5 h-5" /> My Music
                </Link>
            </li>
            <li>
                <Link to="/connections" className={isActive('/connections')}>
                    <UserGroupIcon className="w-5 h-5" /> Connections
                </Link>
            </li>
            <li>
                <Link to="/requests" className={isActive('/requests')}>
                    <BellIcon className="w-5 h-5" /> Requests
                </Link>
            </li>
        </>
    );

    return (
        <div className="navbar bg-base-200 shadow-md px-4 sticky top-0 z-50">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl font-bold text-primary gap-2">
                    <img src="/svg1.svg" alt="Logo" className="h-8 w-8" />
                    Rhythm
                </Link>
            </div>

            {/* --- CENTER: Desktop Navigation --- */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-1 font-medium">
                    {/* 1. Show App Links First */}
                    {isAuthenticated && <ProtectedNavItems />}

                    {/* 2. Show About Link Last */}
                    <li>
                        <Link to="/about" className={isActive('/about')}>
                            <InformationCircleIcon className="w-5 h-5" /> About
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="navbar-end space-x-2">
                <button className="btn btn-ghost btn-circle" onClick={handleThemeToggle}>
                    {theme === 'forest' ? (
                        <SunIcon className="w-6 h-6 text-yellow-500" />
                    ) : (
                        <MoonIcon className="w-6 h-6 text-indigo-500" />
                    )}
                </button>

                {isAuthenticated ? (
                    <>
                        <div className="dropdown dropdown-end lg:hidden">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                                <Bars3Icon className="w-6 h-6" />
                            </div>
                            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
                                <ProtectedNavItems />
                                <div className="divider my-0"></div>
                                <li>
                                    <Link to="/about" className={isActive('/about')}>
                                        <InformationCircleIcon className="w-5 h-5" /> About
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar online">
                                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <img alt="Profile" src={user?.profilePic || 'https://via.placeholder.com/150'} />
                                </div>
                            </div>
                            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
                                <li className="menu-title px-4 py-2 opacity-50 uppercase text-xs font-bold tracking-wider">
                                    {user?.displayName || user?.username}
                                </li>
                                <div className="divider my-0"></div>
                                <li>
                                    <Link to="/profile/me">
                                        <UserCircleIcon className="w-4 h-4" /> Profile
                                    </Link>
                                </li>
                                <li>
                                    <a onClick={handleLogout} className="text-error">
                                        <PowerIcon className="w-4 h-4" /> Logout
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        {/* Mobile About Icon */}
                        <Link to="/about" className="btn btn-ghost btn-circle lg:hidden">
                            <InformationCircleIcon className="w-6 h-6" />
                        </Link>

                        {/* ✅ FIXED: Desktop Buttons now change style based on active page */}
                        <div className="hidden lg:flex gap-2">
                            <Link
                                to="/login"
                                className={`btn btn-sm ${location.pathname === '/login' ? 'btn-primary' : 'btn-ghost'}`}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/signup"
                                className={`btn btn-sm ${location.pathname === '/signup' ? 'btn-primary' : 'btn-ghost'}`}
                            >
                                Sign Up
                            </Link>
                        </div>

                        {/* Mobile Login/Signup Menu */}
                        <div className="dropdown dropdown-end lg:hidden">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                                <Bars3Icon className="w-6 h-6" />
                            </div>
                            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
                                {/* ✅ FIXED: Mobile links also use active highlighting */}
                                <li>
                                    <Link to="/login" className={location.pathname === '/login' ? 'text-primary font-bold' : ''}>Log In</Link>
                                </li>
                                <li>
                                    <Link to="/signup" className={location.pathname === '/signup' ? 'text-primary font-bold' : ''}>Sign Up</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;