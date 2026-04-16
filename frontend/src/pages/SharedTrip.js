import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareAPI } from '../utils/api';
import { format } from 'date-fns';
import { MapPin, Calendar, DollarSign, Users, Globe, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import './SharedTrip.css';

const CAT_EMOJI = { accommodation:'🏨', transport:'✈️', food:'🍜', activities:'🎭', shopping:'🛍️', health:'💊', visa:'📄', other:'💼' };
const STATUS_COLORS = { planning:'#3B82F6', active:'#22c55e', completed:'#8B5CF6', cancelled:'#EF4444' };

export default function SharedTrip() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    shareAPI.view(token)
      .then(r => setData(r.data))
      .catch(() => setError('This share link is invalid or has been removed.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="shared-loading"><div className="loader"/></div>;
  if (error)   return <div className="shared-error"><Globe size={48}/><h2>Link Not Found</h2><p>{error}</p><Link to="/login">Sign in to Travelify →</Link></div>;

  const { trip, expenses, plans, totalSpent } = data;
  const sc = STATUS_COLORS[trip.status] || '#64748b';
  const days = Math.ceil((new Date(trip.endDate)-new Date(trip.startDate))/(1000*60*60*24));
  const byCategory = expenses.reduce((acc,e) => { acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});

  return (
    <div className="shared-page">
      {/* Hero */}
      <div className="shared-hero" style={{backgroundImage:trip.coverImage?`url(${trip.coverImage})`:'linear-gradient(135deg,#0A4D6E,#0d6ea0)'}}>
        <div className="sh-overlay"/>
        <div className="sh-content">
          <div className="sh-badge"><Globe size={13}/> Shared Trip</div>
          <h1>{trip.title}</h1>
          <div className="sh-meta">
            <span><MapPin size={13}/> {trip.destination}{trip.country?`, ${trip.country}`:''}</span>
            <span><Calendar size={13}/> {format(new Date(trip.startDate),'MMM d')} – {format(new Date(trip.endDate),'MMM d, yyyy')}</span>
            <span>📅 {days} days</span>
            {trip.travelers>1 && <span><Users size={13}/> {trip.travelers} travelers</span>}
          </div>
          <div className="sh-status" style={{background:sc+'25',color:sc,borderColor:sc+'50'}}>{trip.status}</div>
        </div>
      </div>

      <div className="shared-body">
        {/* Shared by */}
        <div className="shared-by">
          <div className="sb-av">{trip.user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="sb-name">Shared by {trip.user?.name}</div>
            <div className="sb-note">via Travelify — Your travel planning companion</div>
          </div>
          <Link to="/register" className="sb-cta">Plan your trip <ArrowRight size={13}/></Link>
        </div>

        <div className="shared-grid">
          {/* Stats */}
          <div className="shared-card">
            <h3>Trip Stats</h3>
            <div className="ss-stats">
              {[
                {label:'Duration',val:`${days} days`,icon:'📅'},
                {label:'Budget',val:trip.totalBudget>0?`$${trip.totalBudget.toLocaleString()}`:'Flexible',icon:'💰'},
                {label:'Total Spent',val:totalSpent>0?`$${totalSpent.toLocaleString()}`:'Not tracked',icon:'💸'},
                {label:'Plans',val:plans.length,icon:'📋'},
              ].map(s=>(
                <div key={s.label} className="ss-stat">
                  <span className="ss-icon">{s.icon}</span>
                  <span className="ss-val">{s.val}</span>
                  <span className="ss-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spending breakdown */}
          {Object.keys(byCategory).length > 0 && (
            <div className="shared-card">
              <h3>Spending by Category</h3>
              {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
                <div key={cat} className="ss-expense-row">
                  <span>{CAT_EMOJI[cat]||'💸'}</span>
                  <span className="ss-cat">{cat}</span>
                  <div className="ss-bar-wrap">
                    <div className="ss-bar" style={{width:`${totalSpent>0?Math.round((amt/totalSpent)*100):0}%`}}/>
                  </div>
                  <span className="ss-amt">${amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Plans */}
          {plans.length > 0 && (
            <div className="shared-card shared-plans">
              <h3>Trip Plans ({plans.length})</h3>
              <div className="ss-plans">
                {plans.map(p=>(
                  <div key={p._id} className={`ss-plan ${p.status==='completed'?'done':''}`}>
                    {p.status==='completed' ? <CheckCircle2 size={15} color="#8B5CF6"/> : <Circle size={15} color="#94a3b8"/>}
                    <div className="ss-plan-info">
                      <span className="ss-plan-title">{p.title}</span>
                      {p.date && <span className="ss-plan-date">{format(new Date(p.date.slice(0,10)),'MMM d')}</span>}
                    </div>
                    <span className="ss-plan-cat">{p.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shared-cta">
          <Globe size={36}/>
          <h2>Plan your own adventure</h2>
          <p>Travelify helps you track trips, budgets, packing lists, hotels and more — all in one place.</p>
          <Link to="/register" className="btn btn-primary">Start Planning Free →</Link>
        </div>
      </div>
    </div>
  );
}
