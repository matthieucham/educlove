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
    bio: 'I am a passionate teacher who loves hiking and reading.',
  };

  // Placeholder background image - using a gradient as placeholder
  const placeholderBackground = 'https://via.placeholder.com/800x400/9333ea/ec4899?text=';

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
        <div
          className="w-full h-96 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(236, 72, 153, 0.8)), url('${placeholderBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="text-white text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="text-5xl font-bold">{profile.firstName.charAt(0)}</span>
            </div>
            <h2 className="text-3xl font-bold">{profile.firstName}</h2>
          </div>
        </div>
        <div className="p-8">
          <p className="text-gray-600 mt-2">{profile.bio}</p>
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
