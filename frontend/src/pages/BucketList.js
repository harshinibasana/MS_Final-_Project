import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bucketAPI, tripsAPI } from '../utils/api';
import { Plus, Trash2, Check, ArrowLeft, Star, Globe, Map, Pencil, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './BucketList.css';

const CATS = ['adventure','culture','nature','beach','city','food','spiritual','other'];
const CAT_ICONS = { adventure:'🧗',culture:'🎭',nature:'🌿',beach:'🏖️',city:'🌆',food:'🍜',spiritual:'⛩️',other:'🌍' };
const PRI = { must:{label:'Must Go',color:'#EF4444',bg:'rgba(239,68,68,0.1)'},
              high:{label:'High Priority',color:'#F5A623',bg:'rgba(245,166,35,0.1)'},
              someday:{label:'Someday',color:'#6B8F71',bg:'rgba(107,143,113,0.1)'} };
const BLANK = { destination:'',country:'',category:'city',priority:'someday',notes:'',coverImage:'' };

// Beautiful unsplash images per category
const CAT_IMAGES = {
  adventure:'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=70',
  culture:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=70',
  nature:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&q=70',
  beach:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70',
  city:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=70',
  food:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=70',
  spiritual:'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=70',
  other:'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=70',
};

export default function BucketList() {
  const [items, setItems]         = useState([]);
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(BLANK);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState('all'); // all | pending | visited
  const [priFilter, setPriFilter] = useState('all');

  useEffect(() => {
    Promise.all([bucketAPI.getAll(), tripsAPI.getAll()])
      .then(([b,t]) => { setItems(b.data.items||[]); setTrips(t.data.trips||[]); })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount  = items.filter(i=>!i.visited).length;
  const visitedCount  = items.filter(i=>i.visited).length;
  const mustCount     = items.filter(i=>i.priority==='must'&&!i.visited).length;

  const displayed = items.filter(i => {
    if (filter==='pending' && i.visited) return false;
    if (filter==='visited' && !i.visited) return false;
    if (priFilter!=='all' && i.priority!==priFilter) return false;
    return true;
  });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.destination.trim()) return toast.error('Destination required');
    setSaving(true);
    try {
      if (editId) {
        const r = await bucketAPI.update(editId, form);
        setItems(p => p.map(x => x._id===editId ? r.data.item : x));
        toast.success('Updated ✅');
      } else {
        const r = await bucketAPI.create(form);
        setItems(p => [r.data.item,...p]);
        toast.success('Added to bucket list! 🌍');
      }
      setForm(BLANK); setShowForm(false); setEditId(null);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleVisited = async item => {
    const visited = !item.visited;
    setItems(p => p.map(x => x._id===item._id ? {...x,visited} : x));
    try {
      const r = await bucketAPI.update(item._id, { visited, visitedDate: visited ? new Date() : null });
      setItems(p => p.map(x => x._id===item._id ? r.data.item : x));
      if (visited) toast.success(`✈️ "${item.destination}" marked visited!`);
    } catch {
      setItems(p => p.map(x => x._id===item._id ? item : x));
    }
  };

  const handleDelete = async id => {
    try {
      await bucketAPI.delete(id);
      setItems(p => p.filter(x => x._id!==id));
      toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const startEdit = item => {
    setForm({ destination:item.destination, country:item.country||'',
      category:item.category, priority:item.priority, notes:item.notes||'', coverImage:item.coverImage||'' });
    setEditId(item._id); setShowForm(true);
  };

  if (loading) return <div className="page-container"><div className="loader"/></div>;

  return (
    <div className="bucket-page page-container">
      {/* Header */}
      <div className="bucket-header">
        <Link to="/dashboard" className="btn btn-ghost btn-sm"><ArrowLeft size={15}/> Dashboard</Link>
        <div className="bh-title">
          <h1>🌍 Bucket List</h1>
          <p>Dream destinations to visit before you die</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setShowForm(s=>!s);setEditId(null);setForm(BLANK);}}>
          {showForm?<><X size={15}/> Cancel</>:<><Plus size={15}/> Add Destination</>}
        </button>
      </div>

      {/* Stats strip */}
      <div className="bucket-stats">
        <div className="bs-item bs-pending"><Globe size={14}/><span>{pendingCount}</span>To Visit</div>
        <div className="bs-item bs-visited"><Check size={14}/><span>{visitedCount}</span>Visited</div>
        <div className="bs-item bs-must"><Star size={14}/><span>{mustCount}</span>Must Go</div>
        <div className="bs-progress">
          <div className="bsp-bar">
            <div className="bsp-fill" style={{width:`${items.length?Math.round(visitedCount/items.length*100):0}%`}}/>
          </div>
          <span>{items.length?Math.round(visitedCount/items.length*100):0}% explored</span>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bucket-form-card">
          <h3>{editId?'Edit Destination':'Add to Bucket List'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="bf-row">
              <div className="bf-field bf-grow">
                <label>Destination *</label>
                <input autoFocus placeholder="e.g. Bali, Iceland, Machu Picchu" value={form.destination}
                  onChange={e=>setForm({...form,destination:e.target.value})} required/>
              </div>
              <div className="bf-field">
                <label>Country</label>
                <input placeholder="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/>
              </div>
              <div className="bf-field">
                <label>Category</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATS.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div className="bf-field">
                <label>Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option value="must">🔴 Must Go</option>
                  <option value="high">🟡 High Priority</option>
                  <option value="someday">🟢 Someday</option>
                </select>
              </div>
            </div>
            <div className="bf-field">
              <label>Notes / Why you want to go</label>
              <textarea rows={2} placeholder="Why is this on your bucket list?" value={form.notes}
                onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
            <div className="bf-field">
              <label>Cover Image URL (optional)</label>
              <input placeholder="https://..." value={form.coverImage} onChange={e=>setForm({...form,coverImage:e.target.value})}/>
            </div>
            <div className="bf-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving?<Loader size={13} className="spin"/>:<><Plus size={13}/></>} {editId?'Update':'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <div className="bucket-filters">
          {[['all','All',items.length],['pending','To Visit',pendingCount],['visited','Visited ✅',visitedCount]].map(([v,l,c])=>(
            <button key={v} className={`bf-pill ${filter===v?'active':''}`} onClick={()=>setFilter(v)}>{l} <span>{c}</span></button>
          ))}
          <select className="bf-pri-sel" value={priFilter} onChange={e=>setPriFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="must">🔴 Must Go</option>
            <option value="high">🟡 High</option>
            <option value="someday">🟢 Someday</option>
          </select>
        </div>
      )}

      {/* Grid */}
      {displayed.length === 0 && !showForm ? (
        <div className="bucket-empty">
          <div style={{fontSize:64}}>🌍</div>
          <h3>{items.length===0?'Your bucket list is empty':'No items match'}</h3>
          <p>{items.length===0?'Start adding dream destinations you want to visit!':'Try changing the filter'}</p>
          {items.length===0 && <button className="btn btn-primary" onClick={()=>setShowForm(true)}><Plus size={15}/> Add First Destination</button>}
        </div>
      ) : (
        <div className="bucket-grid">
          {displayed.map(item => {
            const img = item.coverImage || CAT_IMAGES[item.category] || CAT_IMAGES.other;
            const pri = PRI[item.priority] || PRI.someday;
            // Check if there's a matching trip
            const matchTrip = trips.find(t =>
              t.destination?.toLowerCase().includes(item.destination.toLowerCase()) ||
              item.destination.toLowerCase().includes(t.destination?.toLowerCase())
            );
            return (
              <div key={item._id} className={`bucket-card ${item.visited?'card-visited':''}`}>
                <div className="bc-img" style={{backgroundImage:`url(${img})`}}>
                  <div className="bc-img-ov"/>
                  <div className="bc-top-row">
                    <span className="bc-cat-chip">{CAT_ICONS[item.category]} {item.category}</span>
                    <span className="bc-pri-chip" style={{background:pri.bg,color:pri.color}}>{pri.label}</span>
                  </div>
                  {item.visited && <div className="bc-visited-badge">✅ Visited</div>}
                </div>
                <div className="bc-body">
                  <h3 className="bc-dest">{item.destination}</h3>
                  {item.country && <div className="bc-country"><Globe size={11}/> {item.country}</div>}
                  {item.notes && <p className="bc-notes">{item.notes}</p>}
                  {matchTrip && (
                    <Link to={`/trips/${matchTrip._id}`} className="bc-trip-link">
                      <Map size={11}/> Trip planned: {matchTrip.title}
                    </Link>
                  )}
                </div>
                <div className="bc-actions">
                  <button className={`bca-check ${item.visited?'checked':''}`} onClick={()=>toggleVisited(item)}
                    title={item.visited?'Mark as not visited':'Mark as visited'}>
                    <Check size={14}/>
                    {item.visited?'Visited':'Mark Visited'}
                  </button>
                  <button className="bca-edit" onClick={()=>startEdit(item)} title="Edit"><Pencil size={13}/></button>
                  <button className="bca-del" onClick={()=>handleDelete(item._id)} title="Delete"><Trash2 size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
