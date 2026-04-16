import React, { useState, useEffect } from 'react';
import { rentalsAPI } from '../../utils/api';
import { Plus, Trash2, Car } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './tabs.css';

const CAR_TYPES = ['economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury', 'convertible', 'van'];
const CAR_ICONS = { economy: '🚗', compact: '🚙', midsize: '🚘', fullsize: '🏎️', suv: '🚐', luxury: '🏎️', convertible: '🚗', van: '🚌' };

export default function RentalsTab({ tripId, trip }) {
  const [rentals, setRentals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company: '', carModel: '', carType: 'economy',
    pickupLocation: '', dropoffLocation: '',
    pickupDate: '', dropoffDate: '',
    pricePerDay: '', totalPrice: '',
    confirmationNumber: '', insurance: false, notes: '',
  });

  useEffect(() => {
    rentalsAPI.getByTrip(tripId).then(res => setRentals(res.data.rentals));
  }, [tripId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await rentalsAPI.create({ ...form, trip: tripId, pricePerDay: parseFloat(form.pricePerDay), totalPrice: parseFloat(form.totalPrice) });
      setRentals([res.data.rental, ...rentals]);
      setShowForm(false);
      toast.success('Car rental added!');
    } catch { toast.error('Failed to add rental'); }
  };

  const handleDelete = async (id) => {
    await rentalsAPI.delete(id);
    setRentals(rentals.filter(r => r._id !== id));
    toast.success('Rental deleted');
  };

  const handleStatusChange = async (id, status) => {
    const res = await rentalsAPI.update(id, { status });
    setRentals(rentals.map(r => r._id === id ? res.data.rental : r));
  };

  return (
    <div className="rentals-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'DM Sans', fontWeight: 600 }}>{rentals.length} Car Rental{rentals.length !== 1 ? 's' : ''}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Rental
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <h3><Car size={18} /> Add Car Rental</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rental Company *</label>
              <input className="form-input" placeholder="e.g. Hertz, Enterprise" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Car Model *</label>
              <input className="form-input" placeholder="e.g. Toyota Corolla" value={form.carModel} onChange={e => setForm({...form, carModel: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Car Type</label>
              <select className="form-input" value={form.carType} onChange={e => setForm({...form, carType: e.target.value})}>
                {CAR_TYPES.map(t => <option key={t} value={t}>{CAR_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price Per Day ($) *</label>
              <input type="number" className="form-input" placeholder="0.00" min="0" step="0.01" value={form.pricePerDay} onChange={e => setForm({...form, pricePerDay: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Price ($) *</label>
              <input type="number" className="form-input" placeholder="0.00" min="0" step="0.01" value={form.totalPrice} onChange={e => setForm({...form, totalPrice: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmation #</label>
              <input className="form-input" placeholder="Booking reference" value={form.confirmationNumber} onChange={e => setForm({...form, confirmationNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Location *</label>
              <input className="form-input" placeholder="Airport, hotel, etc." value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Dropoff Location</label>
              <input className="form-input" placeholder="Same as pickup if blank" value={form.dropoffLocation} onChange={e => setForm({...form, dropoffLocation: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Date *</label>
              <input type="date" className="form-input" value={form.pickupDate} onChange={e => setForm({...form, pickupDate: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Dropoff Date *</label>
              <input type="date" className="form-input" value={form.dropoffDate} onChange={e => setForm({...form, dropoffDate: e.target.value})} required />
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="insurance" checked={form.insurance} onChange={e => setForm({...form, insurance: e.target.checked})} />
            <label htmlFor="insurance" style={{ fontSize: 14, cursor: 'pointer' }}>Include Insurance</label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Add Rental</button>
          </div>
        </form>
      )}

      {rentals.length === 0 ? (
        <div className="empty-state"><Car size={48} className="empty-icon" /><p>No car rentals yet.</p></div>
      ) : rentals.map(rental => (
        <div key={rental._id} className="rental-card">
          <div className="rental-card-header">
            <div>
              <div className="rental-company">{CAR_ICONS[rental.carType]} {rental.company}</div>
              <div className="rental-car">{rental.carModel} · {rental.carType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="rental-price">${rental.totalPrice?.toLocaleString()}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>${rental.pricePerDay}/day</div>
            </div>
          </div>
          <div className="rental-card-body">
            <div className="rental-details">
              <div className="rental-detail"><div className="rental-detail-label">Pickup</div>{rental.pickupLocation}</div>
              <div className="rental-detail"><div className="rental-detail-label">Dropoff</div>{rental.dropoffLocation || rental.pickupLocation}</div>
              <div className="rental-detail"><div className="rental-detail-label">From</div>{format(new Date(rental.pickupDate), 'MMM d, yyyy')}</div>
              <div className="rental-detail"><div className="rental-detail-label">To</div>{format(new Date(rental.dropoffDate), 'MMM d, yyyy')}</div>
              {rental.confirmationNumber && <div className="rental-detail"><div className="rental-detail-label">Confirmation</div>{rental.confirmationNumber}</div>}
              {rental.insurance && <div className="rental-detail"><div className="rental-detail-label">Insurance</div>✓ Included</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <select className={`badge badge-${rental.status}`} style={{ border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12 }}
                value={rental.status} onChange={e => handleStatusChange(rental._id, e.target.value)}>
                {['pending','confirmed','active','completed','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rental._id)}><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
