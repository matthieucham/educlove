import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Button, Card } from '../components/ui';

const ProfilePage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  // Placeholder data for a single profile
  const profile = {
    id: parseInt(profileId || '0', 10),
    firstName: 'Alice',
    picture: 'https://via.placeholder.com/300',
    bio: 'I am a passionate teacher who loves hiking and reading.',
  };

  const handleMatch = () => {
    // For now, just navigate to the chats page
    navigate('/chats');
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

      <Card className="max-w-2xl w-full overflow-hidden p-0">
        <img
          src={profile.picture}
          alt={profile.firstName}
          className="w-full h-96 object-cover"
        />
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-800">{profile.firstName}</h1>
          <p className="text-gray-600 mt-4">{profile.bio}</p>
          <Button
            onClick={handleMatch}
            variant="primary"
            size="lg"
            className="mt-6"
          >
            Envoyer un Match
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
