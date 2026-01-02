import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LeafletMouseEvent } from 'leaflet';

// Fix for default marker icon in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number, address?: string, city?: string, state?: string, postalCode?: string, fullAddress?: string) => void;
}

const LocationMarker = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    const map = useMapEvents({
        click(e: LeafletMouseEvent) {
            setPosition(e.latlng);
            onSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
    initialLat,
    initialLng,
    onLocationSelect
}) => {
    const [position, setPosition] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : [-34.6037, -58.3816] // Default to Buenos Aires
    );

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
                    );
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error searching location:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = async (lat: number, lng: number) => {
        setPosition([lat, lng]);

        // Reverse Geocoding using Nominatim (OpenStreetMap)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();

            // Construct a better address from components if available
            let address = data.display_name?.split(',')[0] || '';
            if (data.address?.road) {
                address = data.address.road;
                if (data.address.house_number) {
                    address += ` ${data.address.house_number}`;
                }
            }
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
            const state = data.address?.state || '';
            const postalCode = data.address?.postcode || '';

            onLocationSelect(lat, lng, address, city, state, postalCode, data.display_name);
        } catch (error) {
            console.error("Error fetching address:", error);
            onLocationSelect(lat, lng); // Still update coords even if geocoding fails
        }
    };

    const handleSuggestionClick = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);

        // Update position and notify parent
        handleSelect(lat, lon);

        // Clear search
        setQuery('');
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-2">
            <div className="relative z-[1001]">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar dirección o ciudad (ej: Calle 123, Buenos Aires)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {isSearching && (
                    <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 border-b last:border-b-0 border-gray-100"
                            >
                                {suggestion.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    key={`${position[0]}-${position[1]}`} // Force re-render on position change to re-center map
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker onSelect={handleSelect} />
                    {initialLat && initialLng && <Marker position={[initialLat, initialLng]} />}
                </MapContainer>
                <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-md z-[1000] text-xs text-gray-600">
                    Haz clic en el mapa para seleccionar ubicación
                </div>
            </div>
        </div>
    );
};
