import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tripsAPI, expensesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  MapPin, Calendar, Plus, Globe, Map, CheckCircle,
  DollarSign, TrendingUp, Plane, ArrowRight, BarChart2,
  Compass, CreditCard, PieChart, Activity, Clock, Star
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Dashboard.css';

const PIE_COLORS = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const CAT_ICONS = { accommodation:'🏨', transport:'✈️', food:'🍜', activities:'🎭', shopping:'🛍️', health:'💊', visa:'📄', other:'💼' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    tripsAPI.getAll().then(res => {
      const t = res.data.trips || [];
      setTrips(t);
      // Load expenses for all trips to build global budget chart
      return Promise.all(t.map(trip => expensesAPI.getByTrip(trip._id).then(r => r.data.expenses || []).catch(() => [])));
    }).then(expArrays => {
      setAllExpenses(expArrays.flat());
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: trips.length,
    upcoming: trips.filter(t => t.status === 'planning' || t.status === 'active').length,
    completed: trips.filter(t => t.status === 'completed').length,
    budget: trips.reduce((s, t) => s + (t.totalBudget || 0), 0),
  };

  const totalSpent = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budgetRemaining = stats.budget - totalSpent;

  // Expense breakdown by category
  const catData = ['accommodation','transport','food','activities','shopping','health','visa','other'].map((cat, i) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: allExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    icon: CAT_ICONS[cat],
    color: PIE_COLORS[i],
  })).filter(d => d.value > 0);

  // Filter trips by clicking stat cards
  const displayTrips = activeFilter
    ? trips.filter(t => t.status === activeFilter)
    : [...trips].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  const handleStatClick = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter);
    // Scroll to trips section
    setTimeout(() => document.getElementById('trips-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) return (
    <div className="page-container">
      <div className="dash-skeleton">
        {[1,2,3,4].map(i => <div key={i} className="skel-card"/>)}
      </div>
    </div>
  );

  return (
    <div className="page-container dash-root">

      {/* HEADER */}
      <div className="dash-header fade-in">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]} ✈️</h1>
          <p className="subtitle">Here's your complete travel overview</p>
        </div>
        <Link to="/trips/new" className="btn btn-primary btn-lg">
          <Plus size={18}/> Plan New Trip
        </Link>
      </div>

      {/* ── STAT CARDS ────────────────────────────────────────────── */}
      <div className="stats-grid fade-in">
        <StatCard
          icon={<Globe size={22}/>} color="ocean"
          value={stats.total} label="Total Trips"
          active={activeFilter === null}
          hint="View all trips"
          onClick={() => { setActiveFilter(null); document.getElementById('trips-section')?.scrollIntoView({behavior:'smooth'}); }}
        />
        <StatCard
          icon={<Plane size={22}/>} color="coral"
          value={stats.upcoming} label="Upcoming"
          active={activeFilter === 'planning'}
          hint={`${trips.filter(t=>t.status==='active').length} active now`}
          onClick={() => handleStatClick('planning')}
        />
        <StatCard
          icon={<CheckCircle size={22}/>} color="sage"
          value={stats.completed} label="Completed"
          active={activeFilter === 'completed'}
          hint="All finished trips"
          onClick={() => handleStatClick('completed')}
        />
        <StatCard
          icon={<DollarSign size={22}/>} color="gold"
          value={`$${stats.budget >= 1000 ? (stats.budget/1000).toFixed(1)+'K' : stats.budget.toLocaleString()}`}
          label="Total Budget"
          active={false}
          hint={`$${totalSpent.toLocaleString()} spent - $${budgetRemaining >= 0 ? budgetRemaining.toLocaleString() : 0} left`}
          onClick={() => { setActiveFilter(null); navigate('/trips'); }}
        />
      </div>

      {/* ── BUDGET OVERVIEW + PIE CHART ────────────────────────────── */}
      {allExpenses.length > 0 && (
        <div className="dash-section fade-in">
          <div className="section-header">
            <h2><PieChart size={18} style={{verticalAlign:'middle',marginRight:8}}/>Budget Analytics</h2>
            <Link to="/trips" className="see-all">View all trips <ArrowRight size={14}/></Link>
          </div>
          <div className="budget-analytics-row">
            {/* Budget summary cards */}
            <div className="budget-summary-col">
              <div className="budget-summary-card">
                <div className="bsc-icon" style={{background:'rgba(10,77,110,0.1)',color:'var(--ocean)'}}><CreditCard size={18}/></div>
                <div><div className="bsc-label">Total Budget</div><div className="bsc-value">${stats.budget.toLocaleString()}</div></div>
              </div>
              <div className="budget-summary-card">
                <div className="bsc-icon" style={{background:'rgba(232,97,77,0.1)',color:'var(--coral)'}}><TrendingUp size={18}/></div>
                <div><div className="bsc-label">Total Spent</div><div className="bsc-value">${totalSpent.toLocaleString()}</div></div>
              </div>
              <div className="budget-summary-card">
                <div className="bsc-icon" style={{background:'rgba(107,143,113,0.1)',color:'var(--sage)'}}><Activity size={18}/></div>
                <div><div className="bsc-label">Remaining</div><div className="bsc-value" style={{color:budgetRemaining>=0?'var(--sage)':'var(--coral)'}}>
                  {budgetRemaining >= 0 ? `$${budgetRemaining.toLocaleString()}` : `-$${Math.abs(budgetRemaining).toLocaleString()}`}
                </div></div>
              </div>
              <div className="budget-progress-wrap">
                <div className="budget-progress-labels">
                  <span>Spent</span><span>{stats.budget > 0 ? Math.round((totalSpent/stats.budget)*100) : 0}%</span>
                </div>
                <div className="budget-progress-bar">
                  <div className="budget-progress-fill" style={{
                    width: `${Math.min(100, stats.budget > 0 ? (totalSpent/stats.budget)*100 : 0)}%`,
                    background: totalSpent > stats.budget ? 'var(--coral)' : 'var(--ocean)'
                  }}/>
                </div>
                <div className="budget-progress-labels" style={{marginTop:4}}>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>${totalSpent.toLocaleString()} of ${stats.budget.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="budget-pie-col">
              <h4>Spending by Category</h4>
              <ResponsiveContainer width="100%" height={240}>
                <RePieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                    dataKey="value" paddingAngle={3}
                    label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {catData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
                </RePieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {catData.map((d,i) => (
                  <div key={i} className="pie-legend-item">
                    <div className="pie-legend-dot" style={{background:d.color}}/>
                    <span>{d.icon} {d.name}</span>
                    <span className="pie-legend-val">${d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
      <div className="dash-section fade-in">
        <div className="section-header"><h2>Quick Actions</h2></div>
        <div className="quick-actions">
          <QuickAction to="/trips/new" icon="✈️" label="Plan New Trip" sub="Start your next adventure" color="ocean"/>
          <QuickAction to="/explore" icon="🌍" label="Explore World" sub="Live search & nearby places" color="coral"/>
          <QuickAction to="/trips" icon="🗂️" label="My Trips" sub="View & manage all trips" color="sage"/>
          <QuickAction to="/profile" icon="👤" label="My Profile" sub="Update your preferences" color="gold"/>
        </div>
      </div>

      {/* ── TRIPS SECTION ─────────────────────────────────────────── */}
      <div className="dash-section fade-in" id="trips-section">
        <div className="section-header">
          <h2>
            {activeFilter ? `${activeFilter.charAt(0).toUpperCase()+activeFilter.slice(1)} Trips` : 'Recent Trips'}
            {activeFilter && <span className="filter-active-badge" onClick={()=>setActiveFilter(null)}>✕ Clear filter</span>}
          </h2>
          <Link to="/trips" className="see-all">See all <ArrowRight size={14}/></Link>
        </div>

        {displayTrips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Map size={48}/></div>
            <h3>{activeFilter ? `No ${activeFilter} trips` : 'No trips yet'}</h3>
            <p>{activeFilter ? `You have no trips with status "${activeFilter}"` : 'Start planning your first adventure!'}</p>
            {!activeFilter && <Link to="/trips/new" className="btn btn-primary btn-sm"><Plus size={16}/> Create Trip</Link>}
          </div>
        ) : (
          <div className="trips-grid">
            {displayTrips.map(t => <TripCard key={t._id} trip={t}/>)}
          </div>
        )}
      </div>

      {/* ── STATUS BREAKDOWN ──────────────────────────────────────── */}
      {trips.length > 0 && (
        <div className="dash-section fade-in">
          <div className="section-header"><h2><BarChart2 size={18} style={{verticalAlign:'middle',marginRight:8}}/>Trip Status Breakdown</h2></div>
          <div className="breakdown-row">
            {[
              { status:'planning', label:'Planning', color:'#3B82F6', icon:'🗓️' },
              { status:'active', label:'Active', color:'#22c55e', icon:'✈️' },
              { status:'completed', label:'Completed', color:'#8B5CF6', icon:'✅' },
              { status:'cancelled', label:'Cancelled', color:'#EF4444', icon:'❌' },
            ].map(({status,label,color,icon}) => {
              const count = trips.filter(t=>t.status===status).length;
              const pct = trips.length > 0 ? Math.round((count/trips.length)*100) : 0;
              return (
                <div key={status} className={`breakdown-card ${activeFilter===status?'active-bd':''}`}
                  onClick={() => handleStatClick(status)} style={{cursor:'pointer'}}>
                  <div className="breakdown-top">
                    <span className="breakdown-icon">{icon}</span>
                    <span className="breakdown-count" style={{color}}>{count}</span>
                  </div>
                  <div className="breakdown-label">{label}</div>
                  <div className="breakdown-bar-bg"><div className="breakdown-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
                  <div className="breakdown-pct">{pct}% of all trips</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({icon,color,value,label,hint,onClick,active}){
  return (
    <div className={`stat-card stat-${color} clickable ${active?'stat-active':''}`} onClick={onClick}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

function QuickAction({to,icon,label,sub,color}){
  return (
    <Link to={to} className={`quick-action qa-${color}`}>
      <span className="qa-icon">{icon}</span>
      <div className="qa-text"><div className="qa-label">{label}</div><div className="qa-sub">{sub}</div></div>
      <ArrowRight size={16} className="qa-arrow"/>
    </Link>
  );
}

function TripCard({trip}){
  const days = Math.ceil((new Date(trip.endDate)-new Date(trip.startDate))/86400000);
  const STATUS_COLORS = {planning:'#3B82F6',active:'#22c55e',completed:'#8B5CF6',cancelled:'#EF4444'};
  return (
    <Link to={`/trips/${trip._id}`} className="trip-card">
      <div className="trip-card-img" style={trip.coverImage?{backgroundImage:`url(${trip.coverImage})`,backgroundSize:'cover',backgroundPosition:'center'}:{}}>
        <div className="trip-card-overlay"/>
        <span className="trip-status-badge" style={{background:STATUS_COLORS[trip.status]||'#64748b'}}>{trip.status}</span>
        <div className="trip-card-info">
          <h3>{trip.title}</h3>
          <div className="trip-card-meta"><MapPin size={11}/> {trip.destination}</div>
        </div>
      </div>
      <div className="trip-card-body">
        <div className="trip-dates"><Calendar size={13}/>{format(new Date(trip.startDate),'MMM d')} – {format(new Date(trip.endDate),'MMM d, yyyy')}<span className="trip-duration">{days}d</span></div>
        {trip.totalBudget>0&&<div className="trip-budget"><DollarSign size={13}/> ${trip.totalBudget.toLocaleString()} {trip.currency}</div>}
      </div>
    </Link>
  );
}
