import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI } from '../../utils/api';
import { format } from 'date-fns';
import { Plus, Trash2, Edit2, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Sector, LineChart, Line,
} from 'recharts';
import './tabs.css';

const CATS      = ['accommodation','transport','food','activities','shopping','health','visa','other'];
const CAT_ICONS = { accommodation:'🏨',transport:'✈️',food:'🍜',activities:'🎭',shopping:'🛍️',health:'💊',visa:'📄',other:'💼' };
const COLORS    = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const BLANK     = { title:'', amount:'', category:'food', date:format(new Date(),'yyyy-MM-dd'), notes:'' };
const fmt$      = n => '$'+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

/* ─── Active Pie Shape ─── */
const ActiveShape = (props) => {
  const { cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius-5} outerRadius={outerRadius+8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="white" strokeWidth={2}/>
      <text x={cx} y={cy-14} textAnchor="middle" fill="#1e293b" fontSize={11} fontWeight={700} textDecoration="none">
        {payload.icon} {payload.name}
      </text>
      <text x={cx} y={cy+8} textAnchor="middle" fill={fill} fontSize={22} fontWeight={900} fontFamily="Playfair Display">
        {fmt$(value)}
      </text>
      <text x={cx} y={cy+28} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight={600}>
        {(percent*100).toFixed(1)}%
      </text>
    </g>
  );
};

