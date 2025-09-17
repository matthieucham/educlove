import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { MapPicker } from '../components/ui';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();

  // Pre-fill firstName from user.name if available
  const [firstName, setFirstName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [lookingForGender, setLookingForGender] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate years from 1920 to current year - 18
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 18 - 1920 + 1 }, (_, i) => currentYear - 18 - i);

  // Days array
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Months in French
  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const icons = {
    user: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z",
    calendar: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    gender: "M12 2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2h4zm0 2H8v6h4V4zm4 8a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    photo: "M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2a1 1 0 100-2 1 1 0 000 2zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z"
  };

  useEffect(() => {
    // Check if user already has a completed profile
    if (user?.profile_completed) {
      navigate('/dashboard');
    }

    // Pre-fill firstName from user.name if available
    if (user?.name && !firstName) {
      // Extract first name from full name (assuming first word is first name)
      const extractedFirstName = user.name.split(' ')[0];
      setFirstName(extractedFirstName);
    }
  }, [user, navigate, firstName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!firstName || !birthDay || !birthMonth || !birthYear || !gender || !city || !profilePhoto) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    try {
      const birthDate = new Date(`${birthYear}-${birthMonth}-${birthDay}`);

      // Prepare profile data
      const profileData = {
        first_name: firstName,
        date_of_birth: birthDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        gender: gender, // Now including gender in profile creation
        location: {
          city_name: city,
          coordinates: coordinates || [0, 0]
        },
        looking_for: [],// This will need to be added to the form
        looking_for_gender: [],// This will need to be added to the form
        subject: 'À définir', // This will need to be added to the form
        photos: [], // Handle photo upload separately
        description: '',
        goals: '',
        email: user?.email || ''
      };

      // Create the profile
      const response = await api.post('/profiles/my-profile', profileData);

      if (response.data.profile_id) {
        // Refresh user data to get updated profile_completed status
        await checkAuth();

        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de la création du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 p-4">
            <Logo size="large" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Complétez votre profil</h1>
          <p className="text-gray-600 mt-2">Quelques informations pour commencer</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
              Prénom
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              id="firstName"
              type="text"
              placeholder="Votre prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Date de naissance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de naissance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Year Dropdown - First */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                required
              >
                <option value="">Année</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Month Dropdown - Second */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                required
                disabled={!birthYear}
              >
                <option value="">Mois</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>

              {/* Day Dropdown - Third */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                required
                disabled={!birthMonth || !birthYear}
              >
                <option value="">Jour</option>
                {days.map(day => (
                  <option key={day} value={day.toString().padStart(2, '0')}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gender">
              Genre
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Location with map picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">
              Localisation
            </label>
            <MapPicker
              value={city}
              coordinates={coordinates}
              onChange={(newCity, newCoords) => {
                setCity(newCity);
                setCoordinates(newCoords);
              }}
              placeholder="Ex: Paris, Lyon, Marseille..."
            />
          </div>

          {/* Photo de profil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="photo">
              Photo de profil
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="pt-4">
            <button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Création en cours...' : 'Créer mon profil'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CompleteProfilePage;
