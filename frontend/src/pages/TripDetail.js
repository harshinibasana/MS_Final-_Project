import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsAPI } from '../utils/api';
import { format } from 'date-fns';
import {
  ArrowLeft, MapPin, Calendar, Users, DollarSign,
  Pencil, Check, X, Trash2, CheckCircle, Clock,
  Plane, XCircle, ChevronDown, Save, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import BudgetTab from '../components/trips/BudgetTab';
import PlacesTab from '../components/trips/PlacesTab';
import PhotosTab from '../components/trips/PhotosTab';
import PackingTab from '../components/trips/PackingTab';
import OverviewTab from '../components/trips/OverviewTab';
import HotelsTab from '../components/trips/HotelsTab';
import MiscTab from '../components/trips/MiscTab';
import PlansTab        from '../components/trips/PlansTab';
import JournalTab     from '../components/trips/JournalTab';

import './TripDetail.css';

const TABS = ['Overview','Plans','Journal','Budget','Hotels','Places','Photos','Packing','Misc'];
const TAB_ICONS = { Overview:'📊',Plans:'📋',Journal:'📖',Budget:'💰',Hotels:'🏨',Places:'📍',Photos:'📸',Packing:'🧳',Misc:'💼' };

const STATUS_META = {
  planning:  { color:'#3B82F6', bg:'rgba(59,130,246,0.15)',  icon:<Clock size={13}/>,       label:'Planning'  },
  active:    { color:'#22c55e', bg:'rgba(34,197,94,0.15)',   icon:<Plane size={13}/>,       label:'Active'    },
  completed: { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)',  icon:<CheckCircle size={13}/>, label:'Completed' },
  cancelled: { color:'#EF4444', bg:'rgba(239,68,68,0.15)',   icon:<XCircle size={13}/>,    label:'Cancelled' },
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [sharing, setSharing]       = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    tripsAPI.getOne(id)
      .then(res => { setTrip(res.data.trip); setEditForm(res.data.trip); })
      .catch(() => { toast.error('Trip not found'); navigate('/trips'); })
      .finally(() => setLoading(false));
  }, [id]);

  // Close status menu on outside click
  useEffect(() => {
    const h = e => { if (!e.target.closest('.status-menu-wrap')) setShowStatusMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSave = async () => {
    if (!editForm.title?.trim())       return toast.error('Trip title is required');
    if (!editForm.destination?.trim()) return toast.error('Destination is required');
    if (editForm.startDate && editForm.endDate &&
        new Date(editForm.endDate) < new Date(editForm.startDate))
      return toast.error('End date must be after start date');

    setSaving(true);
    try {
      const res = await tripsAPI.update(id, editForm);
      setTrip(res.data.trip);
      setShowEditModal(false);
      toast.success('Trip updated! ✅');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update trip';
      toast.error(msg, { duration: 5000 });
    }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await tripsAPI.update(id, { ...trip, status: newStatus });
      setTrip(res.data.trip);
      setShowStatusMenu(false);
      toast.success(`Trip marked as ${newStatus}!`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    setDeletingTrip(true);
    try {
      await tripsAPI.delete(id);
      toast.success('Trip deleted');
      navigate('/trips');
    } catch { toast.error('Failed to delete trip'); setDeletingTrip(false); }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const { shareAPI } = await import('../utils/api');
      const r = await shareAPI.generate(id);
      setShareToken(r.data.shareToken);
      setShowShareModal(true);
    } catch { toast.error('Failed to generate share link'); }
    finally { setSharing(false); }
  };

  if (loading) return <div className="page-container"><div className="trip-detail-skeleton"/></div>;
  if (!trip) return null;

  const days = Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000*60*60*24));
  const sm = STATUS_META[trip.status] || STATUS_META.planning;

  return (
    <div className="page-container">
      <button className="btn btn-ghost btn-sm back-btn fade-in" onClick={() => navigate('/trips')}>
        <ArrowLeft size={16}/> Back to Trips
      </button>

      {/* ── HERO ── */}
      <div className="trip-hero fade-in" style={{
        backgroundImage: trip.coverImage ? `url(${trip.coverImage})` : 'linear-gradient(135deg,#0A4D6E 0%,#1A7FA8 100%)'
      }}>
        <div className="trip-hero-overlay"/>
        <div className="trip-hero-content">

          {/* Top row: status + actions */}
          <div className="trip-hero-top">
            {/* Status with dropdown */}
            <div className="status-menu-wrap">
              <button className="trip-status-btn" style={{background:sm.bg,borderColor:sm.color,color:sm.color}} onClick={() => setShowStatusMenu(s=>!s)}>
                {sm.icon} {sm.label} <ChevronDown size={12}/>
              </button>
              {showStatusMenu && (
                <div className="status-dropdown">
                  <div className="status-dropdown-title">Change Status</div>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button key={key} className={`status-opt ${trip.status===key?'active':''}`}
                      style={{color:meta.color}} onClick={() => handleStatusChange(key)}>
                      {meta.icon} {meta.label}
                      {trip.status===key && <Check size={12} style={{marginLeft:'auto'}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="trip-hero-actions">
              {trip.status !== 'completed' && (
                <button className="hero-action-btn complete-btn" onClick={() => handleStatusChange('completed')} title="Mark as completed">
                  <CheckCircle size={15}/> Mark Complete
                </button>
              )}
              <button className="hero-action-btn share-btn" onClick={handleShare} disabled={sharing}>
                <span>🔗</span> {sharing?'Sharing...':'Share'}
              </button>
              <button className="hero-action-btn edit-btn" onClick={() => { setEditForm(trip); setShowEditModal(true); }}>
                <Pencil size={15}/> Edit Trip
              </button>
              <button className="hero-action-btn delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={15}/>
              </button>
            </div>
          </div>

          {/* Trip info */}
          <div className="trip-hero-info">
            {trip.status==='completed' && <div className="completed-banner">✅ Trip Completed!</div>}
            <h1>{trip.title}</h1>
            <div className="trip-hero-meta">
              <span><MapPin size={13}/> {trip.destination}{trip.country?`, ${trip.country}`:''}</span>
              <span><Calendar size={13}/> {format(new Date(trip.startDate),'MMM d')} – {format(new Date(trip.endDate),'MMM d, yyyy')}</span>
              <span>📅 {days} days</span>
              <span><Users size={13}/> {trip.travelers} traveler{trip.travelers!==1?'s':''}</span>
              {trip.totalBudget>0 && <span><DollarSign size={13}/> ${trip.totalBudget.toLocaleString()} {trip.currency}</span>}
            </div>
            {trip.tags?.length>0 && (
              <div className="trip-tags">{trip.tags.map(t=><span key={t} className="trip-tag">#{t}</span>)}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="trip-tabs fade-in">
        {TABS.map(tab => (
          <button key={tab} className={`trip-tab ${activeTab===tab?'active':''}`} onClick={()=>setActiveTab(tab)}>
            <span className="trip-tab-icon">{TAB_ICONS[tab]}</span> {tab}
          </button>
        ))}
      </div>

      <div className="trip-tab-content fade-in" key={activeTab}>
        {activeTab==='Overview'    && <OverviewTab trip={trip} setTrip={setTrip}/>}
        {activeTab==='Plans'       && <PlansTab tripId={id}/>}
        {activeTab==='Journal'     && <JournalTab tripId={id} trip={trip}/>}
        {activeTab==='Budget'      && <BudgetTab tripId={id} trip={trip}/>}
        {activeTab==='Hotels'      && <HotelsTab tripId={id} trip={trip}/>}
        {activeTab==='Places'      && <PlacesTab tripId={id}/>}
        {activeTab==='Photos'      && <PhotosTab tripId={id}/>}
        {activeTab==='Packing'     && <PackingTab tripId={id}/>}
        {activeTab==='Misc'        && <MiscTab tripId={id}/>}
      </div>

      {/* ── SHARE MODAL ── */}
      {showShareModal && shareToken && (
        <div className="td-modal-overlay" onClick={()=>setShowShareModal(false)}>
          <div className="td-modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div className="tdm-header">
              <h3>🔗 Share This Trip</h3>
              <button className="tdm-close" onClick={()=>setShowShareModal(false)}><X size={18}/></button>
            </div>
            <div className="tdm-body" style={{padding:20}}>
              <p style={{fontSize:13,color:'#64748b',marginBottom:14}}>Anyone with this link can view your trip's plans, budget summary and itinerary.</p>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <input readOnly value={`${window.location.origin}/shared/${shareToken}`}
                  style={{flex:1,padding:'9px 12px',border:'1.5px solid #E2E8F0',borderRadius:9,fontSize:13,background:'#F8FAFC'}}/>
                <button className="btn btn-primary btn-sm" onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/shared/${shareToken}`);toast.success('Link copied!');}}>
                  Copy
                </button>
              </div>
              <p style={{fontSize:12,color:'#94a3b8'}}>Tip: Your expenses and journal entries are <strong>not</strong> shared.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="td-modal-overlay" onClick={()=>setShowEditModal(false)}>
          <div className="td-modal" onClick={e=>e.stopPropagation()}>
            <div className="tdm-header">
              <h3><Pencil size={17}/> Edit Trip</h3>
              <button className="tdm-close" onClick={()=>setShowEditModal(false)}><X size={18}/></button>
            </div>
            <div className="tdm-body">
              <div className="tdm-grid">
                <div className="tdm-field full">
                  <label>Trip Title *</label>
                  <input value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="e.g. Summer in Europe"/>
                </div>
                <div className="tdm-field">
                  <label>Destination *</label>
                  <input value={editForm.destination||''} onChange={e=>setEditForm({...editForm,destination:e.target.value})} placeholder="City or place"/>
                </div>
                <div className="tdm-field">
                  <label>Country</label>
                  <input value={editForm.country||''} onChange={e=>setEditForm({...editForm,country:e.target.value})} placeholder="Country"/>
                </div>
                <div className="tdm-field">
                  <label>Start Date</label>
                  <input type="date" value={editForm.startDate?editForm.startDate.slice(0,10):''} onChange={e=>setEditForm({...editForm,startDate:e.target.value})}/>
                </div>
                <div className="tdm-field">
                  <label>End Date</label>
                  <input type="date" value={editForm.endDate?editForm.endDate.slice(0,10):''} onChange={e=>setEditForm({...editForm,endDate:e.target.value})}/>
                </div>
                <div className="tdm-field">
                  <label>Travelers</label>
                  <input type="number" min="1" value={editForm.travelers||1} onChange={e=>setEditForm({...editForm,travelers:parseInt(e.target.value)})}/>
                </div>
                <div className="tdm-field">
                  <label>Budget</label>
                  <input type="number" min="0" value={editForm.totalBudget||''} onChange={e=>setEditForm({...editForm,totalBudget:parseFloat(e.target.value)||0})} placeholder="0"/>
                </div>
                <div className="tdm-field">
                  <label>Currency</label>
                  <select value={editForm.currency||'USD'} onChange={e=>setEditForm({...editForm,currency:e.target.value})}>
                    {['USD','EUR','GBP','JPY','AUD','CAD','INR','SGD','CHF','MYR'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="tdm-field">
                  <label>Status</label>
                  <select value={editForm.status||'planning'} onChange={e=>setEditForm({...editForm,status:e.target.value})}>
                    <option value="planning">🗓️ Planning</option>
                    <option value="active">✈️ Active</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
                <div className="tdm-field full">
                  <label>Trip Colour <span style={{fontSize:11,color:'var(--text-muted)',fontWeight:400}}>— shown in calendar</span></label>
                  <div className="tdm-color-row">
                    {['#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6','#EC4899','#14B8A6','#F97316','#3B82F6','#EF4444','#22c55e','#A855F7'].map(c=>(
                      <button key={c} className={`tdm-color-swatch ${(editForm.color||'#0A4D6E')===c?'selected':''}`}
                        style={{background:c}} onClick={()=>setEditForm({...editForm,color:c})} type="button"
                        title={c}/>
                    ))}
                    <input type="color" className="tdm-color-custom" value={editForm.color||'#0A4D6E'}
                      onChange={e=>setEditForm({...editForm,color:e.target.value})} title="Custom colour"/>
                  </div>
                </div>
                <div className="tdm-field full">
                  <label>Cover Image URL</label>
                  <input value={editForm.coverImage||''} onChange={e=>setEditForm({...editForm,coverImage:e.target.value})} placeholder="https://..."/>
                </div>
                <div className="tdm-field full">
                  <label>Notes</label>
                  <textarea rows={3} value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})} placeholder="Trip notes, reminders..."/>
                </div>
              </div>
            </div>
            <div className="tdm-footer">
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={14}/> {saving?'Saving...':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {showDeleteConfirm && (
        <div className="td-modal-overlay" onClick={()=>setShowDeleteConfirm(false)}>
          <div className="td-modal confirm-modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="tdm-confirm-icon"><AlertTriangle size={26} color="white"/></div>
            <h3>Delete this trip?</h3>
            <p>All data including expenses, places, hotels and photos will be permanently deleted. This cannot be undone.</p>
            <div className="tdm-confirm-actions">
              <button className="btn btn-ghost" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDelete} disabled={deletingTrip}>
                <Trash2 size={15}/> {deletingTrip?'Deleting...':'Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
