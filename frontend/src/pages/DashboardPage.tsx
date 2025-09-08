import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MyMatchesPage from './MyMatchesPage';
import MessagesPage from './MessagesPage';
import Logo from '../components/Logo';
import { profileService } from '../services/api';
import type { Profile } from '../types';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'messages' | 'matches'>('messages');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user profile when component mounts
    const fetchUserProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.profile_id) {
          const profile = await profileService.getProfile(user.profile_id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  const handleSearchClick = () => {
    // Navigate to SearchCriteria page with user's current search preferences
    // The SearchCriteria page will be pre-filled based on the user's profile data
    navigate('/search-criteria', {
      state: {
        userProfile: userProfile,
        // Pre-fill search criteria based on user's preferences
        searchCriteria: userProfile ? {
          lookingFor: userProfile.lookingFor,
          location: userProfile.location,
          // Add other relevant criteria from profile
        } : null
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">
      {/* Header with Logo */}
      <div className="w-full max-w-4xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
              <Logo size="medium" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full relative">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tableau de bord</h1>
        <div className="absolute top-8 right-8 flex gap-2">
          {/* Profile button */}
          <button
            onClick={() => navigate('/edit-profile')}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200"
            title="Modifier le profil"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
            </svg>
          </button>
          {/* Search button */}
          <button
            onClick={handleSearchClick}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200"
            title="Critères de recherche"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Prominent Browse Profiles Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => navigate('/profiles')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
            Découvrir des Profils
          </button>
        </div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('messages')}
              className={`${activeTab === 'messages'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition duration-200`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`${activeTab === 'matches'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition duration-200`}
            >
              Matches
            </button>
          </nav>
        </div>
        <div className="mt-4">
          {activeTab === 'messages' ? <MessagesPage /> : <MyMatchesPage />}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
