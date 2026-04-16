import React, { useState } from 'react';
import { ExternalLink, MapPin, Navigation, Route } from 'lucide-react';

/**
 * MapView — shows OpenStreetMap embed (free, no API key) for any lat/lng or address.
 * Falls back to geocoding the address via Nominatim if no coordinates are given.
 */
export default function MapView({ lat, lng, name, address, zoom = 15, height = 300 }) {
  const [geoResult, setGeoResult] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const hasCoords = lat && lng;

  // Geocode address using Nominatim (free OSM geocoding)
  const geocode = async () => {
    if (!address || geoLoading || geoResult) return;
    setGeoLoading(true);
    try {
      const q = encodeURIComponent(address + (name ? ` ${name}` : ''));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data?.[0]) {
        setGeoResult({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setGeoError(true);
      }
    } catch {
      setGeoError(true);
    } finally {
      setGeoLoading(false);
    }
  };

  const finalLat = hasCoords ? lat : geoResult?.lat;
  const finalLng = hasCoords ? lng : geoResult?.lng;
  const label    = encodeURIComponent(name || address || 'Location');

  // If we have coordinates, show the map
  if (finalLat && finalLng) {
    const delta  = 0.012 / Math.pow(2, zoom - 14);
    const bbox   = `${finalLng - delta},${finalLat - delta * 0.8},${finalLng + delta},${finalLat + delta * 0.8}`;
    const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${finalLat},${finalLng}`;
    const osmUrl = `https://www.openstreetmap.org/?mlat=${finalLat}&mlon=${finalLng}#map=${zoom}/${finalLat}/${finalLng}`;

    return (
      <div className="mapview-wrap">
        <div className="mapview-container" style={{ height }}>
          <iframe
            title={name || 'Map'}
            src={osmSrc}
            className="mapview-iframe"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="mapview-actions">
          <a href={osmUrl} target="_blank" rel="noreferrer" className="mva-btn">
            <ExternalLink size={12}/> OpenStreetMap
          </a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${finalLat},${finalLng}`}
            target="_blank" rel="noreferrer" className="mva-btn">
            <Route size={12}/> Google Directions
          </a>
          <a href={`https://maps.apple.com/?ll=${finalLat},${finalLng}&q=${label}`}
            target="_blank" rel="noreferrer" className="mva-btn">
            <MapPin size={12}/> Apple Maps
          </a>
        </div>
      </div>
    );
  }

  // No coordinates — offer to geocode from address
  if (address && !geoError) {
    return (
      <div className="mapview-geocode">
        <MapPin size={28} className="mvg-icon"/>
        <p className="mvg-text">
          {geoLoading ? 'Finding location…' : `Show "${name || address}" on map?`}
        </p>
        {!geoLoading && (
          <button className="mvg-btn" onClick={geocode}>
            <Navigation size={14}/> Find on Map
          </button>
        )}
        {geoLoading && <div className="mvg-loading"/>}
      </div>
    );
  }

  // No address/coords at all or geocode failed
  return (
    <div className="mapview-empty">
      <MapPin size={28}/>
      <p>No location data available</p>
      {address && (
        <a href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
          target="_blank" rel="noreferrer" className="mva-btn">
          <ExternalLink size={12}/> Search on Google Maps
        </a>
      )}
    </div>
  );
}
