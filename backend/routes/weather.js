const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

// GET weather for a city using Open-Meteo (free, no API key needed)
// First geocodes with Nominatim, then fetches forecast
router.get('/', protect, async (req, res) => {
  const { city, country, lat, lng } = req.query;
  try {
    let finalLat = lat, finalLng = lng;

    // If no coords, geocode from city name
    if (!finalLat || !finalLng) {
      if (!city) return res.status(400).json({ success:false, message:'city or lat/lng required' });
      const q = encodeURIComponent(`${city}${country ? ', '+country : ''}`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Travelify/1.0' }
      });
      const geoData = await geoRes.json();
      if (!geoData?.[0]) return res.status(404).json({ success:false, message:'Location not found' });
      finalLat = geoData[0].lat;
      finalLng = geoData[0].lon;
    }

    // Fetch 7-day forecast from Open-Meteo (completely free, no key)
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=auto&forecast_days=7`;
    const wRes  = await fetch(wUrl);
    const wData = await wRes.json();

    res.json({ success:true, weather: wData, location: { lat:finalLat, lng:finalLng, city } });
  } catch(err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;
