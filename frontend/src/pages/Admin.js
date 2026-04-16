import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Users, Map, DollarSign, TrendingUp, Search, Trash2,
  Shield, Crown, UserCheck, X, RefreshCw, Eye,
  Activity, ChevronRight, AlertTriangle, Check,
  BarChart2, Loader, ArrowLeft, Mail, Calendar,
  Package, Hotel, Camera, FileText, Car, MapPin,
  CheckCircle2, Circle, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import './Admin.css';

const SC = { planning:'#3B82F6', active:'#22c55e', completed:'#8B5CF6', cancelled:'#EF4444' };
const CAT_EMOJI = { accommodation:'🏨', transport:'🚗', food:'🍽️', activities:'🎯', shopping:'🛍️', health:'💊', visa:'📄', other:'💸' };
const fmt$ = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n||0)}`;

export default function Admin() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [trips, setTrips]     = useState([]);
  const [feed, setFeed]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch]   = useState('');
  const [userRole, setUserRole]       = useState('all');
  const [tripSearch, setTripSearch]   = useState('');
  const [tripStatus, setTripStatus]   = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activityUser, setActivityUser]   = useState(null); // user detail drawer
  const [activityData, setActivityData]   = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTab, setActivityTab] = useState('trips');

  // Guard: admins only
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => { loadStats(); loadFeed(); }, []);
  useEffect(() => { if (tab === 'users')    loadUsers();  }, [tab, userSearch, userRole]);
  useEffect(() => { if (tab === 'trips')    loadTrips();  }, [tab, tripSearch, tripStatus]);
  useEffect(() => { if (tab === 'activity') loadFeed();   }, [tab]);

  const loadStats = async () => {
    try { const r = await adminAPI.getStats(); setStats(r.data.stats); }
    catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };
  const loadUsers = async () => {
    try { const r = await adminAPI.getUsers({ search:userSearch, role:userRole }); setUsers(r.data.users); }
    catch { toast.error('Failed to load users'); }
  };
  const loadTrips = async () => {
    try { const r = await adminAPI.getTrips({ search:tripSearch, status:tripStatus }); setTrips(r.data.trips); }
    catch { toast.error('Failed to load trips'); }
  };
  const loadFeed = async () => {
    try { const r = await adminAPI.getActivity({ limit:100 }); setFeed(r.data.feed); }
    catch {}
  };
  const openActivity = async (u) => {
    setActivityUser(u); setActivityData(null); setActivityLoading(true); setActivityTab('trips');
    try { const r = await adminAPI.getUserActivity(u._id); setActivityData(r.data); }
    catch { toast.error('Failed to load activity'); }
    finally { setActivityLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete || confirmDelete.type !== 'user') return;
    try {
      await adminAPI.deleteUser(confirmDelete.id);
      setUsers(u => u.filter(x => x._id !== confirmDelete.id));
      toast.success(`User "${confirmDelete.name}" deleted`);
      if (activityUser?._id === confirmDelete.id) setActivityUser(null);
    } catch { toast.error('Delete failed'); }
    finally { setConfirmDelete(null); }
  };
  const handleDeleteTrip = async () => {
    if (!confirmDelete || confirmDelete.type !== 'trip') return;
    try {
      await adminAPI.deleteTrip(confirmDelete.id);
      setTrips(t => t.filter(x => x._id !== confirmDelete.id));
      toast.success(`Trip deleted`);
    } catch { toast.error('Delete failed'); }
    finally { setConfirmDelete(null); }
  };
  const handleRoleChange = async (uid, role) => {
    try {
      await adminAPI.updateRole(uid, role);
      setUsers(u => u.map(x => x._id === uid ? { ...x, role } : x));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const initials = u => u?.name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';

  if (loading) return (
    <div className="admin-loading">
      <Loader size={36} className="spin"/>
      <p>Loading admin panel…</p>
    </div>
  );

  const TABS = [
    { id:'overview', label:'Overview',      icon:<BarChart2 size={16}/> },
    { id:'activity', label:'Activity Feed', icon:<Activity size={16}/> },
    { id:'users',    label:'Users',         icon:<Users size={16}/> },
    { id:'trips',    label:'Trips',         icon:<Map size={16}/> },
  ];

  return (
    <div className="admin-root">
      {/* ── HEADER ── */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-crown"><Crown size={22}/></div>
          <div>
            <h1>Admin Panel</h1>
            <p>Full platform visibility &amp; control</p>
          </div>
        </div>
        <Link to="/dashboard" className="admin-back-btn">
          <ArrowLeft size={15}/> Dashboard
        </Link>
      </div>

      {/* ── TABS ── */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="admin-body">

        {/* ═══════ OVERVIEW ═══════ */}
        {tab === 'overview' && stats && (
          <div className="admin-overview">
            {/* Stat cards */}
            <div className="admin-stat-row">
              {[
                { label:'Total Users',    val:stats.users,                  icon:<Users size={20}/>,     color:'ocean'  },
                { label:'Total Trips',    val:stats.trips,                  icon:<Map size={20}/>,       color:'coral'  },
                { label:'Total Plans',    val:stats.plans||0,               icon:<FileText size={20}/>,  color:'sage'   },
                { label:'Total Spent',    val:fmt$(stats.totalSpent),       icon:<DollarSign size={20}/>,color:'gold'   },
              ].map(s => (
                <div key={s.label} className={`admin-stat-card asc-${s.color}`}>
                  <div className="asc-icon">{s.icon}</div>
                  <div className="asc-val">{s.val}</div>
                  <div className="asc-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="admin-overview-grid">
              {/* Trip status breakdown */}
              <div className="admin-card">
                <h3 className="admin-card-title"><BarChart2 size={15}/> Trips by Status</h3>
                {stats.tripsByStatus?.map(s => (
                  <div key={s._id} className="ao-status-row">
                    <span className="ao-status-dot" style={{background:SC[s._id]||'#94a3b8'}}/>
                    <span className="ao-status-label">{s._id}</span>
                    <div className="ao-status-bar-bg">
                      <div className="ao-status-bar" style={{width:`${stats.trips?Math.round((s.count/stats.trips)*100):0}%`,background:SC[s._id]||'#94a3b8'}}/>
                    </div>
                    <span className="ao-status-count">{s.count}</span>
                  </div>
                ))}
              </div>

              {/* Expense by category */}
              <div className="admin-card">
                <h3 className="admin-card-title"><DollarSign size={15}/> Spending by Category</h3>
                {stats.expByCategory?.sort((a,b)=>b.total-a.total).map((c,i) => (
                  <div key={c._id} className="ao-status-row">
                    <span>{CAT_EMOJI[c._id]||'💸'}</span>
                    <span className="ao-status-label" style={{textTransform:'capitalize'}}>{c._id}</span>
                    <div className="ao-status-bar-bg">
                      <div className="ao-status-bar" style={{width:`${stats.totalSpent?Math.round((c.total/stats.totalSpent)*100):0}%`,background:`hsl(${i*37},60%,48%)`}}/>
                    </div>
                    <span className="ao-status-count">{fmt$(c.total)}</span>
                  </div>
                ))}
              </div>

              {/* Recent users */}
              <div className="admin-card">
                <h3 className="admin-card-title"><Users size={15}/> Recent Users</h3>
                {stats.recentUsers?.map(u => (
                  <div key={u._id} className="ao-user-row" onClick={()=>{setTab('users');openActivity(u);}}>
                    <div className="ao-avatar">{initials(u)}</div>
                    <div className="ao-user-info">
                      <span className="ao-user-name">{u.name}</span>
                      <span className="ao-user-email">{u.email}</span>
                    </div>
                    <span className={`ao-role-badge ${u.role}`}>{u.role}</span>
                  </div>
                ))}
              </div>

              {/* Recent trips */}
              <div className="admin-card">
                <h3 className="admin-card-title"><Map size={15}/> Recent Trips</h3>
                {stats.recentTrips?.map(t => (
                  <div key={t._id} className="ao-trip-row">
                    <div className="ao-trip-dot" style={{background:SC[t.status]||'#94a3b8'}}/>
                    <div className="ao-trip-info">
                      <span className="ao-trip-title">{t.title}</span>
                      <span className="ao-trip-sub">{t.user?.name} · {t.destination}</span>
                    </div>
                    <span className="ao-trip-status" style={{color:SC[t.status]}}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ACTIVITY FEED ═══════ */}
        {tab === 'activity' && (
          <div className="admin-activity-feed">
            <div className="af-header">
              <h2>Live Activity Feed</h2>
              <p>All recent actions across all users</p>
              <button className="af-refresh" onClick={loadFeed}><RefreshCw size={14}/> Refresh</button>
            </div>
            <div className="af-list">
              {feed.length === 0 && <div className="af-empty">No activity yet</div>}
              {feed.map((item, i) => (
                <div key={i} className="af-item">
                  <div className="af-icon" style={{background:item.color+'18',color:item.color}}>
                    {item.icon}
                  </div>
                  <div className="af-content">
                    <div className="af-main">
                      <span className="af-user">{item.user?.name||'Unknown'}</span>
                      <span className="af-action"> {item.action} </span>
                      <span className="af-label">"{item.label}"</span>
                    </div>
                    <div className="af-meta">
                      <span className="af-sub">{item.sub}</span>
                      <span className="af-date">{item.date ? format(new Date(item.date),'MMM d, h:mm a') : ''}</span>
                    </div>
                  </div>
                  <div className="af-user-pill">
                    <div className="af-up-av">{initials(item.user||{})}</div>
                    <span>{item.user?.email||''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ USERS ═══════ */}
        {tab === 'users' && (
          <div className="admin-users-layout">
            <div className={`admin-users-panel ${activityUser ? 'with-drawer' : ''}`}>
              {/* Toolbar */}
              <div className="admin-toolbar">
                <div className="at-search-wrap">
                  <Search size={15}/>
                  <input placeholder="Search name or email…" value={userSearch}
                    onChange={e=>setUserSearch(e.target.value)}/>
                  {userSearch && <button onClick={()=>setUserSearch('')}><X size={13}/></button>}
                </div>
                <select className="at-filter" value={userRole} onChange={e=>setUserRole(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <span className="at-count">{users.length} user{users.length!==1?'s':''}</span>
              </div>

              {/* User cards */}
              <div className="user-cards">
                {users.map(u => (
                  <div key={u._id} className={`user-card ${activityUser?._id===u._id?'active':''}`}>
                    <div className="uc-top">
                      <div className="uc-avatar" style={{background: u.role==='admin'?'#F5A623':'#0A4D6E'}}>
                        {initials(u)}
                        {u.role==='admin' && <Crown size={8} className="uc-crown"/>}
                      </div>
                      <div className="uc-info">
                        <div className="uc-name">{u.name}</div>
                        <div className="uc-email"><Mail size={10}/> {u.email}</div>
                        <div className="uc-joined"><Calendar size={10}/> Joined {format(new Date(u.createdAt),'MMM d, yyyy')}</div>
                      </div>
                      <div className="uc-actions">
                        <button className="uca-view" onClick={()=>openActivity(u)} title="View activity">
                          <Eye size={14}/> Activity
                        </button>
                        {u._id !== user?._id && (
                          <button className="uca-delete" onClick={()=>setConfirmDelete({type:'user',id:u._id,name:u.name})}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="uc-stats">
                      <div className="ucs-item"><Map size={11}/> {u.tripCount} trips</div>
                      <div className="ucs-item"><DollarSign size={11}/> {fmt$(u.expenseTotal)} spent</div>
                      <div className="ucs-item"><FileText size={11}/> {u.planCount} plans</div>
                      <div className="ucs-item ucs-role">
                        <select value={u.role} onChange={e=>handleRoleChange(u._id,e.target.value)}
                          disabled={u._id===user?._id}
                          style={{color:u.role==='admin'?'#F5A623':'#0A4D6E'}}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Drawer */}
            {activityUser && (
              <div className="activity-drawer">
                <div className="ad-header">
                  <div className="ad-user">
                    <div className="ad-avatar">{initials(activityUser)}</div>
                    <div>
                      <div className="ad-name">{activityUser.name}</div>
                      <div className="ad-email">{activityUser.email}</div>
                    </div>
                  </div>
                  <button className="ad-close" onClick={()=>setActivityUser(null)}><X size={18}/></button>
                </div>

                {activityLoading && <div className="ad-loading"><Loader size={24} className="spin"/></div>}

                {activityData && (
                  <>
                    {/* Summary stats */}
                    <div className="ad-stats">
                      {[
                        { label:'Trips',    val:activityData.trips?.length||0,    icon:<Map size={13}/> },
                        { label:'Expenses', val:activityData.expenses?.length||0, icon:<DollarSign size={13}/> },
                        { label:'Spent',    val:fmt$(activityData.totalSpent),     icon:<TrendingUp size={13}/> },
                        { label:'Plans',    val:activityData.plans?.length||0,    icon:<FileText size={13}/> },
                        { label:'Hotels',   val:activityData.hotels?.length||0,   icon:<Hotel size={13}/> },
                        { label:'Photos',   val:activityData.photos?.length||0,   icon:<Camera size={13}/> },
                      ].map(s => (
                        <div key={s.label} className="ads-item">
                          {s.icon}
                          <span className="ads-val">{s.val}</span>
                          <span className="ads-label">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Activity sub-tabs */}
                    <div className="ad-tabs">
                      {['trips','expenses','plans','hotels','packing','photos'].map(t => (
                        <button key={t} className={`adt-btn ${activityTab===t?'active':''}`}
                          onClick={()=>setActivityTab(t)}>
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Trips */}
                    {activityTab === 'trips' && (
                      <div className="ad-list">
                        {activityData.trips?.length===0 && <p className="ad-empty">No trips yet</p>}
                        {activityData.trips?.map(t => (
                          <div key={t._id} className="ad-trip-row">
                            <div className="adtr-dot" style={{background:SC[t.status]||'#94a3b8'}}/>
                            <div className="adtr-info">
                              <span className="adtr-title">{t.title}</span>
                              <span className="adtr-meta">
                                <MapPin size={10}/> {t.destination}
                                {t.startDate && <> · <Calendar size={10}/> {format(new Date(t.startDate),'MMM d, yyyy')}</>}
                              </span>
                            </div>
                            <div className="adtr-right">
                              <span className="adtr-status" style={{color:SC[t.status]}}>{t.status}</span>
                              {t.totalBudget>0 && <span className="adtr-budget">{fmt$(t.totalBudget)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expenses */}
                    {activityTab === 'expenses' && (
                      <div className="ad-list">
                        {activityData.expenses?.length===0 && <p className="ad-empty">No expenses yet</p>}
                        {/* Total */}
                        {activityData.expenses?.length>0 && (
                          <div className="ad-exp-total">
                            Total: <strong>{fmt$(activityData.totalSpent)}</strong>
                            &nbsp;across {activityData.expenses.length} expenses
                          </div>
                        )}
                        {activityData.expenses?.map(e => (
                          <div key={e._id} className="ad-exp-row">
                            <span className="ade-cat">{CAT_EMOJI[e.category]||'💸'}</span>
                            <div className="ade-info">
                              <span className="ade-title">{e.title}</span>
                              <span className="ade-meta">{e.category} · {e.date?format(new Date(e.date),'MMM d, yyyy'):''}</span>
                            </div>
                            <span className="ade-amt">${e.amount?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Plans */}
                    {activityTab === 'plans' && (
                      <div className="ad-list">
                        {activityData.plans?.length===0 && <p className="ad-empty">No plans yet</p>}
                        {activityData.plans?.map(p => (
                          <div key={p._id} className="ad-plan-row">
                            {p.status==='completed'
                              ? <CheckCircle2 size={16} color="#8B5CF6"/>
                              : <Circle size={16} color="#94a3b8"/>}
                            <div className="adp-info">
                              <span className="adp-title" style={{textDecoration:p.status==='completed'?'line-through':''}}>{p.title}</span>
                              <span className="adp-meta">{p.category} · {p.priority} priority</span>
                            </div>
                            <span className="adp-status" style={{color:p.status==='completed'?'#8B5CF6':'#22c55e'}}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hotels */}
                    {activityTab === 'hotels' && (
                      <div className="ad-list">
                        {activityData.hotels?.length===0 && <p className="ad-empty">No hotel bookings yet</p>}
                        {activityData.hotels?.map(h => (
                          <div key={h._id} className="ad-hotel-row">
                            <span>🏨</span>
                            <div className="adh-info">
                              <span className="adh-name">{h.hotelName||'Hotel'}</span>
                              <span className="adh-meta">
                                {h.checkIn?format(new Date(h.checkIn),'MMM d'):''} – {h.checkOut?format(new Date(h.checkOut),'MMM d, yyyy'):''}
                                {h.totalCost>0 && `  -  $${h.totalCost}`}
                              </span>
                            </div>
                            <span className={`adh-status ${h.status||'pending'}`}>{h.status||'pending'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Packing */}
                    {activityTab === 'packing' && (
                      <div className="ad-list">
                        {activityData.packing?.length===0 && <p className="ad-empty">No packing items yet</p>}
                        <div className="adpk-stats">
                          <span>{activityData.packing?.filter(p=>p.packed).length}/{activityData.packing?.length} packed</span>
                        </div>
                        {activityData.packing?.map(p => (
                          <div key={p._id} className="ad-pack-row">
                            {p.packed ? <CheckCircle2 size={14} color="#22c55e"/> : <Circle size={14} color="#94a3b8"/>}
                            <span className="adpk-name" style={{textDecoration:p.packed?'line-through':''}}>{p.name}</span>
                            <span className="adpk-cat">{p.category}</span>
                            <span className="adpk-qty">×{p.quantity||1}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Photos */}
                    {activityTab === 'photos' && (
                      <div className="ad-list">
                        {activityData.photos?.length===0 && <p className="ad-empty">No photos yet</p>}
                        <div className="ad-photo-grid">
                          {activityData.photos?.map(p => (
                            <div key={p._id} className="ad-photo-thumb">
                              <img src={p.url} alt={p.caption||'photo'} loading="lazy"/>
                              {p.caption && <span className="adph-cap">{p.caption}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════ TRIPS ═══════ */}
        {tab === 'trips' && (
          <div className="admin-trips-section">
            <div className="admin-toolbar">
              <div className="at-search-wrap">
                <Search size={15}/>
                <input placeholder="Search title or destination…" value={tripSearch}
                  onChange={e=>setTripSearch(e.target.value)}/>
                {tripSearch && <button onClick={()=>setTripSearch('')}><X size={13}/></button>}
              </div>
              <select className="at-filter" value={tripStatus} onChange={e=>setTripStatus(e.target.value)}>
                <option value="all">All Status</option>
                {['planning','active','completed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <span className="at-count">{trips.length} trip{trips.length!==1?'s':''}</span>
            </div>

            <div className="trips-table">
              <div className="tt-head">
                <span>Trip</span><span>User</span><span>Destination</span>
                <span>Status</span><span>Budget</span><span>Spent</span><span>Plans</span><span></span>
              </div>
              {trips.map(t => (
                <div key={t._id} className="tt-row">
                  <span className="tt-title">{t.title}</span>
                  <span className="tt-user">
                    <div className="tt-uav">{initials(t.user||{})}</div>
                    {t.user?.name}
                  </span>
                  <span className="tt-dest"><MapPin size={11}/> {t.destination}</span>
                  <span className="tt-status" style={{color:SC[t.status]}}>{t.status}</span>
                  <span>{t.totalBudget>0?fmt$(t.totalBudget):'-'}</span>
                  <span>{t.expenseCount>0?fmt$(t.totalSpent):'-'}</span>
                  <span>{t.planCount||0}</span>
                  <span>
                    <button className="tt-del" onClick={()=>setConfirmDelete({type:'trip',id:t._id,name:t.title})}>
                      <Trash2 size={13}/>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={()=>setConfirmDelete(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="am-icon"><AlertTriangle size={28} color="white"/></div>
            <h3>Delete {confirmDelete.type}?</h3>
            <p>
              {confirmDelete.type==='user'
                ? `"${confirmDelete.name}" and ALL their trips, expenses, and plans will be permanently deleted.`
                : `"${confirmDelete.name}" and all its expenses and plans will be permanently deleted.`}
            </p>
            <div className="am-actions">
              <button className="am-cancel" onClick={()=>setConfirmDelete(null)}>Cancel</button>
              <button className="am-delete"
                onClick={confirmDelete.type==='user' ? handleDeleteUser : handleDeleteTrip}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
