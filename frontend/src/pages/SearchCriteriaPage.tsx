import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { MapPicker } from '../components/ui';
import { api } from '../services/api';

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
  options: Array<{ value: string; label: string }> | string[];
  selected?: string[];
  onSelectionChange: (selected: string[]) => void;
}) => {
  const toggleOption = (value: string) => {
    const newSelection = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onSelectionChange(newSelection);
  };

  // Handle both string[] and {value, label}[] formats
  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {normalizedOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selected.includes(option.value)
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-purple-100 border border-gray-300'
              }`}
          >
            {option.label}
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
  const [locations, setLocations] = useState<Array<{ city: string; coordinates: [number, number] | null }>>(
    searchCriteria?.location ? [{ city: searchCriteria.location, coordinates: null }] : [{ city: '', coordinates: null }]
  );
  const [radii, setRadii] = useState<number[]>([25]);
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');

  // Load saved search criteria from backend
  useEffect(() => {
    const loadSearchCriteria = async () => {
      try {
        const response = await api.get('/profiles/my-profile/search-criteria');
        if (response.data.criteria) {
          const savedCriteria = response.data.criteria;

          // Set all the form fields from saved criteria
          if (savedCriteria.age_min !== null && savedCriteria.age_min !== undefined) {
            setMinAge(savedCriteria.age_min.toString());
          }
          if (savedCriteria.age_max !== null && savedCriteria.age_max !== undefined) {
            setMaxAge(savedCriteria.age_max.toString());
          }
          if (savedCriteria.locations && savedCriteria.locations.length > 0) {
            setLocations(savedCriteria.locations.map((loc: any) => ({
              city: loc.city_name || '',
              coordinates: loc.coordinates || null
            })));
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

  const icons = {
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
  };

  const handleAddLocation = () => {
    if (locations.length < 3) {
      setLocations([...locations, { city: '', coordinates: null }]);
      setRadii([...radii, 25]);
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
    setRadii(radii.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center p-4">

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sa localisation
            </label>
            {locations.map((location, index) => (
              <div key={`${index}-${location.city}`} className="mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-grow basis-64">
                    <MapPicker
                      key={`map-${index}-${location.city}`}
                      value={location.city}
                      coordinates={location.coordinates}
                      onChange={(city, coords) => {
                        const newLocations = [...locations];
                        newLocations[index] = { city, coordinates: coords };
                        setLocations(newLocations);
                      }}
                      placeholder="Entrez une ville ou cliquez sur la carte"
                    />
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
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
                      .filter(loc => loc.city !== '')
                      .map((loc) => {
                        return {
                          city_name: loc.city,
                          coordinates: loc.coordinates || [0, 0] // Backend will geocode if [0, 0]
                        };
                      }),
                    radii: radii.slice(0, locations.filter(loc => loc.city !== '').length),
                    age_min: minAge ? parseInt(minAge) : undefined,
                    age_max: maxAge ? parseInt(maxAge) : undefined,
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

                  // Navigate to profiles page - profiles will be re-fetched automatically
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
