import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../../lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    value?: string;
    coordinates?: [number, number] | null;
    onChange?: (city: string, coordinates: [number, number]) => void;
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    modalClassName?: string;
    mapCenter?: [number, number];
    mapZoom?: number;
    disabled?: boolean;
}

// Icon component for the map pin and close button
const Icon = ({ path, className = "w-5 h-5" }: { path: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const icons = {
    mapPin: "M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
};

// Map click handler component
const MapClickHandler: React.FC<{
    onLocationSelect: (city: string, coordinates: [number, number]) => void;
    onClose: () => void;
}> = ({ onLocationSelect, onClose }) => {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                );
                const data = await response.json();
                const cityName =
                    data.address.city ||
                    data.address.town ||
                    data.address.village ||
                    'Lieu inconnu';
                onLocationSelect(cityName, [lng, lat]); // Note: coordinates are [lng, lat] for consistency
            } catch (error) {
                console.error("Error fetching city name:", error);
                const fallbackName = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
                onLocationSelect(fallbackName, [lng, lat]);
            } finally {
                onClose();
            }
        },
    });
    return null;
};

const MapPicker: React.FC<MapPickerProps> = ({
    value = '',
    coordinates = null,
    onChange,
    placeholder = 'Ex: Paris, Lyon, Marseille...',
    className,
    buttonClassName,
    modalClassName,
    mapCenter = [48.8566, 2.3522], // Default to Paris
    mapZoom = 6,
    disabled = false
}) => {
    const [isMapVisible, setMapVisible] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [currentCoordinates, setCurrentCoordinates] = useState<[number, number] | null>(coordinates);

    const handleLocationSelect = (city: string, coords: [number, number]) => {
        setInputValue(city);
        setCurrentCoordinates(coords);
        if (onChange) {
            onChange(city, coords);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setCurrentCoordinates(null);
        if (onChange) {
            onChange(newValue, [0, 0]); // Reset coordinates when manually typing
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <input
                    className={cn(
                        "flex-1 px-4 py-2 border border-gray-300 rounded-lg",
                        "focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        className
                    )}
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={() => setMapVisible(true)}
                    disabled={disabled}
                    className={cn(
                        "p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg",
                        "hover:from-purple-700 hover:to-pink-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-all duration-200",
                        buttonClassName
                    )}
                    title="Sélectionner sur la carte"
                >
                    <Icon path={icons.mapPin} />
                </button>
            </div>

            {showCoordinates && currentCoordinates && currentCoordinates[0] !== 0 && currentCoordinates[1] !== 0 && (
                <div className="mt-1 text-xs text-gray-500">
                    <Icon path={icons.location} className="w-3 h-3 inline mr-1" />
                    Coordonnées: [{currentCoordinates[0].toFixed(4)}, {currentCoordinates[1].toFixed(4)}]
                </div>
            )}

            {/* Map Modal */}
            {isMapVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className={cn(
                        "bg-white p-4 rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 h-3/4 relative",
                        modalClassName
                    )}>
                        <h3 className="text-lg font-bold mb-2">
                            Cliquez sur la carte pour choisir un lieu
                        </h3>
                        <div className="h-[calc(100%-40px)] w-full">
                            <MapContainer
                                center={currentCoordinates && currentCoordinates[0] !== 0 && currentCoordinates[1] !== 0
                                    ? [currentCoordinates[1], currentCoordinates[0]]
                                    : mapCenter}
                                zoom={currentCoordinates && currentCoordinates[0] !== 0 && currentCoordinates[1] !== 0
                                    ? 10
                                    : mapZoom}
                                scrollWheelZoom={true}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickHandler
                                    onLocationSelect={handleLocationSelect}
                                    onClose={() => setMapVisible(false)}
                                />
                                {/* Show marker at registered location if coordinates exist */}
                                {currentCoordinates && currentCoordinates[0] !== 0 && currentCoordinates[1] !== 0 && (
                                    <Marker position={[currentCoordinates[1], currentCoordinates[0]]} />
                                )}
                            </MapContainer>
                        </div>
                        <button
                            onClick={() => setMapVisible(false)}
                            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md hover:shadow-lg transition-shadow"
                        >
                            <Icon path={icons.close} className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MapPicker;
