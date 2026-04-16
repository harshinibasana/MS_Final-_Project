import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Map, Plus, User, LogOut,
  Compass, Menu, X, Globe, ChevronUp,
  Crown, BarChart2, Heart
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path:'/dashboard',   icon:LayoutDashboard, label:'Dashboard'   },
  { path:'/trips',       icon:Map,             label:'My Trips'    },
  { path:'/explore',     icon:Compass,         label:'Explore'     },
  { path:'/stats',       icon:BarChart2,        label:'Travel Stats'},
  { path:'/bucket-list', icon:Heart,            label:'Bucket List' },
  { path:'/trips/new',   icon:Plus,            label:'New Trip', highlight:true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const h = e => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { setProfileOpen(false); logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
  const isAdmin  = user?.role === 'admin';

  return (
    <div className={`sidebar ${collapsed?'collapsed':''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Globe size={22} className="logo-icon"/>
          {!collapsed && <span className="logo-text">Travelify</span>}
        </div>
        <button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}>
          {collapsed?<Menu size={17}/>:<X size={17}/>}
        </button>
      </div>

      <nav className="nav-items">
        {navItems.map(({ path, icon:Icon, label, highlight }) => (
          <NavLink key={path} to={path}
            className={({ isActive }) => `nav-item ${isActive?'active':''} ${highlight?'highlight':''}`}
            title={collapsed?label:''}>
            <Icon size={19}/>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) => `nav-item admin-link ${isActive?'active':''}`}
            title={collapsed?'Admin Panel':''}>
            <Crown size={19}/>
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer" ref={profileRef}>
        <div className={`profile-trigger ${profileOpen?'open':''}`}
          onClick={()=>setProfileOpen(!profileOpen)}>
          <div className="profile-avatar">{initials}</div>
          {!collapsed && (
            <>
              <div className="profile-text">
                <div className="profile-name-sm">{user?.name}</div>
                <div className="profile-email-sm">{user?.email}</div>
              </div>
              <ChevronUp size={15} className="profile-chevron"
                style={{ transform:profileOpen?'rotate(180deg)':'rotate(0deg)' }}/>
            </>
          )}
        </div>

        {profileOpen && (
          <div className={`profile-dropdown ${collapsed?'collapsed-pos':''}`}>
            <div className="pd-user-header">
              <div className="pd-avatar-lg">{initials}</div>
              <div>
                <div className="pd-name">{user?.name}</div>
                <div className="pd-email">{user?.email}</div>
                {isAdmin && <div className="pd-admin-badge"><Crown size={9}/> Admin</div>}
              </div>
            </div>
            <div className="pd-divider"/>
            <button className="pd-item" onClick={()=>{setProfileOpen(false);navigate('/profile');}}>
              <div className="pd-item-icon" style={{background:'#EBF8FF',color:'#0A4D6E'}}><User size={15}/></div>
              <div className="pd-item-text"><div className="pd-item-label">My Profile</div><div className="pd-item-sub">Edit name & preferences</div></div>
            </button>
            <button className="pd-item" onClick={()=>{setProfileOpen(false);navigate('/stats');}}>
              <div className="pd-item-icon" style={{background:'#F0FFF4',color:'#6B8F71'}}><BarChart2 size={15}/></div>
              <div className="pd-item-text"><div className="pd-item-label">Travel Stats</div><div className="pd-item-sub">Your insights & analytics</div></div>
            </button>
            <button className="pd-item" onClick={()=>{setProfileOpen(false);navigate('/bucket-list');}}>
              <div className="pd-item-icon" style={{background:'#FFF5F5',color:'#E8614D'}}><Heart size={15}/></div>
              <div className="pd-item-text"><div className="pd-item-label">Bucket List</div><div className="pd-item-sub">Dream destinations</div></div>
            </button>
            {isAdmin && (
              <>
                <div className="pd-divider"/>
                <button className="pd-item" onClick={()=>{setProfileOpen(false);navigate('/admin');}}>
                  <div className="pd-item-icon" style={{background:'rgba(245,166,35,0.12)',color:'#b45309'}}><Crown size={15}/></div>
                  <div className="pd-item-text"><div className="pd-item-label" style={{color:'#b45309'}}>Admin Panel</div><div className="pd-item-sub">Manage users & platform</div></div>
                </button>
              </>
            )}
            <div className="pd-divider"/>
            <button className="pd-item logout-item" onClick={handleLogout}>
              <div className="pd-item-icon" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}><LogOut size={15}/></div>
              <div className="pd-item-text"><div className="pd-item-label">Sign Out</div><div className="pd-item-sub">Log out of your account</div></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
