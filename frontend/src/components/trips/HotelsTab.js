import React, { useState, useEffect } from 'react';
import { hotelsAPI } from '../../utils/api';
import { Plus, Trash2, Building2, Star, Wifi, Coffee, Car, Waves, Edit2, Check } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './HotelsTab.css';
import MapView from '../common/MapView';
import '../common/MapView.css';

const PROPERTY_TYPES = ['hotel', 'motel', 'hostel', 'resort', 'villa', 'apartment', 'bnb', 'guesthouse'];
const ROOM_TYPES = ['single', 'double', 'twin', 'suite', 'family', 'deluxe', 'penthouse'];
const PROP_ICONS = { hotel: '🏨', motel: '🛣️', hostel: '🎒', resort: '🌴', villa: '🏡', apartment: '🏢', bnb: '☕', guesthouse: '🏠' };
const STATUS_COLORS = { pending: 'badge-planning', confirmed: 'badge-active', 'checked-in': 'badge-active', 'checked-out': 'badge-completed', cancelled: 'badge-cancelled' };

const COMMON_AMENITIES = ['Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Concierge', 'Room Service', 'Laundry', 'Business Center', 'Airport Shuttle'];

const defaultForm = {
  propertyName: '', propertyType: 'hotel', starRating: 3,
  address: '', city: '', country: '',
  phone: '', email: '', website: '',
  checkIn: '', checkOut: '',
  roomType: 'double', guests: 1, rooms: 1,
  pricePerNight: '', totalPrice: '',
  currency: 'USD', taxesIncluded: false,
  confirmationNumber: '', bookingPlatform: '',
  breakfastIncluded: false, parkingIncluded: false, wifiIncluded: true, poolAccess: false,
  specialRequests: '', notes: '',
  amenities: [],
};

