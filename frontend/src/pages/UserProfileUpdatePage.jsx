// src/pages/UserProfileUpdatePage.jsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import UserCard from '../components/UserCard';
import FormField from '../components/FormField'; // Our new reusable component
import { updateUserProfile } from '../services/userService';
import { checkAuthStatus } from '../features/user/userThunks';
import { indianStates } from '../data/indianStates';
import {
    UserCircleIcon, AtSymbolIcon, CakeIcon,
    IdentificationIcon, MapPinIcon, InformationCircleIcon, PhotoIcon
} from '@heroicons/react/24/outline';

// Pre-process locations for the dropdown
const flatLocations = Object.entries(indianStates)
    .flatMap(([state, cities]) => cities.map(city => `${city}, ${state}`))
    .sort();

const UserProfileUpdatePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.user);

    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: '',
        dateOfBirth: '',
        gender: '',
        location: '',
        profilePic: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                displayName: user.displayName || '',
                bio: user.bio || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                location: user.location || '',
                profilePic: user.profilePic || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await updateUserProfile(formData);
            await dispatch(checkAuthStatus());
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- COLUMN 1: THE EDITABLE FORM --- */}
                <div className="lg:col-span-2 bg-base-200 p-6 md:p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Edit Profile</h1>
                        <div>
                            <button type="button" onClick={() => navigate('/profile')} className="btn btn-ghost mr-2">Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {error && <div role="alert" className="alert alert-error mb-6"><span>{error}</span></div>}

                    <div className="space-y-8">
                        {/* --- Public Profile Section --- */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Public Profile</h2>
                            <div className="space-y-6">
                                <FormField icon={<UserCircleIcon className="h-5 w-5 text-base-content/70"/>} label="Display Name" description="This is how other users will see you.">
                                    <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="input input-bordered w-full bg-base-100" />
                                </FormField>
                                <FormField icon={<InformationCircleIcon className="h-5 w-5 text-base-content/70"/>} label="Bio" description="A short description about yourself.">
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} className="textarea textarea-bordered w-full bg-base-100 h-24"></textarea>
                                </FormField>
                                <FormField icon={<MapPinIcon className="h-5 w-5 text-base-content/70"/>} label="Location" description="Your city and state.">
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="input input-bordered w-full bg-base-100" list="locations-list" />
                                    <datalist id="locations-list">
                                        {flatLocations.map((loc) => <option key={loc} value={loc} />)}
                                    </datalist>
                                </FormField>
                                <FormField icon={<PhotoIcon className="h-5 w-5 text-base-content/70"/>} label="Profile Picture URL" description="URL of your profile image.">
                                    <input type="url" name="profilePic" value={formData.profilePic} onChange={handleChange} className="input input-bordered w-full bg-base-100" />
                                </FormField>
                            </div>
                        </div>

                        {/* --- Account Details Section --- */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Account Details</h2>
                            <div className="space-y-6">
                                <FormField icon={<AtSymbolIcon className="h-5 w-5 text-base-content/70"/>} label="Username" description="Your unique handle. This cannot be changed.">
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="input input-bordered w-full bg-base-300" disabled />
                                </FormField>
                                <FormField icon={<CakeIcon className="h-5 w-5 text-base-content/70"/>} label="Date of Birth" description="Used to calculate your age.">
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input input-bordered w-full bg-base-100" />
                                </FormField>
                                <FormField icon={<IdentificationIcon className="h-5 w-5 text-base-content/70"/>} label="Gender" description="Your gender identity.">
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="select select-bordered w-full bg-base-100">
                                        <option value="">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </FormField>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COLUMN 2: THE VISUAL CARD --- */}
                <div className="hidden lg:block">
                    <div className="sticky top-24">
                        <UserCard user={{ ...user, ...formData }} />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserProfileUpdatePage;