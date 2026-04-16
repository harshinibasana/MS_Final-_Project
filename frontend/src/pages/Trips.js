import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { tripsAPI } from '../utils/api';
import { format } from 'date-fns';
import {
  MapPin, Calendar, Plus, Search, Trash2, Globe, DollarSign,
  Pencil, CheckCircle2, Clock, Plane, XCircle, MoreVertical,
  X, Eye, AlertTriangle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Trips.css';

const STATUS_OPTS   = ['all','planning','active','completed','cancelled'];
const STATUS_COLORS = { planning:'#3B82F6', active:'#22c55e', completed:'#8B5CF6', cancelled:'#EF4444' };
const STATUS_ICONS  = { planning:'🗓️', active:'✈️', completed:'✅', cancelled:'❌' };
const STATUS_BG     = { planning:'rgba(59,130,246,0.1)', active:'rgba(34,197,94,0.1)', completed:'rgba(139,92,246,0.1)', cancelled:'rgba(239,68,68,0.1)' };

export default function Trips() {
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus]   = useState(searchParams.get('status') || 'all');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const s = searchParams.get('status'); if (s) setStatus(s);
  }, [searchParams]);

  useEffect(() => {
    tripsAPI.getAll().then(res => setTrips(res.data.trips || [])).finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await tripsAPI.delete(deleteConfirm.id);
      setTrips(prev => prev.filter(t => t._id !== deleteConfirm.id));
      toast.success(`"${deleteConfirm.title}" deleted`);
      setDeleteConfirm(null);
    } catch { toast.error('Failed to delete trip'); }
    finally { setDeleting(false); }
  };

  const handleStatusChange = async (id, newStatus, e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await tripsAPI.update(id, { status: newStatus });
      setTrips(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      toast.success(`Marked as ${newStatus}!`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleStatusFilter = (s) => {
    setStatus(s);
    s !== 'all' ? setSearchParams({ status: s }) : setSearchParams({});
  };

  const filtered = trips.filter(t => {
    const okStatus = status === 'all' || t.status === status;
    const okSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase());
    return okStatus && okSearch;
  });

  if (loading) return (
    <div className="page-container">
      <div className="skeleton-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card" style={{height:240}}/>)}</div>
    </div>
  );

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header fade-in">
        <div>
          <h1>My Trips</h1>
          <p className="subtitle">
            {trips.length} total · {trips.filter(t=>t.status==='active').length} active · {trips.filter(t=>t.status==='completed').length} completed
          </p>
        </div>
        <Link to="/trips/new" className="btn btn-primary btn-lg"><Plus size={18}/> New Trip</Link>
      </div>

      {/* STATUS SUMMARY PILLS */}
      {trips.length > 0 && (
        <div className="trips-status-summary fade-in">
          {['planning','active','completed','cancelled'].map(s => {
            const count = trips.filter(t => t.status === s).length;
            if (!count) return null;
            return (
              <button key={s}
                className={`tss-pill ${status===s?'active':''}`}
                style={status===s ? {background:STATUS_COLORS[s],borderColor:STATUS_COLORS[s],color:'white'} : {background:STATUS_BG[s],borderColor:'transparent',color:STATUS_COLORS[s]}}
                onClick={() => handleStatusFilter(status===s?'all':s)}>
                {STATUS_ICONS[s]} {s.charAt(0).toUpperCase()+s.slice(1)} <span className="tss-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="trips-toolbar fade-in">
        <div className="search-wrap">
          <Search size={16} className="search-icon"/>
          <input className="search-input" placeholder="Search trips by name or destination..." value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button className="search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
        </div>
        <div className="status-filters">
          {STATUS_OPTS.map(s => (
            <button key={s}
              className={`filter-btn ${status===s?'active':''}`}
              style={status===s&&s!=='all' ? {background:STATUS_COLORS[s],borderColor:STATUS_COLORS[s],color:'white'} : {}}
              onClick={() => handleStatusFilter(s)}>
              {s!=='all'&&<span>{STATUS_ICONS[s]}</span>}
              {s.charAt(0).toUpperCase()+s.slice(1)}
              <span className="filter-count">{s==='all'?trips.length:trips.filter(t=>t.status===s).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TRIPS GRID */}
      {filtered.length === 0 ? (
        <div className="empty-state fade-in">
          <div className="empty-icon"><Globe size={48}/></div>
          <h3>{search||status!=='all' ? 'No trips match your filters' : 'No trips yet'}</h3>
          <p>{search||status!=='all' ? 'Try a different search or filter' : 'Start planning your first adventure!'}</p>
          {(search||status!=='all')
            ? <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');handleStatusFilter('all');}}>Clear filters</button>
            : <Link to="/trips/new" className="btn btn-primary"><Plus size={16}/> Create Trip</Link>}
        </div>
      ) : (
        <div className="trips-list-grid fade-in">
          {filtered.map(t => (
            <TripCard
              key={t._id} trip={t}
              onDelete={(id,title) => setDeleteConfirm({id,title})}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="trips-modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="trips-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="tdm-icon-wrap">
              <AlertTriangle size={28} color="white"/>
            </div>
            <h3>Delete this trip?</h3>
            <p>
              <strong>"{deleteConfirm.title}"</strong> and all its data — expenses, plans, hotels, photos — will be permanently deleted. This cannot be undone.
            </p>
            <div className="tdm-btn-row">
              <button className="tdm-cancel" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="tdm-confirm-delete" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={15}/>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip: t, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const days = t.startDate && t.endDate ? Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / 86400000) : 0;

  useEffect(() => {
    const h = e => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const otherStatuses = ['planning','active','completed','cancelled'].filter(s => s !== t.status);

  return (
    <Link to={`/trips/${t._id}`} className={`trip-list-card ${t.status==='completed'?'tlc-done':''}`}>
      {/* COVER IMAGE */}
      <div className="tlc-img" style={t.coverImage ? {backgroundImage:`url(${t.coverImage})`,backgroundSize:'cover',backgroundPosition:'center'} : {}}>
        <div className="tlc-overlay"/>
        <span className="tlc-status-badge" style={{background:STATUS_COLORS[t.status]||'#64748b', color:'white'}}>
          {STATUS_ICONS[t.status]} {t.status}
        </span>
        {t.status === 'completed' && <div className="tlc-done-stamp">✅ Completed</div>}
        <div className="tlc-bottom">
          <h3>{t.title}</h3>
          <div className="tlc-dest"><MapPin size={11}/> {t.destination}{t.country?`, ${t.country}`:''}</div>
        </div>
      </div>

      {/* BODY */}
      <div className="tlc-body">
        <div className="tlc-row">
          <Calendar size={13}/>
          {t.startDate && t.endDate ? (
            <>{format(new Date(t.startDate),'MMM d')} – {format(new Date(t.endDate),'MMM d, yyyy')}<span className="tlc-days">{days}d</span></>
          ) : <span style={{color:'var(--text-muted)'}}>No dates set</span>}
        </div>
        {t.totalBudget > 0 && (
          <div className="tlc-row"><DollarSign size={13}/> ${t.totalBudget.toLocaleString()} {t.currency}</div>
        )}
        {t.tags?.length > 0 && (
          <div className="tlc-tags">{t.tags.slice(0,3).map(tag => <span key={tag}>#{tag}</span>)}</div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="tlc-actions-row" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
        <Link to={`/trips/${t._id}`} className="tlc-quick-btn view-btn" onClick={e => e.stopPropagation()}>
          <Eye size={13}/> View
        </Link>

        {t.status !== 'completed' ? (
          <button className="tlc-quick-btn complete-btn" onClick={e => onStatusChange(t._id, 'completed', e)}>
            <CheckCircle2 size={13}/> Complete
          </button>
        ) : (
          <button className="tlc-quick-btn reopen-btn" onClick={e => onStatusChange(t._id, 'planning', e)}>
            <Clock size={13}/> Reopen
          </button>
        )}

        <button className="tlc-quick-btn delete-quick-btn"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(t._id, t.title); }}>
          <Trash2 size={13}/> Delete
        </button>

        {/* More menu */}
        <div className="tlc-menu-wrap" ref={menuRef} style={{marginLeft:'auto'}}>
          <button className="tlc-quick-btn more-btn"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(m => !m); }}>
            <MoreVertical size={14}/>
          </button>
          {menuOpen && (
            <div className="tlc-dropdown">
              <div className="tld-section">Change Status</div>
              {otherStatuses.map(s => (
                <button key={s} className="tld-item" style={{color:STATUS_COLORS[s]}}
                  onClick={e => { setMenuOpen(false); onStatusChange(t._id, s, e); }}>
                  {STATUS_ICONS[s]} Mark as {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
              <div className="tld-divider"/>
              <button className="tld-item tld-delete"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onDelete(t._id, t.title); }}>
                <Trash2 size={12}/> Delete Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