export default function HotelsTab({ tripId, trip }) {
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showMapId, setShowMapId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    hotelsAPI.getByTrip(tripId).then(res => setBookings(res.data.bookings));
  }, [tripId]);

  // Auto-calculate total
  useEffect(() => {
    if (form.pricePerNight && form.checkIn && form.checkOut) {
      const nights = Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24));
      if (nights > 0) setForm(f => ({ ...f, totalPrice: (parseFloat(f.pricePerNight) * nights * parseInt(f.rooms || 1)).toFixed(2) }));
    }
  }, [form.pricePerNight, form.checkIn, form.checkOut, form.rooms]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await hotelsAPI.update(editId, { ...form, trip: tripId });
        setBookings(bookings.map(b => b._id === editId ? res.data.booking : b));
        toast.success('Booking updated!');
      } else {
        const res = await hotelsAPI.create({ ...form, trip: tripId });
        setBookings([res.data.booking, ...bookings]);
        toast.success('Hotel booking added!');
      }
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
    } catch { toast.error('Failed to save booking'); }
  };

  const handleEdit = (booking) => {
    setEditId(booking._id);
    setForm({
      ...booking,
      checkIn: booking.checkIn?.split('T')[0],
      checkOut: booking.checkOut?.split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    await hotelsAPI.delete(id);
    setBookings(bookings.filter(b => b._id !== id));
    toast.success('Booking deleted');
  };

  const handleStatus = async (id, status) => {
    const res = await hotelsAPI.updateStatus(id, status);
    setBookings(bookings.map(b => b._id === id ? res.data.booking : b));
  };

  const toggleAmenity = (a) => {
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
  };

  const totalCost = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalPrice, 0);

  return (
    <div className="hotels-tab">
      <div className="hotels-header">
        <div>
          <div className="hotels-total">💰 Total Accommodation: <strong>${totalCost.toLocaleString()}</strong></div>
          <div className="hotels-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm); }}>
          <Plus size={16} /> Add Hotel/Motel
        </button>
      </div>

      {showForm && (
        <form className="hotel-form" onSubmit={handleSubmit}>
          <h3><Building2 size={18} /> {editId ? 'Edit Booking' : 'New Hotel/Motel Booking'}</h3>

          <div className="hotel-form-section">
            <div className="hotel-form-section-title">Property Details</div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Property Name *</label>
                <input className="form-input" placeholder="e.g. Grand Hyatt Tokyo" value={form.propertyName} onChange={e => set('propertyName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{PROP_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Star Rating</label>
                <div className="star-picker">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={22} fill={s <= form.starRating ? '#F5A623' : 'transparent'} color="#F5A623" className="star-pick" onClick={() => set('starRating', s)} />
                  ))}
                </div>
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="Street address" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <input className="form-input" placeholder="Country" value={form.country} onChange={e => set('country', e.target.value)} required />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+1 234 567 8900" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="hotel@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Booking Platform</label>
                <input className="form-input" placeholder="Booking.com, Expedia..." value={form.bookingPlatform} onChange={e => set('bookingPlatform', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="hotel-form-section">
            <div className="hotel-form-section-title">Stay Details</div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Check-in *</label>
                <input type="date" className="form-input" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Check-out *</label>
                <input type="date" className="form-input" value={form.checkOut} onChange={e => set('checkOut', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-input" value={form.roomType} onChange={e => set('roomType', e.target.value)}>
                  {ROOM_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Guests</label>
                <input type="number" className="form-input" min="1" value={form.guests} onChange={e => set('guests', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Rooms</label>
                <input type="number" className="form-input" min="1" value={form.rooms} onChange={e => set('rooms', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['USD','EUR','GBP','JPY','AUD','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Price Per Night *</label>
                <input type="number" className="form-input" min="0" step="0.01" placeholder="0.00" value={form.pricePerNight} onChange={e => set('pricePerNight', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Price (auto-calculated)</label>
                <input type="number" className="form-input" min="0" step="0.01" value={form.totalPrice} onChange={e => set('totalPrice', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmation #</label>
                <input className="form-input" placeholder="Booking reference" value={form.confirmationNumber} onChange={e => set('confirmationNumber', e.target.value)} />
              </div>
            </div>

            {/* Inclusions */}
            <div className="inclusions-row">
              {[
                { key: 'breakfastIncluded', icon: <Coffee size={15} />, label: 'Breakfast' },
                { key: 'parkingIncluded', icon: <Car size={15} />, label: 'Parking' },
                { key: 'wifiIncluded', icon: <Wifi size={15} />, label: 'WiFi' },
                { key: 'poolAccess', icon: <Waves size={15} />, label: 'Pool' },
                { key: 'taxesIncluded', icon: <Check size={15} />, label: 'Taxes Incl.' },
              ].map(({ key, icon, label }) => (
                <label key={key} className={`inclusion-toggle ${form[key] ? 'active' : ''}`}>
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ display: 'none' }} />
                  {icon} {label}
                </label>
              ))}
            </div>
          </div>

          <div className="hotel-form-section">
            <div className="hotel-form-section-title">Amenities</div>
            <div className="amenities-picker">
              {COMMON_AMENITIES.map(a => (
                <button key={a} type="button" className={`amenity-btn ${form.amenities?.includes(a) ? 'active' : ''}`} onClick={() => toggleAmenity(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="hotel-form-section">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Special Requests</label>
                <textarea className="form-input" rows="2" placeholder="e.g. High floor, early check-in..." value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows="2" placeholder="Internal notes..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); setForm(defaultForm); }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Update Booking' : '🏨 Add Booking'}</button>
          </div>
        </form>
      )}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} className="empty-icon" />
          <h3>No hotel bookings yet</h3>
          <p>Add your accommodation details to keep everything organized</p>
        </div>
      ) : (
        <div className="hotels-list">
          {bookings.map(b => {
            const nights = Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
            return (
              <div key={b._id} className="hotel-card">
                <div className="hotel-card-header">
                  <div className="hotel-card-title">
                    <span className="hotel-prop-icon">{PROP_ICONS[b.propertyType] || '🏨'}</span>
                    <div>
                      <h3>{b.propertyName}</h3>
                      <div className="hotel-stars">
                        {[...Array(b.starRating || 0)].map((_, i) => <Star key={i} size={13} fill="#F5A623" color="#F5A623" />)}
                      </div>
                    </div>
                  </div>
                  <div className="hotel-card-price">
                    <div className="hotel-total">${b.totalPrice?.toLocaleString()}</div>
                    <div className="hotel-nights">{nights} night{nights !== 1 ? 's' : ''} · ${b.pricePerNight}/night</div>
                  </div>
                </div>

                <div className="hotel-card-body">
                  <div className="hotel-details-grid">
                    <div className="hotel-detail"><span className="hotel-detail-label">📍 Location</span>{b.city}, {b.country}</div>
                    <div className="hotel-detail"><span className="hotel-detail-label">🛏️ Room</span>{b.roomType} · {b.rooms} room{b.rooms !== 1 ? 's' : ''} · {b.guests} guest{b.guests !== 1 ? 's' : ''}</div>
                    <div className="hotel-detail"><span className="hotel-detail-label">📅 Check-in</span>{format(new Date(b.checkIn), 'EEE, MMM d yyyy')}</div>
                    <div className="hotel-detail"><span className="hotel-detail-label">📅 Check-out</span>{format(new Date(b.checkOut), 'EEE, MMM d yyyy')}</div>
                    {b.confirmationNumber && <div className="hotel-detail"><span className="hotel-detail-label">🎫 Confirmation</span>{b.confirmationNumber}</div>}
                    {b.bookingPlatform && <div className="hotel-detail"><span className="hotel-detail-label">🌐 Platform</span>{b.bookingPlatform}</div>}
                  </div>

                  {/* Inclusions */}
                  <div className="hotel-inclusions">
                    {b.breakfastIncluded && <span className="inclusion-tag"><Coffee size={12} /> Breakfast</span>}
                    {b.wifiIncluded && <span className="inclusion-tag"><Wifi size={12} /> WiFi</span>}
                    {b.parkingIncluded && <span className="inclusion-tag"><Car size={12} /> Parking</span>}
                    {b.poolAccess && <span className="inclusion-tag"><Waves size={12} /> Pool</span>}
                    {b.taxesIncluded && <span className="inclusion-tag"><Check size={12} /> Taxes incl.</span>}
                  </div>

                  {b.amenities?.length > 0 && (
                    <div className="hotel-amenities">
                      {b.amenities.map(a => <span key={a} className="amenity-chip">{a}</span>)}
                    </div>
                  )}

                  {b.specialRequests && <div className="hotel-requests">💬 {b.specialRequests}</div>}
                </div>

                <div className="hotel-card-footer">
                  <select className={`badge ${STATUS_COLORS[b.status]}`} style={{ border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, background: 'inherit', color: 'inherit' }}
                    value={b.status} onChange={e => handleStatus(b._id, e.target.value)}>
                    {['pending','confirmed','checked-in','checked-out','cancelled'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMapId(showMapId === b._id ? null : b._id)} title="Show on map">🗺️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(b)}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                {showMapId === b._id && (
                  <div className="hotel-map-wrap">
                    <MapView
                      name={b.propertyName}
                      address={`${b.address || ''} ${b.city} ${b.country}`}
                      zoom={15}
                      height={260}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
