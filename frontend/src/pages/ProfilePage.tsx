import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Modal } from '../components/ui';
import { MapPin, Heart, Quote, User, Calendar, Users, MessageCircle, PawPrint, Settings, Send } from 'lucide-react';
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingCriteria, setCheckingCriteria] = useState(true);
  const [fetchingNewProfile, setFetchingNewProfile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showLeftButtonLabel, setShowLeftButtonLabel] = useState(true);
  const [showRightButtonLabel, setShowRightButtonLabel] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
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
  }, [profile]);

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

  // Fetch a single profile from backend
  const fetchProfile = useCallback(async () => {
    if (checkingCriteria) return;

    setFetchingNewProfile(true);
    try {
      const response = await api.get('/profiles/');
      const data = response.data;

      // Store search criteria from response
      if (data.search_criteria) {
        setSearchCriteria(data.search_criteria);
      }

      // Check if we got a profile
      if (data.profiles && data.profiles.length > 0) {
        const p = data.profiles[0];
        // Transform backend data to match our interface
        const transformedProfile: ProfileData = {
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
        };
        setProfile(transformedProfile);

        // Update URL with the new profile ID
        const newUrl = window.location.pathname.includes('profile-demo')
          ? `/profile-demo/${transformedProfile.id}`
          : `/profile/${transformedProfile.id}`;
        window.history.replaceState(null, '', newUrl);
      } else {
        // No more profiles available
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
      setFetchingNewProfile(false);
    }
  }, [checkingCriteria]);

  // Initial profile fetch
  useEffect(() => {
    if (!checkingCriteria) {
      fetchProfile();
    }
  }, [checkingCriteria, fetchProfile]);

  // Function to record profile visit
  const recordProfileVisit = async (profileId: string) => {
    try {
      await api.post(`/api/profile-visits/${profileId}`);
    } catch (error) {
      // Silently fail - we don't want to interrupt the user experience
      console.error('Failed to record profile visit:', error);
    }
  };

  const handleMatch = async () => {
    // Record profile visit when user clicks "J'aimerais te connaitre"
    if (profile) {
      await recordProfileVisit(profile.id);
    }
    // Show modal to send a message with the like
    setShowMessageModal(true);
  };

  const handleSendLike = async () => {
    if (!profile || !message.trim()) return;

    setSendingMessage(true);
    try {
      // Send like with message
      const response = await api.post(`/profiles/${profile.id}:like`, {
        message: message.trim()
      });

      // Check if it's a mutual match
      if (response.data.action === 'mutual_match') {
        // Navigate to messages/chat
        navigate('/chats');
      } else {
        // Fetch a new profile after successful like
        setMessage('');
        setShowMessageModal(false);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error sending like:', error);
      alert('Une erreur est survenue lors de l\'envoi du message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelMessage = () => {
    setMessage('');
    setShowMessageModal(false);
  };

  const showNextProfile = useCallback(async () => {
    if (!profile || fetchingNewProfile) return;

    // Record profile visit when user clicks "Voir d'autres profils"
    await recordProfileVisit(profile.id);

    // Fetch a new profile
    await fetchProfile();
  }, [profile, fetchingNewProfile, fetchProfile]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = async () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && profile) {
      // Record profile visit when swiping left
      await recordProfileVisit(profile.id);
      showNextProfile();
    } else if (isRightSwipe && profile) {
      // Record profile visit when swiping right
      await recordProfileVisit(profile.id);
      handleMatch();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      if (!profile || fetchingNewProfile) return;

      if (e.key === 'ArrowLeft') {
        // Record profile visit when using arrow key
        await recordProfileVisit(profile.id);
        showNextProfile();
      } else if (e.key === 'ArrowRight') {
        // Record profile visit when using arrow key
        await recordProfileVisit(profile.id);
        handleMatch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNextProfile, handleMatch, profile, fetchingNewProfile]);

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
                disabled={fetchingNewProfile}
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

            {/* Swipe hint */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1">
              ← Glissez pour naviguer →
            </div>
          </Card>

          {/* Message Modal */}
          <Modal
            isOpen={showMessageModal}
            onClose={handleCancelMessage}
            title="Envoyer un message"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Présentez-vous à {profile.first_name} avec un message personnalisé :
              </p>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bonjour ! J'ai vu ton profil et j'aimerais faire connaissance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4}
                maxLength={500}
                autoFocus
              />

              <div className="text-sm text-gray-500 text-right">
                {message.length}/500 caractères
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={handleCancelMessage}
                  variant="secondary"
                  disabled={sendingMessage}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendLike}
                  variant="primary"
                  disabled={!message.trim() || sendingMessage}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendingMessage ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
