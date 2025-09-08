import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Logo from '../components/Logo';
import { useAuthStore } from '../store/authStore';

// A helper component for the icons to keep the main component cleaner.
const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      const onScroll = () => {
        setScrollProgress(emblaApi.scrollProgress());
      };
      emblaApi.on('scroll', onScroll);
      return () => {
        emblaApi.off('scroll', onScroll);
      };
    }
  }, [emblaApi]);

  const images = [
    '/src/assets/welcome-photo1.png',
    '/src/assets/welcome-photo2.png',
    '/src/assets/welcome-photo3.png',
    // Add more images here if needed
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4 font-sans">
      <nav className="w-full max-w-5xl mx-auto flex justify-between items-center p-4 text-gray-800">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
            <Logo size="large" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold ml-3 text-gray-800">EducLove</h1>
        </div>
        <div className="space-x-4 flex items-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200"
              >
                Mon Profil
              </Link>
              <button
                onClick={handleLogout}
                className="font-semibold text-purple-600 hover:text-purple-700 transition duration-200"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-700">Se connecter</Link>
              <Link to="/create-account" className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200">S'inscrire</Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center flex-grow text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">La rencontre entre profs, partout en France !</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Que vous soyez en poste à Paris, en vacances en Bretagne ou muté à Marseille, trouvez votre perle rare aux <s className="line-through">quatre</s> six coins de l'hexagone.
          </p>

          <div className="embla w-full relative overflow-hidden aspect-3/2" ref={emblaRef}>
            <div className="embla__container flex h-full">
              {images.map((src, index) => (
                <div className="embla__slide min-w-0 flex-shrink-0 w-full h-full" key={index}>
                  <img src={src} alt={`Carousel image ${index + 1}`} className="rounded-lg shadow-lg w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-2 z-20">
              <button className="embla__prev bg-black/50 text-white rounded-full p-2 hover:bg-black" onClick={scrollPrev} aria-label="previous">
                <Icon path="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20">
              <button className="embla__next bg-black/50 text-white rounded-full p-2 hover:bg-black" onClick={scrollNext} aria-label="next">
                <Icon path="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full" style={{ width: `${scrollProgress * 100}%` }}></div>
          </div>
          <Link to="/profiles">
            <button className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200">
              Voir les profils
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
