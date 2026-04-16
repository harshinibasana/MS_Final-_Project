import React, { useState, useEffect } from 'react';
import { tripsAPI } from '../../utils/api';
import WeatherWidget    from './WeatherWidget';
import CurrencyConverter from './CurrencyConverter';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, MapPin } from 'lucide-react';

const COLORS = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#7B68EE','#20B2AA','#FF6347','#4169E1'];

export default function OverviewTab({ trip }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    tripsAPI.getStats(trip._id).then(r => setStats(r.data.stats)).catch(() => {});
  }, [trip._id]);

  const pieData = stats
    ? Object.entries(stats.byCategory).map(([cat, amt]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1), value: amt,
      }))
    : [];

  const budgetPct = stats && trip.totalBudget > 0
    ? Math.min((stats.totalSpent / trip.totalBudget) * 100, 100)
    : 0;

  return (
    <div className="overview-tab">

      {/* Live weather for this trip's destination */}
      <WeatherWidget destination={trip.destination} country={trip.country}/>

      {/* Currency converter — defaults to trip currency */}
      <CurrencyConverter tripCurrency={trip.currency || 'USD'}/>

      {/* Budget stats */}
      {stats && (
        <div className="overview-stats">
          {[
            { label:'Total Budget', value:`$${(trip.totalBudget||0).toLocaleString()}`,      icon:DollarSign,  color:'#0A4D6E' },
            { label:'Amount Spent', value:`$${(stats.totalSpent||0).toLocaleString()}`,      icon:TrendingDown, color:'#E8614D' },
            { label:'Remaining',    value:`$${(stats.remaining||0).toLocaleString()}`,       icon:TrendingUp,  color:'#6B8F71' },
            { label:'Expenses',     value:stats.expenseCount,                                icon:MapPin,      color:'#F5A623' },
          ].map(({ label, value, icon:Icon, color }) => (
            <div key={label} className="overview-stat-card">
              <div className="overview-stat-icon" style={{ background:color+'18', color }}>
                <Icon size={20}/>
              </div>
              <div className="overview-stat-value">{value}</div>
              <div className="overview-stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Budget progress bar */}
      {trip.totalBudget > 0 && stats && (
        <div className="overview-card">
          <h3>Budget Progress</h3>
          <div className="budget-bar-wrap">
            <div className="budget-bar">
              <div className="budget-bar-fill" style={{
                width:`${budgetPct}%`,
                background: budgetPct>90?'#E8614D':budgetPct>70?'#F5A623':'#6B8F71',
              }}/>
            </div>
            <span className="budget-pct">{budgetPct.toFixed(1)}%</span>
          </div>
          <div className="budget-bar-labels">
            <span>${(stats.totalSpent||0).toLocaleString()} spent</span>
            <span>${(stats.remaining||0).toLocaleString()} left</span>
          </div>
        </div>
      )}

      {/* Spending pie chart */}
      {pieData.length > 0 && (
        <div className="overview-card">
          <h3>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trip notes */}
      {trip.notes && (
        <div className="overview-card">
          <h3>Notes</h3>
          <p className="overview-notes">{trip.notes}</p>
        </div>
      )}

    </div>
  );
}
