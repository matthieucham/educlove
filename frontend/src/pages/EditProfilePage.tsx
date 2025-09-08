import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import ImageUploader from '../components/ImageUploader';
import Logo from '../components/Logo';
import { api } from '../services/api';
import 'leaflet/dist/leaflet.css';

const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-300 rounded-t-lg p-2 flex space-x-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${editor.isActive('bold') ? 'bg-purple-200' : ''}`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${editor.isActive('italic') ? 'bg-purple-200' : ''}`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded ${editor.isActive('strike') ? 'bg-purple-200' : ''}`}
      >
        Strike
      </button>
    </div>
  );
};

// Common school subjects with French labels and English uppercase values
const SCHOOL_SUBJECTS = [
  { value: '', label: 'Sélectionnez une matière' },
  { value: 'MATHEMATICS', label: 'Mathématiques' },
  { value: 'FRENCH', label: 'Français' },
  { value: 'ENGLISH', label: 'Anglais' },
  { value: 'HISTORY', label: 'Histoire' },
  { value: 'GEOGRAPHY', label: 'Géographie' },
  { value: 'PHYSICS', label: 'Physique' },
  { value: 'CHEMISTRY', label: 'Chimie' },
  { value: 'BIOLOGY', label: 'Biologie' },
  { value: 'SPANISH', label: 'Espagnol' },
  { value: 'GERMAN', label: 'Allemand' },
  { value: 'ITALIAN', label: 'Italien' },
  { value: 'PHILOSOPHY', label: 'Philosophie' },
  { value: 'ECONOMICS', label: 'Économie' },
  { value: 'COMPUTER_SCIENCE', label: 'Informatique' },
  { value: 'MUSIC', label: 'Musique' },
  { value: 'ART', label: 'Arts plastiques' },
  { value: 'PHYSICAL_EDUCATION', label: 'Éducation physique et sportive' },
  { value: 'TECHNOLOGY', label: 'Technologie' },
  { value: 'LATIN', label: 'Latin' },
  { value: 'GREEK', label: 'Grec' },
];

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [lookingForGender, setLookingForGender] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [profileExists, setProfileExists] = useState(false);
  const [isMapVisible, setMapVisible] = useState(false);

  const icons = {
    user: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z",
    age: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    city: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    subject: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
    photo: "M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2a1 1 0 100-2 1 1 0 000 2zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z",
    description: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    goals: "M9 19v-6l-2 2-2-2v6h4zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
    gender: "M12 2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2h4zm0 2H8v6h4V4zm4 8a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2z",
    mapPin: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
  };

  const descriptionEditor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const goalsEditor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

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

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profiles/my-profile');
        const profile = response.data;

        setProfileExists(true);
        setFirstName(profile.first_name || '');
        setAge(profile.age?.toString() || '');
        setGender(profile.gender || '');
        setCity(profile.location?.city_name || '');
        setCoordinates(profile.location?.coordinates || null);
        // Handle looking_for - convert to array if it's a string (for backward compatibility)
        if (Array.isArray(profile.looking_for)) {
          setLookingFor(profile.looking_for);
        } else if (profile.looking_for) {
          setLookingFor([profile.looking_for]);
        } else {
          setLookingFor([]);
        }

        // Set looking_for_gender if it exists
        setLookingForGender(profile.looking_for_gender || []);
        setSubject(profile.subject || '');
        setPhotos(profile.photos || []);

        // Set editor content
        if (descriptionEditor && profile.description) {
          descriptionEditor.commands.setContent(profile.description);
        }
        if (goalsEditor && profile.goals) {
          goalsEditor.commands.setContent(profile.goals);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Profile doesn't exist yet, that's okay
          setProfileExists(false);
        } else {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();
  }, [descriptionEditor, goalsEditor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!city || lookingFor.length === 0 || lookingForGender.length === 0 || !descriptionEditor?.getHTML()) {
      setError('Veuillez remplir tous les champs obligatoires (Ville, Vous recherchez, Avec, Description)');
      setLoading(false);
      return;
    }

    try {
      const profileData = {
        first_name: firstName,
        age: parseInt(age),
        gender: gender,
        location: {
          city_name: city,
          // Send [0, 0] to trigger geocoding in backend
          coordinates: coordinates || [0, 0]
        },
        looking_for: lookingFor,
        looking_for_gender: lookingForGender,
        subject: subject || 'Non spécifié', // Optional field
        experience_years: 0, // Removed from form
        photos: photos,
        description: descriptionEditor?.getHTML() || '',
        goals: goalsEditor?.getHTML() || '', // Optional field
        email: 'user@example.com' // Will be filled from user data in backend
      };

      let response;
      if (profileExists) {
        // Update existing profile
        response = await api.put('/profiles/my-profile', profileData);
      } else {
        // Create new profile
        response = await api.post('/profiles/my-profile', profileData);
      }

      // Extract geocoded coordinates from response if available
      if (response.data.location?.coordinates) {
        setCoordinates(response.data.location.coordinates);
      }

      setSuccess(profileExists ? 'Profil mis à jour avec succès!' : 'Profil créé avec succès!');
      setProfileExists(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la sauvegarde du profil');
    } finally {
      setLoading(false);
    }
  };

  // Format gender display
  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'MALE':
      case 'Homme':
        return 'Homme';
      case 'FEMALE':
      case 'Femme':
        return 'Femme';
      case 'OTHER':
      case 'Autre':
        return 'Autre';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">
      {/* Header with Logo */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
              <Logo size="medium" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
          </div>
          <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 font-semibold text-sm">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {profileExists ? 'Modifier votre profil' : 'Créer votre profil'}
        </h1>

        {/* Subtitle with first name, age, and gender */}
        {(firstName || age || gender) && (
          <p className="text-center text-gray-600 mb-6">
            {firstName && <span className="font-medium">{firstName}</span>}
            {age && <span>{firstName ? ', ' : ''}{age} ans</span>}
            {gender && <span>{(firstName || age) ? ', ' : ''}{getGenderDisplay(gender)}</span>}
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">
              Ville *
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
                  // Reset coordinates when city changes to trigger re-geocoding
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="photos">
              Vos photos (jusqu'à 8)
            </label>
            <ImageUploader />
            <p className="text-xs text-gray-500 mt-1">La première photo sera votre photo de profil.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vous recherchez *
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Amitié"
                    checked={lookingFor.includes('Amitié')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'Amitié']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'Amitié'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Amitié</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Relation légère"
                    checked={lookingFor.includes('Relation légère')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'Relation légère']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'Relation légère'));
                      }
                    }}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Relation légère</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Relation sérieuse"
                    checked={lookingFor.includes('Relation sérieuse')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLookingFor([...lookingFor, 'Relation sérieuse']);
                      } else {
                        setLookingFor(lookingFor.filter(v => v !== 'Relation sérieuse'));
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
                Avec *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subject">
              Matière enseignée
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SCHOOL_SUBJECTS.map((subj) => (
                <option key={subj.value} value={subj.value}>
                  {subj.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <div className="tiptap-editor-wrapper border border-gray-300 rounded-lg">
              <MenuBar editor={descriptionEditor} />
              <EditorContent editor={descriptionEditor} className="p-3 min-h-[150px] bg-gray-50 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vos objectifs et aspirations (optionnel)
            </label>
            <div className="tiptap-editor-wrapper border border-gray-300 rounded-lg">
              <MenuBar editor={goalsEditor} />
              <EditorContent editor={goalsEditor} className="p-3 min-h-[150px] bg-gray-50 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div className="pt-4">
            <button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : (profileExists ? 'Enregistrer les modifications' : 'Créer le profil')}
            </button>
          </div>
        </form>

        {city && !coordinates && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <Icon path={icons.location} className="w-4 h-4 inline mr-1" />
              Les coordonnées GPS de "{city}" seront automatiquement déterminées lors de l'enregistrement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfilePage;
