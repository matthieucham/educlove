import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link, useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import Logo from '../components/Logo';
import { api } from '../services/api';

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

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [lookingFor, setLookingFor] = useState('Amitié');
  const [subject, setSubject] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [profileExists, setProfileExists] = useState(false);

  const icons = {
    user: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z",
    age: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    city: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    subject: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
    experience: "M9 2a1 1 0 00-1 1v1H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2V3a1 1 0 10-2 0v1H9V3a1 1 0 00-1-1z",
    photo: "M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2a1 1 0 100-2 1 1 0 000 2zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z",
    description: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    goals: "M9 19v-6l-2 2-2-2v6h4zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
  };

  const descriptionEditor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const goalsEditor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profiles/my-profile');
        const profile = response.data;

        setProfileExists(true);
        setFirstName(profile.first_name || '');
        setAge(profile.age?.toString() || '');
        setCity(profile.location?.city_name || '');
        setCoordinates(profile.location?.coordinates || null);
        setLookingFor(profile.looking_for || 'Amitié');
        setSubject(profile.subject || '');
        setExperienceYears(profile.experience_years?.toString() || '');
        setPhotos(profile.photos || []);
        setEmail(profile.email || '');

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

    try {
      const profileData = {
        first_name: firstName,
        age: parseInt(age),
        location: {
          city_name: city,
          // Send [0, 0] to trigger geocoding in backend
          coordinates: coordinates || [0, 0]
        },
        looking_for: lookingFor,
        subject: subject,
        experience_years: parseInt(experienceYears),
        photos: photos,
        description: descriptionEditor?.getHTML() || '',
        goals: goalsEditor?.getHTML() || '',
        email: email || 'user@example.com' // Fallback email if not provided
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {profileExists ? 'Modifier votre profil' : 'Créer votre profil'}
        </h1>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Prénom *
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="name"
                type="text"
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="age">
                Âge *
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="age"
                type="number"
                placeholder="Votre âge"
                min="18"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">
                Ville *
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                {coordinates && (
                  <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                    <Icon path={icons.location} className="w-3 h-3 inline mr-1" />
                    Coordonnées: [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lookingFor">
                Vous recherchez *
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="lookingFor"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                required
              >
                <option value="Amitié">Amitié</option>
                <option value="Relation légère">Relation légère</option>
                <option value="Relation sérieuse">Relation sérieuse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subject">
                Matière enseignée *
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="subject"
                type="text"
                placeholder="Ex: Mathématiques"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="experience">
                Années d'expérience *
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="experience"
                type="number"
                placeholder="Vos années d'expérience"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email *
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              id="email"
              type="email"
              placeholder="votre.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="photos">
              Vos photos (jusqu'à 8)
            </label>
            <ImageUploader />
            <p className="text-xs text-gray-500 mt-1">La première photo sera votre photo de profil.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="tiptap-editor-wrapper border border-gray-300 rounded-lg">
              <MenuBar editor={descriptionEditor} />
              <EditorContent editor={descriptionEditor} className="p-3 min-h-[150px] bg-gray-50 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vos objectifs et aspirations
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
