import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Avatar } from '../components/ui';

const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const MyMatchesPage: React.FC = () => {
  const navigate = useNavigate();
  // Placeholder data for profiles that liked the current user
  const likedProfiles = [
    { id: 1, firstName: 'Alice', picture: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: 2, firstName: 'Bob', picture: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: 3, firstName: 'Charlie', picture: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { id: 4, firstName: 'Diana', picture: 'https://randomuser.me/api/portraits/women/4.jpg' },
    { id: 5, firstName: 'Ethan', picture: 'https://randomuser.me/api/portraits/men/5.jpg' },
  ];

  const [hiddenProfiles, setHiddenProfiles] = React.useState<number[]>([]);
  const [animatingProfiles, setAnimatingProfiles] = React.useState<number[]>([]);

  const handleHideProfile = (profileId: number) => {
    // Add to animating profiles
    setAnimatingProfiles((prev) => [...prev, profileId]);

    // Hide the profile after a short delay to show the animation
    setTimeout(() => {
      setHiddenProfiles((prev) => [...prev, profileId]);
      // Remove from animating profiles after hiding
      setTimeout(() => {
        setAnimatingProfiles((prev) => prev.filter(id => id !== profileId));
      }, 100);
    }, 500);
  };

  const handleUnhideAll = () => {
    // Add all hidden profiles to animating list
    setAnimatingProfiles(hiddenProfiles);

    // Unhide all profiles
    setHiddenProfiles([]);

    // Remove animation after it completes
    setTimeout(() => {
      setAnimatingProfiles([]);
    }, 1000);
  };

  const icons = {
    eye: "M10 12a2 2 0 100-4 2 2 0 000 4z M3.37 9.04A7.024 7.024 0 0110 5c2.65 0 5.05.99 6.63 2.63.5.5.5 1.38 0 1.88A10.013 10.013 0 0110 15c-2.65 0-5.05-.99-6.63-2.63a1.32 1.32 0 010-1.88z",
    eyeOff: "M10 15a5 5 0 100-10 5 5 0 000 10zM3 10a7 7 0 1114 0 7 7 0 01-14 0z"
  };

  return (
    <div>
      <div className="text-right mb-4">
        <Button
          onClick={handleUnhideAll}
          variant="secondary"
          size="md"
          className="rounded-full p-2"
          aria-label="unhide all"
        >
          <Icon path={icons.eye} />
        </Button>
      </div>
      <div className="space-y-4">
        {likedProfiles
          .filter((profile) => !hiddenProfiles.includes(profile.id))
          .map((profile) => (
            <Card
              key={profile.id}
              variant={animatingProfiles.includes(profile.id) ? "gradient" : "bordered"}
              className={`p-4 transition-all duration-300 ${animatingProfiles.includes(profile.id)
                  ? 'animate-pulse shadow-lg'
                  : 'hover:border-purple-300 hover:bg-purple-50'
                }`}
            >
              <div className="flex items-center">
                <Avatar
                  src={profile.picture}
                  alt={profile.firstName}
                  size="lg"
                />
                <div className="flex-grow mx-4">
                  <h2 className="text-xl font-semibold">{profile.firstName}</h2>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => navigate(`/profile/${profile.id}`)}
                    variant="primary"
                    size="md"
                  >
                    Voir profil
                  </Button>
                  <Button
                    onClick={() => handleHideProfile(profile.id)}
                    variant="ghost"
                    size="md"
                    className="rounded-full p-2"
                    aria-label="hide"
                  >
                    <Icon path={icons.eyeOff} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default MyMatchesPage;
