import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { MapPin, Heart, Quote, User, Calendar, Users, MessageCircle, PawPrint, Settings } from 'lucide-react';
import { api } from '../services/api';
import { sanitizeHtml } from '../utils/sanitizeHtml';

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

interface SearchCriteria {
  locations: Array<{
    city_name: string;
    coordinates: [number, number];
  }>;
  radii: number[];
  age_min?: number;
  age_max?: number;
  subjects?: string[];
}

interface UserProfile {
  looking_for_gender: string[];
}

const ProfilePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingCriteria, setCheckingCriteria] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showLeftButtonLabel, setShowLeftButtonLabel] = useState(true);
  const [showRightButtonLabel, setShowRightButtonLabel] = useState(true);
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Users group icon (same as "Découvrir des profils")
  const UsersGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
      <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
    </svg>
  );

  // Check if button text fits on one line
  useEffect(() => {
    const checkButtonFit = () => {
      if (leftButtonRef.current) {
        const button = leftButtonRef.current;
        const textElement = button.querySelector('.button-text');
        if (textElement) {
          const textWidth = textElement.scrollWidth;
          const buttonWidth = button.clientWidth;
          // Add some padding tolerance (40px for icon + gaps)
          setShowLeftButtonLabel(textWidth + 60 < buttonWidth);
        }
      }

      if (rightButtonRef.current) {
        const button = rightButtonRef.current;
        const textElement = button.querySelector('.button-text');
        if (textElement) {
          const textWidth = textElement.scrollWidth;
          const buttonWidth = button.clientWidth;
          // Add some padding tolerance (40px for icon + gaps)
          setShowRightButtonLabel(textWidth + 60 < buttonWidth);
        }
      }
    };

    // Check on mount and when profiles change
    checkButtonFit();

    // Check on window resize
    const resizeObserver = new ResizeObserver(checkButtonFit);
    if (leftButtonRef.current) resizeObserver.observe(leftButtonRef.current);
    if (rightButtonRef.current) resizeObserver.observe(rightButtonRef.current);

    return () => resizeObserver.disconnect();
  }, [profiles]);

  // Check if user has search criteria, if not redirect to SearchCriteriaPage
  useEffect(() => {
    const checkSearchCriteria = async () => {
      try {
        const response = await api.get('/profiles/my-profile/search-criteria');
        if (!response.data.criteria) {
          // No search criteria found, redirect to SearchCriteriaPage
          navigate('/search-criteria', { replace: true });
        } else {
          setSearchCriteria(response.data.criteria);
          setCheckingCriteria(false);
        }
      } catch (error) {
        console.error('Error checking search criteria:', error);
        // On error, redirect to search criteria page
        navigate('/search-criteria', { replace: true });
      }
    };

    checkSearchCriteria();
  }, [navigate]);

  // Fetch user's own profile to get looking_for_gender
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/profiles/my-profile');
        setUserProfile(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch profiles from backend
  useEffect(() => {
    // Don't fetch profiles until we've confirmed search criteria exists
    if (checkingCriteria) return;

    const fetchProfiles = async () => {
      try {
        const response = await api.get('/profiles/');
        const data = response.data;

        // Store search criteria from response
        if (data.search_criteria) {
          setSearchCriteria(data.search_criteria);
        }

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
  }, [profileId, checkingCriteria]);


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

  if (loading || checkingCriteria) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-purple-600">Chargement...</div>
      </div>
    );
  }

  const profile = profiles.length > 0 ? profiles[currentProfileIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      {/* Search Criteria Display Bar */}
      {searchCriteria && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm flex-1 min-w-0 overflow-hidden">
                {/* Gender - First on the left */}
                {userProfile?.looking_for_gender && userProfile.looking_for_gender.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700 font-medium">
                      {userProfile.looking_for_gender.map(g => getGenderDisplay(g)).join(', ')}
                    </span>
                  </div>
                )}

                {/* Age Range */}
                {(searchCriteria.age_min || searchCriteria.age_max) && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700 font-medium">
                      {searchCriteria.age_min || '18'}-{searchCriteria.age_max || '100'} ans
                    </span>
                  </div>
                )}

                {/* Locations - Can be truncated */}
                {searchCriteria.locations && searchCriteria.locations.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium truncate">
                      {searchCriteria.locations.map((location, index) =>
                        `${location.city_name}${searchCriteria.radii && searchCriteria.radii[index] !== undefined ? ` (${searchCriteria.radii[index]}km)` : ''}`
                      ).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => navigate('/search-criteria')}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No Profiles Available */}
      {!profile && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <div className="space-y-6">
              <div className="text-gray-600 text-lg">
                Aucun profil disponible
              </div>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Aucun profil ne correspond à vos critères de recherche actuels.
                Essayez de modifier vos critères pour découvrir plus de profils.
              </p>
              <Button
                onClick={() => navigate('/search-criteria')}
                variant="primary"
                className="mx-auto"
              >
                <Settings className="w-4 h-4 mr-2" />
                Modifier mes critères de recherche
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Profile Content */}
      {profile && (
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
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(profile.description || "Aucune description disponible.")
                  }}
                />
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
                    <div
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(profile.exclusivity_view)
                      }}
                    />
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
                  <div
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(profile.goals)
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center gap-4">
              <button
                ref={leftButtonRef}
                onClick={showNextProfile}
                disabled={profiles.length <= 1}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-1 min-w-0"
                title="Voir d'autres profils"
              >
                <UsersGroupIcon />
                {showLeftButtonLabel && (
                  <span className="button-text whitespace-nowrap">Voir d'autres profils</span>
                )}
              </button>
              <button
                ref={rightButtonRef}
                onClick={handleMatch}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg flex-1 min-w-0"
                title="J'aimerais te connaître"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                {showRightButtonLabel && (
                  <span className="button-text whitespace-nowrap">J'aimerais te connaître</span>
                )}
              </button>
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
      )}
    </div>
  );
};

export default ProfilePage;
