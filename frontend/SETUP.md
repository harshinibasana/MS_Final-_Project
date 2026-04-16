## Google Maps Setup

1. Go to https://console.cloud.google.com/
2. Create a project → Enable these 3 APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Directions API**
3. Create an API Key → Credentials → Create Credentials → API Key
4. Copy the key
5. Create a file called `.env` in the `frontend/` folder:

```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_KEY=paste_your_key_here
```

6. Restart the frontend: `npm start`

### What the key enables
- 🗺️ Interactive maps on destination/place detail panels
- 📍 **Nearby Places** using real Google Places data (ratings, photos, open/closed)
- 🔍 Live place search with autocomplete
- 🧭 Directions from your location to destinations

### Without the key
- 12 static curated destinations still work
- Nearby places falls back to OpenStreetMap data (no ratings/photos)
