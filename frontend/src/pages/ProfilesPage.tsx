import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Book, Briefcase, Heart, Camera } from 'lucide-react';
import Logo from '../components/Logo';
import { api } from '../services/api';
import { Button, Card, Loading, Badge } from '../components/ui';

interface Profile {
  _id: string;
  first_name: string;
  age: number;
  location: {
    city_name: string;
    coordinates: number[];
  };
  subject: string;
  experience_years: number;
  looking_for: string;
  description?: string;
  goals?: string;
  photos: string[];
  email: string;
}

const ProfilesPage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profileId && profiles.length > 0) {
      const profileIndex = profiles.findIndex(p => p._id === profileId);
      if (profileIndex !== -1) {
        setCurrentProfileIndex(profileIndex);
      }
    }
  }, [profileId, profiles]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profiles/');
      setProfiles(response.data.profiles || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Erreur lors du chargement des profils');
      // Use default profiles as fallback
      setProfiles([
        {
          _id: '1',
          first_name: 'Marie',
          age: 32,
          location: { city_name: 'Paris, France', coordinates: [2.3522, 48.8566] },
          subject: 'Français',
          experience_years: 8,
          looking_for: 'Relation sérieuse',
          description: 'Passionnée de littérature et de voyages, j\'adore partager ma culture et en découvrir de nouvelles.',
          photos: ['https://randomuser.me/api/portraits/women/1.jpg'],
          email: 'marie@example.com'
        },
        {
          _id: '2',
          first_name: 'Julien',
          age: 28,
          location: { city_name: 'Lyon, France', coordinates: [4.8357, 45.7640] },
          subject: 'Mathématiques',
          experience_years: 5,
          looking_for: 'Relation légère',
          description: 'Geek dans l\'âme et sportif à mes heures perdues.',
          photos: ['https://randomuser.me/api/portraits/men/2.jpg'],
          email: 'julien@example.com'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = () => {
    setCurrentProfileIndex((prevIndex) => (prevIndex + 1) % profiles.length);
    setCurrentPhotoIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">
        <div className="w-full max-w-md mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
                <Logo size="medium" className="text-white" />
              </div>
              <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
            </div>
            <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 font-semibold text-sm">
              ← Tableau de bord
            </Link>
          </div>
        </div>
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Aucun profil trouvé</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Aucun profil ne correspond à vos critères de recherche.'}
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/search-criteria'}
            className="inline-block"
          >
            Modifier les critères
          </Button>
        </Card>
      </div>
    );
  }

  const currentProfile = profiles[currentProfileIndex];
  const defaultPhotos = ['https://randomuser.me/api/portraits/lego/1.jpg'];
  const photos = currentProfile.photos && currentProfile.photos.length > 0
    ? currentProfile.photos
    : defaultPhotos;

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">
      {/* Header with Logo */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
              <Logo size="medium" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
          </div>
          <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 font-semibold text-sm">
            ← Tableau de bord
          </Link>
        </div>
      </div>

      <Card className="max-w-md w-full overflow-hidden p-0">
        {/* Photos Section */}
        <div className="relative">
          <img
            className="w-full h-96 object-cover"
            src={photos[currentPhotoIndex]}
            alt={currentProfile.first_name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-black/50 text-white flex items-center"
            >
              <Camera size={14} className="mr-1" /> {currentPhotoIndex + 1} / {photos.length}
            </Badge>
          )}
          <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPhoto}
              className="text-white/70 hover:text-white p-1"
            >
              &#10094;
            </Button>
          </div>
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPhoto}
              className="text-white/70 hover:text-white p-1"
            >
              &#10095;
            </Button>
          </div>

          {/* Main Info */}
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h1 className="text-4xl font-bold">{currentProfile.first_name}, {currentProfile.age}</h1>
            <div className="flex items-center mt-1">
              <MapPin size={18} className="mr-2" />
              <p className="text-lg">{currentProfile.location.city_name}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-4">
          {currentProfile.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">À propos de moi</h3>
              <p className="text-gray-600">{currentProfile.description}</p>
            </div>
          )}

          {currentProfile.goals && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Mes objectifs</h3>
              <p className="text-gray-600">{currentProfile.goals}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-700">
              <Briefcase size={16} className="mr-2 text-purple-600" />
              <span>{currentProfile.experience_years} ans d'expérience</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Book size={16} className="mr-2 text-purple-600" />
              <span>Enseigne: {currentProfile.subject}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Heart size={16} className="mr-2 text-pink-600" />
              <span>Cherche: {currentProfile.looking_for}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around p-4 bg-gray-50 border-t">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSwipe}
            className="border-2 border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500 hover:bg-red-50 p-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSwipe}
            className="p-4 rounded-full shadow-md transform transition-all duration-200 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilesPage;
