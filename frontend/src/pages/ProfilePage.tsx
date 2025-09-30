import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Button, Card } from '../components/ui';
import { MapPin, Heart, Quote, User, Calendar, Users, MessageCircle, PawPrint } from 'lucide-react';
import { api } from '../services/api';

interface ProfileData {
  id: string;
  first_name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  location: {
    city_name: string;
    coordinates: [number, number];
  };
  looking_for: string[];
  description?: string;
  goals?: string;
  subject?: string;
  // Additional fields that will be added later
  favorite_quote?: string;
  exclusivity_view?: string;
  has_pet?: boolean;
}

const ProfilePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Fetch profiles from backend
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await api.get('/profiles/');
        const data = response.data;

        // Transform backend data to match our interface
        // Note: age must be computed on backend, date_of_birth should never be sent to frontend
        const transformedProfiles = (data.profiles || data).map((p: any) => ({
          id: p._id || p.id,
          first_name: p.first_name,
          age: p.age, // Age must come from backend, never compute on frontend
          gender: p.gender,
          location: p.location,
          looking_for: p.looking_for || [],
          description: p.description,
          goals: p.goals,
          subject: p.subject,
          favorite_quote: p.favorite_quote,
          exclusivity_view: p.exclusivity_view,
          has_pet: p.has_pet
        }));
        setProfiles(transformedProfiles);

        // If profileId is provided, find that profile's index
        if (profileId) {
          const index = transformedProfiles.findIndex((p: ProfileData) => p.id === profileId);
          if (index !== -1) {
            setCurrentProfileIndex(index);
          }
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // On error, don't show any profiles
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [profileId]);


  const handleMatch = () => {
    // TODO: Implement match functionality
    navigate('/chats');
  };

  const showNextProfile = useCallback(() => {
    if (profiles.length === 0) return;
    const nextIndex = (currentProfileIndex + 1) % profiles.length;
    setCurrentProfileIndex(nextIndex);
    // Update URL without full navigation
    const newUrl = window.location.pathname.includes('profile-demo')
      ? `/profile-demo/${profiles[nextIndex].id}`
      : `/profile/${profiles[nextIndex].id}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentProfileIndex, profiles]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      showNextProfile();
    } else if (isRightSwipe) {
      handleMatch();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        showNextProfile();
      } else if (e.key === 'ArrowRight') {
        handleMatch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNextProfile, handleMatch]);

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return 'Homme';
      case 'FEMALE':
        return 'Femme';
      case 'OTHER':
        return "Ni l'un ni l'autre";
      default:
        return gender;
    }
  };

  const getLookingForDisplay = (items: string[]) => {
    const mapping: { [key: string]: string } = {
      'FRIENDSHIP': 'Amitié',
      'CASUAL': 'Relation libre',
      'SERIOUS': 'Relation suivie',
      'MARRIAGE': 'Mariage / PACS'
    };
    return items.map(item => mapping[item] || item).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-purple-600">Chargement...</div>
      </div>
    );
  }

  if (!profiles.length || !profiles[currentProfileIndex]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-red-600">Aucun profil disponible</div>
      </div>
    );
  }

  const profile = profiles[currentProfileIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card
          className="relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Neutral Banner - Just a background */}
          <div className="relative h-64">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600">
              <div className="absolute inset-0 bg-black opacity-10"></div>
            </div>

            {/* Primary Info Section - Overlaid on banner */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.first_name}</h2>
              <div className="flex flex-wrap gap-4 text-gray-700">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{profile.age} ans</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{getGenderDisplay(profile.gender)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{profile.location.city_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Section */}
          {profile.favorite_quote && (
            <div className="bg-purple-50 p-6 border-b border-purple-100">
              <div className="flex items-start gap-3">
                <Quote className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 italic text-lg">"{profile.favorite_quote}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="p-8 space-y-8">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">À propos de moi</h3>
              <p className="text-gray-700 leading-relaxed">
                {profile.description || "Aucune description disponible."}
              </p>
            </div>

            {/* What they're looking for */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Ce que je recherche
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Teaching Subject */}
              {profile.subject && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Matière enseignée
                  </h3>
                  <p className="text-gray-700">{profile.subject}</p>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              {/* Exclusivity View */}
              {profile.exclusivity_view && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Vision de l'exclusivité
                  </h3>
                  <p className="text-gray-700">{profile.exclusivity_view}</p>
                </div>
              )}

              {/* Pet Info */}
              {profile.has_pet !== undefined && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-amber-500" />
                    Animaux de compagnie
                  </h3>
                  <p className="text-gray-700">
                    {profile.has_pet ? "J'ai un ou plusieurs animaux" : "Je n'ai pas d'animaux"}
                  </p>
                </div>
              )}
            </div>

            {/* Goals */}
            {profile.goals && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mes objectifs</h3>
                <p className="text-gray-700 leading-relaxed">{profile.goals}</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
            <Button
              onClick={showNextProfile}
              variant="secondary"
              size="md"
              disabled={profiles.length <= 1}
            >
              Voir d'autres profils
            </Button>
            <Button
              onClick={handleMatch}
              variant="primary"
              size="lg"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              J'aimerais te connaître
            </Button>
          </div>

          {/* Profile indicator */}
          {profiles.length > 1 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-gray-600">
              {currentProfileIndex + 1} / {profiles.length}
            </div>
          )}

          {/* Swipe hint */}
          {profiles.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1">
              ← Glissez pour naviguer →
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
