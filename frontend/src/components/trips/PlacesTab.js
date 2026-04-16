import React, { useState, useEffect } from 'react';
import { placesAPI } from '../../utils/api';
import { Plus, Trash2, MapPin, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import MapView from '../common/MapView';
import '../common/MapView.css';
import './tabs.css';

const CATS = ['restaurant', 'hotel', 'attraction', 'museum', 'beach', 'park', 'shopping', 'nightlife', 'other'];
const CAT_ICONS = { restaurant: '🍽️', hotel: '🏨', attraction: '🏛️', museum: '🎨', beach: '🏖️', park: '🌳', shopping: '🛍️', nightlife: '🎵', other: '📍' };

export default function PlacesTab({ tripId }) {
  const [places, setPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMapId, setShowMapId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', category: 'attraction', rating: '', notes: '', website: '' });

  useEffect(() => {
    placesAPI.getByTrip(tripId).then(res => setPlaces(res.data.places));
  }, [tripId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await placesAPI.create({ ...form, trip: tripId, rating: form.rating ? parseInt(form.rating) : null });
      setPlaces([res.data.place, ...places]);
      setForm({ name: '', address: '', category: 'attraction', rating: '', notes: '', website: '' });
      setShowForm(false);
      toast.success('Place added!');
    } catch { toast.error('Failed to add place'); }
  };

  const toggleVisited = async (place) => {
    const res = await placesAPI.update(place._id, { visited: !place.visited });
    setPlaces(places.map(p => p._id === place._id ? res.data.place : p));
  };

  const handleDelete = async (id) => {
    await placesAPI.delete(id);
    setPlaces(places.filter(p => p._id !== id));
    toast.success('Place removed');
  };

  const filtered = filter === 'all' ? places : filter === 'visited' ? places.filter(p => p.visited) : places.filter(p => !p.visited);

  return (
    <div className="places-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'visited', 'pending'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${places.length})` : f === 'visited' ? `(${places.filter(p => p.visited).length})` : `(${places.filter(p => !p.visited).length})`}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Place
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <h3>Add Place to Visit</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Place Name *</label>
              <input className="form-input" placeholder="e.g. Senso-ji Temple" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Street address or area" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1-5)</label>
              <select className="form-input" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})}>
                <option value="">No rating</option>
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{'⭐'.repeat(r)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" placeholder="Opening hours, tips, etc." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Add Place</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><MapPin size={40} className="empty-icon" /><p>No places {filter !== 'all' ? `marked as ${filter}` : 'added yet'}.</p></div>
      ) : (
        <div className="places-grid">
          {filtered.map(place => (
            <div key={place._id} className="place-card">
              <div className="place-card-header">
                <div>
                  <span style={{ fontSize: 20, marginRight: 8 }}>{CAT_ICONS[place.category]}</span>
                  <span className="place-name">{place.name}</span>
                </div>
                <span className="place-cat-badge">{place.category}</span>
              </div>
              {place.address && <div className="place-address"><MapPin size={12} />{place.address}</div>}
              {place.notes && <div className="place-notes">{place.notes}</div>}
              <div className="place-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {place.rating && <span className="place-rating">{'⭐'.repeat(place.rating)}</span>}
                  {place.visited && <span className="visited-badge">✓ Visited</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {place.address && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMapId(showMapId === place._id ? null : place._id)} title="Show on map">
                      🗺️
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleVisited(place)} title={place.visited ? 'Mark unvisited' : 'Mark visited'}>
                    {place.visited ? <CheckCircle size={16} color="var(--sage)" /> : <Circle size={16} />}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(place._id)}><Trash2 size={13} /></button>
                </div>
              </div>
              {showMapId === place._id && (
                <div style={{ marginTop: 10 }}>
                  <MapView name={place.name} address={place.address} zoom={15} height={240}/>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
