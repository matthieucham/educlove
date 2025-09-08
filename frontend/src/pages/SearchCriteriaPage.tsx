import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../services/api';
import 'leaflet/dist/leaflet.css';

// A helper component for the icons to keep the main component cleaner.
const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const MultiSelect = ({
  label,
  options,
  selected = [],
  onSelectionChange
}: {
  label: string;
  options: string[];
  selected?: string[];
  onSelectionChange: (selected: string[]) => void;
}) => {
  const toggleOption = (option: string) => {
    const newSelection = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onSelectionChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selected.includes(option)
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-purple-100 border border-gray-300'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const SearchCriteriaPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userProfile = location.state?.userProfile;
  const searchCriteria = location.state?.searchCriteria;

  // Initialize state with user's saved search criteria if available
  const [locations, setLocations] = useState<string[]>(
    searchCriteria?.location ? [searchCriteria.location] : ['']
  );
  const [radii, setRadii] = useState<number[]>([25]);
  const [isMapVisible, setMapVisible] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedOrientation, setSelectedOrientation] = useState<string[]>(
    userProfile?.sexualOrientation ? [userProfile.sexualOrientation] : []
  );
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(
    searchCriteria?.lookingFor ? [searchCriteria.lookingFor] : []
  );

  // Load saved search criteria from backend
  useEffect(() => {
    const loadSearchCriteria = async () => {
      try {
        const response = await api.get('/profiles/my-profile/search-criteria');
        if (response.data.criteria) {
          const savedCriteria = response.data.criteria;

          // Set all the form fields from saved criteria
          if (savedCriteria.gender) {
            setSelectedGender(savedCriteria.gender);
          }
          if (savedCriteria.orientation) {
            setSelectedOrientation(savedCriteria.orientation);
          }
          if (savedCriteria.looking_for) {
            setSelectedLookingFor(savedCriteria.looking_for);
          }
          if (savedCriteria.age_min !== null && savedCriteria.age_min !== undefined) {
            setMinAge(savedCriteria.age_min.toString());
          }
          if (savedCriteria.age_max !== null && savedCriteria.age_max !== undefined) {
            setMaxAge(savedCriteria.age_max.toString());
          }
          if (savedCriteria.locations && savedCriteria.locations.length > 0) {
            setLocations(savedCriteria.locations.map((loc: any) => loc.city_name || ''));
          }
          if (savedCriteria.radii && savedCriteria.radii.length > 0) {
            setRadii(savedCriteria.radii);
          }
        }
      } catch (error) {
        console.error('Error loading search criteria:', error);
      }
    };

    loadSearchCriteria();
  }, []);

  // Pre-fill form with user's saved criteria (from navigation state)
  useEffect(() => {
    if (userProfile) {
      // Set location from profile if available
      if (userProfile.location && locations[0] === '') {
        setLocations([userProfile.location]);
      }

      // Set looking for preference
      if (userProfile.lookingFor) {
        const lookingForMap: { [key: string]: string } = {
          'friendship': 'Amitié',
          'casual': 'Relation légère',
          'serious': 'Relation sérieuse'
        };
        const frenchLookingFor = lookingForMap[userProfile.lookingFor];
        if (frenchLookingFor && !selectedLookingFor.includes(frenchLookingFor)) {
          setSelectedLookingFor([frenchLookingFor]);
        }
      }
    }
  }, [userProfile]);

  const icons = {
    region: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    gender: "M9 6a3 3 0 11-6 0 3 3 0 016 0zm-1.518 5.5A5.002 5.002 0 011 15a.5.5 0 01-1 0 6 6 0 0111.22-3.995.5.5 0 01-.59.814zM16 8a3 3 0 11-6 0 3 3 0 016 0zm-1.518 5.5A5.002 5.002 0 0111 15a.5.5 0 01-1 0 6 6 0 0111.22-3.995.5.5 0 01-.59.814z",
    age: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    subject: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
    lookingFor: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    orientation: "M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || 'Lieu inconnu';
          const newLocations = [...locations];
          newLocations[activeLocationIndex] = city;
          setLocations(newLocations);
        } catch (error) {
          console.error("Error fetching city name:", error);
          const newLocations = [...locations];
          newLocations[activeLocationIndex] = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
          setLocations(newLocations);
        } finally {
          setMapVisible(false);
        }
      },
    });
    return null;
  };

  const handleAddLocation = () => {
    if (locations.length < 3) {
      setLocations([...locations, '']);
      setRadii([...radii, 25]);
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
    setRadii(radii.filter((_, i) => i !== index));
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Critères de recherche</h1>
        <form className="space-y-6">
          {userProfile && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-700">
                <strong>Critères de recherche pour :</strong> {userProfile.name}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MultiSelect
              label="Je recherche..."
              options={['Homme', 'Femme', 'Autre']}
              selected={selectedGender}
              onSelectionChange={setSelectedGender}
            />
            <MultiSelect
              label="Orientation sexuelle"
              options={['Hétérosexuel(le)', 'Homosexuel(le)', 'Bisexuel(le)', 'Autre']}
              selected={selectedOrientation}
              onSelectionChange={setSelectedOrientation}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="ageRange">
              Tranche d'âge
            </label>
            <div className="flex items-center space-x-3">
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="minAge"
                type="number"
                placeholder="Min"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
              <span className="text-gray-500 font-bold">-</span>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                id="maxAge"
                type="number"
                placeholder="Max"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
          </div>

          <MultiSelect
            label="Sa recherche"
            options={['Amitié', 'Relation légère', 'Relation sérieuse']}
            selected={selectedLookingFor}
            onSelectionChange={setSelectedLookingFor}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sa localisation
            </label>
            {locations.map((location, index) => (
              <div key={index} className="flex items-center mb-2 space-x-2">
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={location}
                  onChange={(e) => {
                    const newLocations = [...locations];
                    newLocations[index] = e.target.value;
                    setLocations(newLocations);
                  }}
                  type="text"
                  placeholder="Entrez une ville ou cliquez sur la carte"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveLocationIndex(index);
                    setMapVisible(true);
                  }}
                  className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                  <Icon path={icons.region} />
                </button>
                <select
                  value={radii[index]}
                  onChange={(e) => {
                    const newRadii = [...radii];
                    newRadii[index] = Number(e.target.value);
                    setRadii(newRadii);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={0}>0 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(index)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Icon path={icons.close} />
                  </button>
                )}
              </div>
            ))}
            {locations.length < 3 && (
              <button
                type="button"
                onClick={handleAddLocation}
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                + Ajouter une localisation
              </button>
            )}

            {isMapVisible && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 h-3/4 relative">
                  <h3 className="text-lg font-bold mb-2">Cliquez sur la carte pour choisir un lieu</h3>
                  <div className="h-[calc(100%-40px)] w-full">
                    <MapContainer center={[48.8566, 2.3522]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler />
                    </MapContainer>
                  </div>
                  <button onClick={() => setMapVisible(false)} className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md">
                    <Icon path={icons.close} className="w-6 h-6 text-gray-700" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200"
              type="button"
              onClick={async () => {
                try {
                  // Prepare search criteria data
                  const searchCriteriaData = {
                    locations: locations
                      .filter(loc => loc !== '')
                      .map((loc, index) => {
                        // Send city name with [0, 0] coordinates to trigger geocoding in backend
                        return {
                          city_name: loc,
                          coordinates: [0, 0] // Backend will geocode this automatically
                        };
                      }),
                    radii: radii.slice(0, locations.filter(loc => loc !== '').length),
                    age_min: minAge ? parseInt(minAge) : undefined,
                    age_max: maxAge ? parseInt(maxAge) : undefined,
                    gender: selectedGender,
                    orientation: selectedOrientation,
                    looking_for: selectedLookingFor,
                  };

                  // Remove undefined values
                  Object.keys(searchCriteriaData).forEach(key => {
                    if (searchCriteriaData[key as keyof typeof searchCriteriaData] === undefined) {
                      delete searchCriteriaData[key as keyof typeof searchCriteriaData];
                    }
                  });

                  // Debug: Log the data being sent
                  console.log('Sending search criteria:', searchCriteriaData);

                  // Save search criteria to backend (backend will geocode the locations)
                  await api.post('/profiles/my-profile/search-criteria', searchCriteriaData);

                  // Navigate to profiles page
                  navigate('/profiles');
                } catch (error) {
                  console.error('Error saving search criteria:', error);
                  alert('Erreur lors de la sauvegarde des critères de recherche');
                }
              }}
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchCriteriaPage;