export default function BudgetTab({ tripId, trip }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK);
  const [editId, setEditId]     = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const [trendView, setTrendView] = useState('daily'); // 'daily' | 'monthly'

  useEffect(() => {
    expensesAPI.getByTrip(tripId).then(r => setExpenses(r.data.expenses || []));
  }, [tripId]);

  const totalSpent = expenses.reduce((s,e) => s + e.amount, 0);
  const budget     = trip?.totalBudget || 0;
  const remaining  = budget - totalSpent;
  const budgetPct  = budget > 0 ? Math.min(100, Math.round((totalSpent/budget)*100)) : 0;

  const catData = CATS.map((cat,i) => ({
    name:   cat.charAt(0).toUpperCase()+cat.slice(1),
    raw:    cat, icon: CAT_ICONS[cat], color: COLORS[i],
    amount: expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
  })).filter(d => d.amount > 0);

  /* ─── Daily spending data ─── */
  const dailyMap = {};
  expenses.forEach(e => {
    if (!e.date) return;
    const d = e.date.slice(0,10);
    dailyMap[d] = (dailyMap[d]||0) + e.amount;
  });
  const dailyData = Object.entries(dailyMap).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([date,amount]) => ({ date: format(new Date(date.replace(/-/g,'/')), 'MMM d'), amount }));

  /* ─── Monthly spending data ─── */
  const monthMap = {};
  expenses.forEach(e => {
    if (!e.date) return;
    const m = e.date.slice(0,7); // yyyy-MM
    monthMap[m] = (monthMap[m]||0) + e.amount;
  });
  const monthlyData = Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([m,amount]) => ({ date: format(new Date(m+'-01'.replace(/-/g,'/')), 'MMM yy'), amount }));

  const trendData = trendView==='daily' ? dailyData : monthlyData;

  /* ─── Handlers ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(String(form.amount).replace(/[^0-9.]/g,''));
    if (isNaN(amt) || amt <= 0) return toast.error('Please enter a valid amount');
    try {
      const payload = { ...form, amount: amt, trip: tripId };
      if (editId) {
        const r = await expensesAPI.update(editId, payload);
        setExpenses(p => p.map(ex => ex._id===editId ? r.data.expense : ex));
        setShowForm(false); setEditId(null); setForm(BLANK);
        toast.success('Updated ✅');
      } else {
        const r = await expensesAPI.create(payload);
        setExpenses(p => [r.data.expense, ...p]);
        setShowForm(false); setForm(BLANK);
        toast.success('Expense added ✅');
      }
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await expensesAPI.delete(id);
    setExpenses(p => p.filter(e => e._id!==id));
    toast.success('Deleted');
  };

  const startEdit = (exp) => {
    setForm({ title:exp.title, amount:String(exp.amount), category:exp.category,
      date: exp.date ? exp.date.slice(0,10) : format(new Date(),'yyyy-MM-dd'), notes:exp.notes||'' });
    setEditId(exp._id); setShowForm(true);
  };

  const onPieEnter = useCallback((_,i) => setActiveIdx(i), []);
  const onBarClick = useCallback((data) => {
    if (data?.activeTooltipIndex != null) setActiveIdx(data.activeTooltipIndex);
  }, []);
  const onLegendClick = (i) => setActiveIdx(p => p===i ? null : i);

  /* ─── Tooltips ─── */
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    const v = payload[0].value;
    const d = catData.find(c => c.name===label || c.name===payload[0]?.payload?.name);
    const pct = totalSpent > 0 ? Math.round((v/totalSpent)*100) : 0;
    return (
      <div className="ct-tip">
        {d && <div className="ct-tip-head"><span>{d.icon}</span><span>{d.name}</span></div>}
        <div className="ct-tip-row"><span>Amount</span><strong>{fmt$(v)}</strong></div>
        {totalSpent > 0 && <div className="ct-tip-row"><span>Share</span><strong>{pct}%</strong></div>}
      </div>
    );
  };

  const TrendTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    return (
      <div className="ct-tip">
        <div className="ct-tip-head"><span>📅</span><span>{label}</span></div>
        <div className="ct-tip-row"><span>Spent</span><strong>{fmt$(payload[0].value)}</strong></div>
      </div>
    );
  };

  return (
    <div className="budget-tab">

      {/* ── HERO ── */}
      <div className="budget-hero">
        <div className="budget-hero-row">
          <div className="bh-col">
            <div className="bh-label">Total Spent</div>
            <div className="bh-val spent">{fmt$(totalSpent)}</div>
          </div>
          {budget > 0 && <>
            <div className="bh-divider"/>
            <div className="bh-col">
              <div className="bh-label">Budget</div>
              <div className="bh-val">${budget.toLocaleString()}</div>
            </div>
            <div className="bh-divider"/>
            <div className="bh-col">
              <div className="bh-label">Remaining</div>
              <div className="bh-val" style={{color:remaining>=0?'var(--sage)':'var(--coral)'}}>
                {remaining>=0 ? `$${remaining.toLocaleString()}` : `-$${Math.abs(remaining).toLocaleString()}`}
              </div>
            </div>
            <div className="bh-divider"/>
            <div className="bh-col">
              <div className="bh-label">Used</div>
              <div className="bh-val" style={{color:budgetPct>90?'var(--coral)':budgetPct>70?'#F5A623':'var(--ocean)'}}>
                {budgetPct}%
              </div>
            </div>
          </>}
          <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}}
            onClick={()=>{setShowForm(!showForm);setEditId(null);setForm(BLANK);}}>
            <Plus size={16}/> Add Expense
          </button>
        </div>
        {budget > 0 && (
          <div style={{marginTop:14}}>
            <div className="bh-progress-labels">
              <span>{budgetPct}% of budget used</span>
              <span>{fmt$(totalSpent)} / ${budget.toLocaleString()}</span>
            </div>
            <div className="bh-progress-bar">
              <div className="bh-progress-fill" style={{
                width:`${budgetPct}%`,
                background:budgetPct>90?'var(--coral)':budgetPct>70?'#F5A623':'var(--ocean)'
              }}/>
            </div>
          </div>
        )}
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="add-form">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0}}>{editId?'Edit Expense':'Add Expense'}</h3>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setShowForm(false);setEditId(null);setForm(BLANK);}}><X size={16}/></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Hotel booking" value={form.title}
                  onChange={e=>setForm({...form,title:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($) *</label>
                <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0"
                  value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATS.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e=>setForm({...form,date:e.target.value})}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Optional notes" value={form.notes}
                onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={()=>{setShowForm(false);setEditId(null);setForm(BLANK);}}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">{editId?'Update':'Add Expense'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── CHARTS SECTION ── */}
      {catData.length > 0 && (
        <div className="bc2-card">
          <div className="bc2-header">
            <h3 className="bc2-title">💰 Spending by Category</h3>
            <p className="bc2-hint">Click any slice, bar or row to highlight that category</p>
          </div>

          {/* PIE + BAR side by side */}
          <div className="bc2-charts-row">

            {/* PIE */}
            <div className="bc2-chart-box">
              <div className="bc2-chart-label">Donut Chart</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    activeIndex={activeIdx ?? undefined}
                    activeShape={ActiveShape}
                    data={catData}
                    cx="50%" cy="50%"
                    innerRadius={72} outerRadius={110}
                    paddingAngle={3} dataKey="amount"
                    onMouseEnter={onPieEnter}
                    onClick={(_,i) => onLegendClick(i)}
                    style={{cursor:'pointer'}}
                  >
                    {catData.map((d,i) => (
                      <Cell key={i} fill={d.color}
                        opacity={activeIdx===null||activeIdx===i?1:0.25}
                        stroke="white" strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              {activeIdx === null && (
                <div className="bc2-pie-centre-hint">
                  <div className="bc2-pch-total">{fmt$(totalSpent)}</div>
                  <div className="bc2-pch-sub">total · {catData.length} categories</div>
                </div>
              )}
            </div>

            {/* BAR */}
            <div className="bc2-chart-box">
              <div className="bc2-chart-label">Bar Chart</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={catData}
                  layout="vertical"
                  margin={{left:4, right:56, top:4, bottom:4}}
                  onClick={onBarClick}
                  style={{cursor:'pointer'}}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#F1F5F9"/>
                  <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false}
                    axisLine={false} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v}`}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'#475569'}}
                    width={118} tickLine={false} axisLine={false}
                    tickFormatter={name=>{
                      const d=catData.find(c=>c.name===name);
                      return `${d?.icon||''} ${name}`;
                    }}
                  />
                  <Tooltip content={<ChartTooltip/>} cursor={{fill:'rgba(10,77,110,0.04)'}}/>
                  <Bar dataKey="amount" radius={[0,8,8,0]} maxBarSize={28}
                    onClick={(_,i) => onLegendClick(i)}>
                    {catData.map((d,i) => (
                      <Cell key={i} fill={d.color}
                        opacity={activeIdx===null||activeIdx===i?1:0.2}
                        stroke={activeIdx===i?d.color:'none'} strokeWidth={activeIdx===i?2:0}
                      />
                    ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LEGEND TABLE */}
          <div className="bc2-legend">
            <div className="bc2-legend-head">
              <span>Category</span>
              <span>Amount</span>
              <span>Share</span>
            </div>
            {catData.map((d,i) => {
              const pct = totalSpent > 0 ? Math.round((d.amount/totalSpent)*100) : 0;
              const active = activeIdx===i;
              return (
                <div key={i} className={`bc2-legend-row ${active?'active':''}`}
                  onClick={() => onLegendClick(i)}>
                  <div className="bc2-leg-left">
                    <div className="bc2-leg-dot" style={{background:d.color}}/>
                    <span className="bc2-leg-icon">{d.icon}</span>
                    <span className="bc2-leg-name">{d.name}</span>
                  </div>
                  <span className="bc2-leg-amt">{fmt$(d.amount)}</span>
                  <div className="bc2-leg-bar-wrap">
                    <div className="bc2-leg-bar">
                      <div className="bc2-leg-fill" style={{
                        width:`${pct}%`, background:d.color,
                        opacity: activeIdx===null||active ? 1 : 0.3,
                      }}/>
                    </div>
                    <span className="bc2-leg-pct">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SPENDING TREND ── */}
      {(dailyData.length > 0 || monthlyData.length > 0) && (
        <div className="bc2-card">
          <div className="bc2-header" style={{marginBottom:12}}>
            <h3 className="bc2-title">📈 Spending Trend</h3>
            <div className="bc2-trend-tabs">
              <button className={`bc2-tt ${trendView==='daily'?'active':''}`} onClick={()=>setTrendView('daily')}>
                Daily
              </button>
              <button className={`bc2-tt ${trendView==='monthly'?'active':''}`} onClick={()=>setTrendView('monthly')}>
                Monthly
              </button>
            </div>
          </div>

          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{top:5,right:16,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false}
                  axisLine={{stroke:'#E2E8F0'}} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} tickLine={false} axisLine={false}
                  tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v}`} width={44}/>
                <Tooltip content={<TrendTooltip/>} cursor={{fill:'rgba(10,77,110,0.05)'}}/>
                <Bar dataKey="amount" fill="#0A4D6E" radius={[5,5,0,0]} maxBarSize={40}>
                  {trendData.map((_,i) => (
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>
              No spending data for this view
            </div>
          )}

          {/* Summary row */}
          <div className="bc2-trend-summary">
            {trendView==='daily' && dailyData.length > 0 && (() => {
              const max = dailyData.reduce((m,d)=>d.amount>m.amount?d:m,dailyData[0]);
              const avg = totalSpent / dailyData.length;
              return (
                <>
                  <div className="bc2-ts-item">
                    <span>Peak day</span>
                    <strong>{max.date} · {fmt$(max.amount)}</strong>
                  </div>
                  <div className="bc2-ts-divider"/>
                  <div className="bc2-ts-item">
                    <span>Avg/day spent</span>
                    <strong>{fmt$(avg)}</strong>
                  </div>
                  <div className="bc2-ts-divider"/>
                  <div className="bc2-ts-item">
                    <span>Days tracked</span>
                    <strong>{dailyData.length}</strong>
                  </div>
                </>
              );
            })()}
            {trendView==='monthly' && monthlyData.length > 0 && (() => {
              const max = monthlyData.reduce((m,d)=>d.amount>m.amount?d:m,monthlyData[0]);
              return (
                <>
                  <div className="bc2-ts-item">
                    <span>Highest month</span>
                    <strong>{max.date} · {fmt$(max.amount)}</strong>
                  </div>
                  <div className="bc2-ts-divider"/>
                  <div className="bc2-ts-item">
                    <span>Months tracked</span>
                    <strong>{monthlyData.length}</strong>
                  </div>
                  <div className="bc2-ts-divider"/>
                  <div className="bc2-ts-item">
                    <span>Total</span>
                    <strong>{fmt$(totalSpent)}</strong>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── EXPENSE LIST ── */}
      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={40} className="empty-icon"/>
            <p>No expenses yet. Start tracking your spending!</p>
          </div>
        ) : expenses.map(exp => (
          <div key={exp._id} className="expense-item">
            <div className="expense-cat-icon">{CAT_ICONS[exp.category]||'💼'}</div>
            <div className="expense-details">
              <div className="expense-title">{exp.title}</div>
              <div className="expense-meta">
                <span className="expense-cat-badge">{exp.category}</span>
                <span>{exp.date ? format(new Date(exp.date.slice?.(0,10)||exp.date),'MMM d, yyyy') : ''}</span>
                {exp.notes && <span className="expense-notes">{exp.notes}</span>}
              </div>
            </div>
            <div className="expense-amount">{fmt$(exp.amount)}</div>
            <div className="expense-actions">
              <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(exp)} title="Edit"><Edit2 size={13}/></button>
              <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(exp._id)} title="Delete"><Trash2 size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
