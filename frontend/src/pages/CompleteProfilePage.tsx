import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import Logo from '../components/Logo';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import 'leaflet/dist/leaflet.css';

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
  const [isMapVisible, setMapVisible] = useState(false);
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
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    photo: "M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2a1 1 0 100-2 1 1 0 000 2zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z",
    mapPin: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const cityName = data.address.city || data.address.town || data.address.village || 'Lieu inconnu';
          setCity(cityName);
          setCoordinates([lng, lat]); // Note: coordinates are [lng, lat] for consistency with backend
        } catch (error) {
          console.error("Error fetching city name:", error);
          setCity(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
          setCoordinates([lng, lat]);
        } finally {
          setMapVisible(false);
        }
      },
    });
    return null;
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
    if (!firstName || !birthDay || !birthMonth || !birthYear || !gender || !city || !profilePhoto || lookingFor.length === 0 || lookingForGender.length === 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    try {
      // Calculate age from birth date
      const birthDate = new Date(`${birthYear}-${birthMonth}-${birthDay}`);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

      // Prepare profile data
      const profileData = {
        first_name: firstName,
        age: age,
        gender: gender, // Now including gender in profile creation
        location: {
          city_name: city,
          coordinates: coordinates || [0, 0]
        },
        looking_for: lookingFor.map(value =>
          value === 'FRIENDSHIP' ? 'Amitié' :
            value === 'CASUAL' ? 'Relation légère' : 'Relation sérieuse'
        ),
        looking_for_gender: lookingForGender,
        subject: 'À définir', // This will need to be added to the form
        experience_years: 0, // This will need to be added to the form
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
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="city"
                type="text"
                placeholder="Ex: Paris, Lyon, Marseille..."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCoordinates(null);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setMapVisible(true)}
                className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                title="Sélectionner sur la carte"
              >
                <Icon path={icons.mapPin} />
              </button>
            </div>
            {coordinates && (
              <div className="mt-1 text-xs text-gray-500">
                <Icon path={icons.location} className="w-3 h-3 inline mr-1" />
                Coordonnées: [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]
              </div>
            )}
          </div>

          {/* Map Modal */}
          {isMapVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 h-3/4 relative">
                <h3 className="text-lg font-bold mb-2">Cliquez sur la carte pour choisir un lieu</h3>
                <div className="h-[calc(100%-40px)] w-full">
                  <MapContainer center={[48.8566, 2.3522]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler />
                  </MapContainer>
                </div>
                <button
                  onClick={() => setMapVisible(false)}
                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md"
                >
                  <Icon path={icons.close} className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          )}

          {/* Vous recherchez + Avec */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vous recherchez (plusieurs choix possibles)
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="FRIENDSHIP"
                    checked={lookingFor.includes('FRIENDSHIP')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'FRIENDSHIP']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'FRIENDSHIP'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Amitié</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="CASUAL"
                    checked={lookingFor.includes('CASUAL')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'CASUAL']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'CASUAL'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Relation légère</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="SERIOUS"
                    checked={lookingFor.includes('SERIOUS')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'SERIOUS']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'SERIOUS'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Relation sérieuse</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avec (plusieurs choix possibles)
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="MALE"
                    checked={lookingForGender.includes('MALE')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingForGender([...lookingForGender, 'MALE']);
                      } else {
                        setLookingForGender(lookingForGender.filter(v => v !== 'MALE'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Homme</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="FEMALE"
                    checked={lookingForGender.includes('FEMALE')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingForGender([...lookingForGender, 'FEMALE']);
                      } else {
                        setLookingForGender(lookingForGender.filter(v => v !== 'FEMALE'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Femme</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="OTHER"
                    checked={lookingForGender.includes('OTHER')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingForGender([...lookingForGender, 'OTHER']);
                      } else {
                        setLookingForGender(lookingForGender.filter(v => v !== 'OTHER'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Autre</span>
                </label>
              </div>
            </div>
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
