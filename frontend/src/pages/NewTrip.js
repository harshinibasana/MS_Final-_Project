import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Users,
  Globe, FileText, Tag, Loader, Plane
} from 'lucide-react';
import './NewTrip.css';

const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','INR','SGD','MYR'];
const TAG_SUGGESTIONS = ['adventure','beach','solo','couple','family','backpacking','luxury','roadtrip','culture','food'];

export default function NewTrip() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [existingTrips, setExistingTrips] = useState([]);
  const [conflict, setConflict]           = useState(null); // overlapping trip
  const [form, setForm] = useState({
    title:'', destination:'', country:'',
    startDate:'', endDate:'',
    status:'planning', totalBudget:'', currency:'USD',
    travelers:1, notes:'', tags:'',
  });

  useEffect(() => {
    tripsAPI.getAll().then(r => setExistingTrips(r.data.trips || [])).catch(() => {});
  }, []);

  // Check for date overlap whenever startDate or endDate changes
  const checkOverlap = (start, end) => {
    if (!start || !end) { setConflict(null); return; }
    const s = new Date(start), e = new Date(end);
    if (e < s) { setConflict(null); return; }
    const clash = existingTrips.find(t => {
      if (t.status === 'cancelled') return false;
      const ts = new Date(t.startDate), te = new Date(t.endDate);
      return ts <= e && te >= s;
    });
    setConflict(clash || null);
  };

  const set = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'startDate' || key === 'endDate') {
        checkOverlap(
          key === 'startDate' ? val : f.startDate,
          key === 'endDate'   ? val : f.endDate
        );
      }
      return next;
    });
  };

  const addTag = (tag) => {
    const current = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      set('tags', [...current, tag].join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Trip title is required');
    if (!form.destination.trim()) return toast.error('Destination is required');
    if (!form.startDate) return toast.error('Start date is required');
    if (!form.endDate) return toast.error('End date is required');
    if (new Date(form.endDate) < new Date(form.startDate)) return toast.error('End date must be after start date');
    if (conflict) return toast.error(`These dates overlap with "${conflict.title}". Please choose different dates.`, { duration: 5000 });

    setLoading(true);
    try {
      const res = await tripsAPI.create({
        ...form,
        totalBudget: parseFloat(form.totalBudget) || 0,
        travelers: parseInt(form.travelers) || 1,
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      });
      toast.success('🎉 Trip created! Let\'s plan it.');
      navigate(`/trips/${res.data.trip._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trip');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="new-trip-header fade-in">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15}/> Back
        </button>
        <h1 style={{marginTop:14}}>Plan New Trip ✈️</h1>
        <p className="subtitle">Fill in the details to kick off your adventure</p>
      </div>

      <form onSubmit={handleSubmit} className="new-trip-form fade-in">

        {/* ── CARD 1: Trip Details ── */}
        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon"><Globe size={19}/></div>
            <div>
              <h2>Trip Details</h2>
              <p>Where are you heading and when?</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trip Title *</label>
              <input className="form-input" placeholder="e.g. Tokyo Adventure 2025" value={form.title} onChange={e=>set('title',e.target.value)} required/>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e=>set('status',e.target.value)}>
                <option value="planning">🗓️ Planning</option>
                <option value="active">✈️ Active</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-icon"><MapPin size={11}/> Destination *</label>
              <input className="form-input" placeholder="e.g. Tokyo" value={form.destination} onChange={e=>set('destination',e.target.value)} required/>
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" placeholder="e.g. Japan" value={form.country} onChange={e=>set('country',e.target.value)}/>
            </div>
          </div>

          {/* ── EXISTING TRIP DATES ── */}
          {existingTrips.filter(t => t.status !== 'cancelled').length > 0 && (
            <div className="nt-existing-trips">
              <div className="nt-et-label">📅 Your existing trips (these dates are taken):</div>
              <div className="nt-et-list">
                {existingTrips.filter(t => t.status !== 'cancelled').map(t => {
                  const s = new Date(t.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'});
                  const e = new Date(t.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
                  const isClash = conflict?._id === t._id;
                  return (
                    <div key={t._id} className={`nt-et-item ${isClash ? 'clash' : ''}`}>
                      <span className="nt-et-dot" style={{background: isClash ? '#EF4444' : '#0A4D6E'}}/>
                      <span className="nt-et-title">{t.title}</span>
                      <span className="nt-et-dates">{s} → {e}</span>
                      {isClash && <span className="nt-et-clash-badge">⚠️ Conflict</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-icon"><Calendar size={11}/> Start Date *</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e=>set('startDate',e.target.value)} required/>
            </div>
            <div className="form-group">
              <label className="form-label form-label-icon"><Calendar size={11}/> End Date *</label>
              <input type="date" className="form-input" value={form.endDate} min={form.startDate} onChange={e=>set('endDate',e.target.value)} required/>
            </div>
          </div>

          {/* ── CONFLICT WARNING ── */}
          {conflict && (
            <div className="nt-conflict-box">
              <div className="nt-cb-icon">⚠️</div>
              <div className="nt-cb-text">
                <strong>Date conflict!</strong>
                <span> &quot;{conflict.title}&quot; is already planned from{' '}
                  {new Date(conflict.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} to{' '}
                  {new Date(conflict.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}.
                  These dates overlap — please choose different dates.
                </span>
              </div>
            </div>
          )}
          {form.startDate && form.endDate && !conflict && new Date(form.endDate) >= new Date(form.startDate) && (
            <div className="nt-dates-ok">
              ✅ Dates are available — no conflicts with your existing trips
            </div>
          )}
        </div>

        {/* ── CARD 2: Budget & Travelers ── */}
        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon"><DollarSign size={19}/></div>
            <div>
              <h2>Budget & Travelers</h2>
              <p>How much are you spending and who's coming?</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Budget</label>
              <div className="input-with-prefix">
                <select className="input-prefix" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                  {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" className="form-input prefixed" placeholder="0.00" min="0" step="0.01" value={form.totalBudget} onChange={e=>set('totalBudget',e.target.value)}/>
              </div>
              <p className="form-input-hint">Leave blank if budget is flexible</p>
            </div>
            <div className="form-group">
              <label className="form-label form-label-icon"><Users size={11}/> Number of Travelers</label>
              <input type="number" className="form-input" min="1" max="50" value={form.travelers} onChange={e=>set('travelers',e.target.value)}/>
            </div>
          </div>
        </div>

        {/* ── CARD 3: Extra Info ── */}
        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon"><FileText size={19}/></div>
            <div>
              <h2>Notes & Tags</h2>
              <p>Any extra details or labels for this trip</p>
            </div>
          </div>

          <div className="form-group" style={{marginBottom:18}}>
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={4} placeholder="Trip ideas, reminders, packing notes..." value={form.notes} onChange={e=>set('notes',e.target.value)} style={{resize:'vertical'}}/>
          </div>

          <div className="form-group">
            <label className="form-label form-label-icon"><Tag size={11}/> Tags</label>
            <input className="form-input" placeholder="e.g. beach, solo, adventure" value={form.tags} onChange={e=>set('tags',e.target.value)}/>
            <div className="tags-hint">
              <span style={{color:'var(--text-muted)',background:'none',border:'none',cursor:'default',padding:'3px 0'}}>Quick add:</span>
              {TAG_SUGGESTIONS.filter(t => !form.tags.includes(t)).slice(0,6).map(t=>(
                <span key={t} onClick={()=>addTag(t)}>+ {t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost btn-lg" onClick={()=>navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !!conflict}>
            {loading ? <><Loader size={16} className="spin"/> Creating...</> : conflict ? <>⚠️ Date Conflict — Fix Dates</> : <><Plane size={16}/> Create Trip</>}
          </button>
        </div>
      </form>
    </div>
  );
}
