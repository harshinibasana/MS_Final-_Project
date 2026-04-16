import React, { useState, useEffect } from 'react';
import { miscAPI } from '../../utils/api';
import { Plus, Trash2, Pencil, X, Check, Loader, Coins, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './MiscTab.css';

const TYPES = ['tip','souvenir','emergency','laundry','communication','postage','parking','toll','fee','donation','other'];
const TYPE_ICONS = { tip:'💵', souvenir:'🎁', emergency:'🚨', laundry:'👕', communication:'📱', postage:'📮', parking:'🅿️', toll:'🛣️', fee:'🏷️', donation:'❤️', other:'💼' };
const COLORS = ['#0A4D6E','#E8614D','#6B8F71','#F5A623','#7B68EE','#20B2AA','#FF6347','#4169E1','#32CD32','#FF69B4','#808080'];
const BLANK = { title:'', amount:'', type:'other', date:format(new Date(),'yyyy-MM-dd'), location:'', notes:'', currency:'USD' };

export default function MiscTab({ tripId }) {
  const [items, setItems]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadAll(); }, [tripId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [itemsRes, sumRes] = await Promise.all([
        miscAPI.getByTrip(tripId),
        miscAPI.getSummary(tripId),
      ]);
      setItems(itemsRes.data.items || []);
      setSummary(sumRes.data);
    } catch { toast.error('Failed to load misc expenses'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(String(form.amount).replace(/[^0-9.]/g, ''));
    if (isNaN(amt) || amt <= 0) return toast.error('Please enter a valid amount');
    setSaving(true);
    try {
      const payload = { ...form, amount: amt, trip: tripId };
      if (editId) {
        const res = await miscAPI.update(editId, payload);
        setItems(prev => prev.map(i => i._id === editId ? res.data.item : i));
        toast.success('Updated! ✅');
      } else {
        const res = await miscAPI.create(payload);
        setItems(prev => [res.data.item, ...prev]);
        toast.success('Expense added! ✅');
      }
      // Refresh summary totals
      const sumRes = await miscAPI.getSummary(tripId);
      setSummary(sumRes.data);
      setForm(BLANK); setShowForm(false); setEditId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title, amount: String(item.amount),
      type: item.type, currency: item.currency || 'USD',
      date: item.date ? item.date.slice(0,10) : format(new Date(),'yyyy-MM-dd'),
      location: item.location || '', notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await miscAPI.delete(id);
      setItems(prev => prev.filter(i => i._id !== id));
      const sumRes = await miscAPI.getSummary(tripId);
      setSummary(sumRes.data);
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const openAdd = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(BLANK); };

  const pieData = summary
    ? Object.entries(summary.byType || {}).map(([type, amt]) => ({
        name: `${TYPE_ICONS[type]} ${type.charAt(0).toUpperCase()+type.slice(1)}`,
        value: amt,
      }))
    : [];

  const formatDate = (d) => {
    if (!d) return '';
    try {
      // Use slice(0,10) to get yyyy-MM-dd in UTC, then parse locally
      const ds = typeof d === 'string' ? d.slice(0,10) : format(new Date(d),'yyyy-MM-dd');
      const [y,m,day] = ds.split('-').map(Number);
      return format(new Date(y,m-1,day),'MMM d, yyyy');
    } catch { return ''; }
  };

  if (loading) return <div className="tab-loading"><Loader size={28} className="spin"/></div>;

  return (
    <div className="misc-tab">

      {/* ── HEADER ── */}
      <div className="misc-header">
        <div>
          <div className="misc-total">
            <Coins size={20}/>
            <span>Total: <strong>${(summary?.total || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></span>
          </div>
          <div className="misc-count">{items.length} entr{items.length!==1?'ies':'y'}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={showForm ? closeForm : openAdd}>
          {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> Add Expense</>}
        </button>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="add-form">
          <h3>💼 {editId ? 'Edit' : 'Add'} Miscellaneous Expense</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Taxi tip, souvenir..." value={form.title}
                  onChange={e=>f('title',e.target.value)} required autoFocus/>
              </div>
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0.01"
                  value={form.amount} onChange={e=>f('amount',e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={e=>f('type',e.target.value)}>
                  {TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e=>f('date',e.target.value)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={e=>f('currency',e.target.value)}>
                  {['USD','EUR','GBP','JPY','AUD','CAD','INR','SGD'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Where?" value={form.location} onChange={e=>f('location',e.target.value)}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Additional details..." value={form.notes} onChange={e=>f('notes',e.target.value)}/>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Loader size={13} className="spin"/> : <Check size={13}/>}
                {editId ? ' Update' : ' Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CHART ── */}
      {pieData.length > 0 && (
        <div className="misc-chart-card">
          <h4>Breakdown by Type</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>`$${v.toLocaleString()}`}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── TYPE CHIPS ── */}
      {summary?.byType && Object.keys(summary.byType).length > 0 && (
        <div className="misc-type-summary">
          {Object.entries(summary.byType).sort((a,b)=>b[1]-a[1]).map(([type,amt])=>(
            <div key={type} className="misc-type-chip">
              <span className="misc-type-icon">{TYPE_ICONS[type]||'💼'}</span>
              <div>
                <div className="misc-type-name">{type.charAt(0).toUpperCase()+type.slice(1)}</div>
                <div className="misc-type-amt">${Number(amt).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY ── */}
      {items.length === 0 && !showForm && (
        <div className="empty-state">
          <Coins size={48} className="empty-icon"/>
          <h3>No miscellaneous expenses yet</h3>
          <p>Track tips, souvenirs, tolls and other small expenses here</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add First Expense</button>
        </div>
      )}

      {/* ── ITEMS LIST ── */}
      {items.length > 0 && (
        <div className="misc-list">
          {items.map(item=>(
            <div key={item._id} className="misc-item">
              <div className="misc-item-icon">{TYPE_ICONS[item.type]||'💼'}</div>
              <div className="misc-item-info">
                <div className="misc-item-title">{item.title}</div>
                <div className="misc-item-meta">
                  <span className="mim-type">{item.type}</span>
                  <span className="mim-date">📅 {formatDate(item.date)}</span>
                  {item.location && <span className="mim-loc"><MapPin size={10}/> {item.location}</span>}
                  {item.notes && <span className="mim-notes">📝 {item.notes}</span>}
                </div>
              </div>
              <div className="misc-item-amount">
                <span className="mia-amt">${Number(item.amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                <span className="mia-cur">{item.currency}</span>
              </div>
              <div className="misc-item-actions">
                <button className="mi-btn mi-edit" onClick={()=>handleEdit(item)} title="Edit">
                  <Pencil size={13}/>
                </button>
                <button className="mi-btn mi-del" onClick={()=>handleDelete(item._id)} disabled={deletingId===item._id} title="Delete">
                  {deletingId===item._id ? <Loader size={13} className="spin"/> : <Trash2 size={13}/>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
