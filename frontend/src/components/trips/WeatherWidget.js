import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../utils/api';
import { Cloud, Wind, Droplets, Sun, Loader, RefreshCw } from 'lucide-react';
import './WeatherWidget.css';

const WMO = {
  0:'☀️ Clear',1:'🌤️ Mainly clear',2:'⛅ Partly cloudy',3:'☁️ Overcast',
  45:'🌫️ Foggy',48:'🌫️ Icy fog',51:'🌦️ Light drizzle',61:'🌧️ Light rain',
  63:'🌧️ Moderate rain',65:'🌧️ Heavy rain',71:'🌨️ Light snow',80:'🌦️ Rain showers',
  95:'⛈️ Thunderstorm',
};
const getWMO = code => WMO[code] || '🌡️ Variable';

export default function WeatherWidget({ destination, country }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    if (!destination) return;
    setLoading(true); setError('');
    try {
      const r = await weatherAPI.get({ city: destination, country: country||'' });
      setWeather(r.data.weather);
    } catch { setError('Could not load weather'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [destination]);

  if (!destination) return null;

  if (loading) return (
    <div className="weather-widget loading">
      <Loader size={20} className="spin"/><span>Loading weather for {destination}…</span>
    </div>
  );
  if (error) return (
    <div className="weather-widget error">
      <span>{error}</span>
      <button onClick={load} className="ww-retry"><RefreshCw size={12}/> Retry</button>
    </div>
  );
  if (!weather) return null;

  const c = weather.current;
  const daily = weather.daily;
  const days = (daily?.time||[]).slice(0,7);

  return (
    <div className="weather-widget">
      <div className="ww-header">
        <div className="ww-title">🌤️ Weather — {destination}</div>
        <button className="ww-refresh" onClick={load} title="Refresh"><RefreshCw size={13}/></button>
      </div>

      {/* Current */}
      <div className="ww-current">
        <div className="ww-temp">{Math.round(c.temperature_2m)}°C</div>
        <div className="ww-desc">
          <div className="ww-condition">{getWMO(c.weather_code)}</div>
          <div className="ww-feels">Feels like {Math.round(c.apparent_temperature)}°C</div>
        </div>
        <div className="ww-stats">
          <div className="ww-stat"><Droplets size={13}/> {c.relative_humidity_2m}%</div>
          <div className="ww-stat"><Wind size={13}/> {Math.round(c.wind_speed_10m)} km/h</div>
          <div className="ww-stat"><Sun size={13}/> UV {c.uv_index}</div>
        </div>
      </div>

      {/* 7-day forecast */}
      {days.length > 0 && (
        <div className="ww-forecast">
          {days.map((day, i) => {
            const date = new Date(day);
            const label = i===0?'Today': i===1?'Tomorrow': date.toLocaleDateString('en',{weekday:'short'});
            return (
              <div key={day} className="ww-day">
                <span className="ww-day-label">{label}</span>
                <span className="ww-day-icon">{getWMO(daily.weather_code[i]).split(' ')[0]}</span>
                <div className="ww-day-temps">
                  <span className="ww-hi">{Math.round(daily.temperature_2m_max[i])}°</span>
                  <span className="ww-lo">{Math.round(daily.temperature_2m_min[i])}°</span>
                </div>
                {daily.precipitation_sum[i] > 0 && (
                  <span className="ww-rain"><Droplets size={9}/>{daily.precipitation_sum[i].toFixed(1)}mm</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
