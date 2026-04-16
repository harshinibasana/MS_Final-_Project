import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, tripsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Save, LogOut, Shield, Globe, MapPin,
  TrendingUp, CheckCircle, Clock, DollarSign,
  Key, Eye, EyeOff, Loader, Pencil, X
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name||'', avatar: user?.avatar||'' });
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' });
  const [showPw, setShowPw] = useState({ current:false, next:false, confirm:false });
  const [changingPw, setChangingPw] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    tripsAPI.getAll().then(res => setTrips(res.data.trips||[])).catch(()=>{});
  }, []);

  const stats = {
    total: trips.length,
    upcoming: trips.filter(t=>t.status==='planning'||t.status==='active').length,
    completed: trips.filter(t=>t.status==='completed').length,
    budget: trips.reduce((s,t)=>s+(t.totalBudget||0),0),
    countries: [...new Set(trips.map(t=>t.country).filter(Boolean))].length,
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.next.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPw(true);
    try {
      await authAPI.updateProfile({ password: pwForm.next, currentPassword: pwForm.current });
      setPwForm({ current:'', next:'', confirm:'' });
      toast.success('Password changed!');
    } catch { toast.error('Current password is incorrect'); }
    finally { setChangingPw(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'})
    : 'Recently';

  return (
    <div className="page-container profile-root">

      {/* ═══ HERO CARD ═══ */}
      <div className="profile-hero fade-in">
        <div className="profile-banner"/>
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-big">{initials}</div>
          </div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <div className="profile-email"><Mail size={13}/> {user?.email}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
              <span className="profile-role"><Shield size={11}/> {user?.role||'user'}</span>
              <span className="profile-role" style={{background:'rgba(107,143,113,0.1)',color:'var(--sage)'}}><Clock size={11}/> Member since {memberSince}</span>
              {stats.countries > 0 && <span className="profile-role" style={{background:'rgba(245,166,35,0.1)',color:'#B45309'}}><Globe size={11}/> {stats.countries} {stats.countries===1?'country':'countries'} visited</span>}
            </div>
          </div>
          <div style={{marginLeft:'auto',paddingTop:16,display:'flex',gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowLogoutModal(true)}>
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="profile-stats-strip">
          {[
            {num:stats.total, label:'Total Trips', icon:<Globe size={14} color="var(--ocean)"/>},
            {num:stats.upcoming, label:'Upcoming', icon:<Clock size={14} color="var(--coral)"/>},
            {num:stats.completed, label:'Completed', icon:<CheckCircle size={14} color="var(--sage)"/>},
            {num:`$${stats.budget>=1000?(stats.budget/1000).toFixed(1)+'K':stats.budget.toLocaleString()}`, label:'Total Budget', icon:<DollarSign size={14} color="#B45309"/>},
            {num:stats.countries||0, label:'Countries', icon:<MapPin size={14} color="#7C3AED"/>},
          ].map(({num,label,icon},i) => (
            <div key={i} className="pss-item">
              <div className="pss-num">{num}</div>
              <div className="pss-label" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>{icon} {label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="profile-tabs fade-in">
        <button className={`ptab ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}>
          <User size={14}/> Profile Info
        </button>
        <button className={`ptab ${activeTab==='security'?'active':''}`} onClick={()=>setActiveTab('security')}>
          <Shield size={14}/> Security
        </button>
      </div>

      {/* ═══ PROFILE TAB ═══ */}
      {activeTab==='profile' && (
        <div className="fade-in">
          <div className="profile-section">
            <div className="ps-header">
              <div className="ps-header-left">
                <div className="ps-header-icon" style={{background:'rgba(10,77,110,0.08)',color:'var(--ocean)'}}><User size={17}/></div>
                <div>
                  <h3>Personal Information</h3>
                  <p>Update your name and display preferences</p>
                </div>
              </div>
              {!editing
                ? <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(true)}><Pencil size={13}/> Edit</button>
                : <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(false);setForm({name:user?.name||'',avatar:user?.avatar||''});}}><X size={13}/> Cancel</button>
              }
            </div>

            <div className="ps-body">
              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="profile-field-row profile-field">
                    <div>
                      <div className="pf-label"><User size={11}/> Full Name</div>
                      <input className="pf-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name" required/>
                    </div>
                    <div>
                      <div className="pf-label"><Mail size={11}/> Email</div>
                      <div className="pf-value" style={{color:'var(--text-muted)'}}>{user?.email}</div>
                    </div>
                  </div>
                  <div className="profile-field">
                    <div className="pf-label">Avatar URL <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></div>
                    <input className="pf-input" value={form.avatar} onChange={e=>setForm({...form,avatar:e.target.value})} placeholder="https://...your-photo-url"/>
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving?<><Loader size={14} className="spin"/> Saving...</>:<><Save size={14}/> Save Changes</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-field-row">
                  <div>
                    <div className="pf-label"><User size={11}/> Full Name</div>
                    <div className="pf-value">{user?.name}</div>
                  </div>
                  <div>
                    <div className="pf-label"><Mail size={11}/> Email</div>
                    <div className="pf-value">{user?.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {activeTab==='security' && (
        <div className="fade-in">
          <div className="profile-section">
            <div className="ps-header">
              <div className="ps-header-left">
                <div className="ps-header-icon" style={{background:'rgba(107,143,113,0.1)',color:'var(--sage)'}}><Key size={17}/></div>
                <div>
                  <h3>Change Password</h3>
                  <p>Keep your account secure with a strong password</p>
                </div>
              </div>
            </div>
            <div className="ps-body">
              <form onSubmit={handleChangePw}>
                <div className="profile-field">
                  <div className="pf-label">Current Password</div>
                  <div className="pw-group">
                    <input type={showPw.current?'text':'password'} className="pf-input with-toggle" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})} placeholder="Enter current password" required/>
                    <button type="button" className="pw-toggle" onClick={()=>setShowPw(s=>({...s,current:!s.current}))}>
                      {showPw.current?<EyeOff size={15}/>:<Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div className="profile-field-row profile-field">
                  <div>
                    <div className="pf-label">New Password</div>
                    <div className="pw-group">
                      <input type={showPw.next?'text':'password'} className="pf-input with-toggle" value={pwForm.next} onChange={e=>setPwForm({...pwForm,next:e.target.value})} placeholder="Min. 6 characters" required/>
                      <button type="button" className="pw-toggle" onClick={()=>setShowPw(s=>({...s,next:!s.next}))}>
                        {showPw.next?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="pf-label">Confirm New Password</div>
                    <div className="pw-group">
                      <input type={showPw.confirm?'text':'password'} className="pf-input with-toggle" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} placeholder="Repeat new password" required/>
                      <button type="button" className="pw-toggle" onClick={()=>setShowPw(s=>({...s,confirm:!s.confirm}))}>
                        {showPw.confirm?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                  <button type="submit" className="btn btn-primary" disabled={changingPw}>
                    {changingPw?<><Loader size={14} className="spin"/> Updating...</>:<><Key size={14}/> Update Password</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danger zone */}
          <div className="profile-danger">
            <div className="pd-header"><h3>⚠️ Danger Zone</h3></div>
            <div className="pd-body">
              <p>Once you sign out, you'll need your credentials to log back in. Make sure you remember your password.</p>
              <button className="btn btn-danger" onClick={()=>setShowLogoutModal(true)}>
                <LogOut size={15}/> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LOGOUT MODAL ═══ */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={()=>setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e=>e.stopPropagation()}>
            <div className="lm-icon"><LogOut size={26} color="#EF4444"/></div>
            <h3>Sign out?</h3>
            <p>You'll be signed out of your Travelify account and redirected to the login page.</p>
            <div className="lm-actions">
              <button className="lm-btn-cancel" onClick={()=>setShowLogoutModal(false)}>Stay signed in</button>
              <button className="lm-btn-logout" onClick={handleLogout}><LogOut size={15}/> Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
