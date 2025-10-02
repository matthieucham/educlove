import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button, Card, Select, Loading } from '../components/ui';
import MapPicker from '../components/ui/MapPicker';

const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const MultiSelect = ({
  label,
  options,
  selected = [],
  onSelectionChange,
  required = false
}: {
  label: string;
  options: { value: string; label: string }[];
  selected?: string[];
  onSelectionChange: (selected: string[]) => void;
  required?: boolean;
}) => {
  const toggleOption = (value: string) => {
    const newSelection = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onSelectionChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <Button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            variant={selected.includes(option.value) ? 'primary' : 'outline'}
            size="sm"
            className={`transition-all duration-200 ${selected.includes(option.value)
              ? ''
              : 'hover:bg-purple-100'
              }`}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-300 rounded-t-lg p-2 flex space-x-2">
      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="sm"
        className="px-2 py-1"
      >
        Bold
      </Button>
      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="sm"
        className="px-2 py-1"
      >
        Italic
      </Button>
      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        size="sm"
        className="px-2 py-1"
      >
        Strike
      </Button>
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

  const icons = {
    user: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z",
    age: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    city: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    subject: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
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

  // Handler for MapPicker changes
  const handleLocationChange = (newCity: string, newCoordinates: [number, number]) => {
    setCity(newCity);
    setCoordinates(newCoordinates);
  };

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profiles/my-profile');
        const profile = response.data;

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
      // Profile always exists (created during registration)
      // For updates, exclude immutable fields (first_name, date_of_birth, gender)
      const profileData = {
        location: {
          city_name: city,
          // Send [0, 0] to trigger geocoding in backend
          coordinates: coordinates || [0, 0]
        },
        looking_for: lookingFor,
        looking_for_gender: lookingForGender,
        subject: subject || 'Non spécifié', // Optional field
        description: descriptionEditor?.getHTML() || '',
        goals: goalsEditor?.getHTML() || '', // Optional field
        email: 'user@example.com' // Will be filled from user data in backend
      };

      // Update existing profile (without immutable fields)
      const response = await api.put('/profiles/my-profile', profileData);

      // Extract geocoded coordinates from response if available
      if (response.data.location?.coordinates) {
        setCoordinates(response.data.location.coordinates);
      }

      setSuccess('Profil mis à jour avec succès!');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/profiles');
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

      <Card className="max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Mon profil
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville *
            </label>
            <MapPicker
              value={city}
              coordinates={coordinates}
              onChange={handleLocationChange}
              placeholder="Ex: Paris, Lyon, Marseille..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MultiSelect
              label="Vous recherchez"
              options={[
                { value: 'Amitié', label: 'Amitié' },
                { value: 'Relation légère', label: 'Relation légère' },
                { value: 'Relation sérieuse', label: 'Relation sérieuse' }
              ]}
              selected={lookingFor}
              onSelectionChange={setLookingFor}
              required={true}
            />
            <MultiSelect
              label="Avec"
              options={[
                { value: 'MALE', label: 'Homme' },
                { value: 'FEMALE', label: 'Femme' },
                { value: 'OTHER', label: 'Autre' }
              ]}
              selected={lookingForGender}
              onSelectionChange={setLookingForGender}
              required={true}
            />
          </div>

          <Select
            id="subject"
            label="Matière enseignée"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SCHOOL_SUBJECTS}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Card variant="bordered" className="overflow-hidden">
              <MenuBar editor={descriptionEditor} />
              <EditorContent editor={descriptionEditor} className="p-3 min-h-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </Card>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vos objectifs et aspirations (optionnel)
            </label>
            <Card variant="bordered" className="overflow-hidden">
              <MenuBar editor={goalsEditor} />
              <EditorContent editor={goalsEditor} className="p-3 min-h-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </Card>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loading size="sm" />
                  <span>Enregistrement...</span>
                </div>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </form>

        {city && !coordinates && (
          <Card variant="bordered" className="mt-4 p-3 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700">
              <Icon path={icons.location} className="w-4 h-4 inline mr-1" />
              Les coordonnées GPS de "{city}" seront automatiquement déterminées lors de l'enregistrement.
            </p>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default EditProfilePage;
