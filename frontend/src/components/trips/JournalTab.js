import React, { useState, useEffect } from 'react';
import { journalAPI } from '../../utils/api';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, X, Check, Loader, BookOpen, MapPin, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './JournalTab.css';

const MOODS = {
  amazing: { emoji:'🤩', label:'Amazing',  color:'#F5A623' },
  happy:   { emoji:'😊', label:'Happy',    color:'#22c55e' },
  neutral: { emoji:'😐', label:'Neutral',  color:'#64748b' },
  tired:   { emoji:'😴', label:'Tired',    color:'#8B5CF6' },
  tough:   { emoji:'😤', label:'Tough day',color:'#EF4444' },
};
const BLANK = { date: format(new Date(),'yyyy-MM-dd'), title:'', content:'', mood:'happy', weather:'', location:'', tags:'' };

export default function JournalTab({ tripId, trip }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    journalAPI.getByTrip(tripId)
      .then(r => setEntries(r.data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tripId]);

  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return toast.error('Write something in your journal!');
    setSaving(true);
    try {
      const payload = { ...form, trip: tripId, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [] };
      if (editId) {
        const r = await journalAPI.update(editId, payload);
        setEntries(prev => prev.map(e => e._id===editId ? r.data.entry : e));
        toast.success('Entry updated ✅');
      } else {
        const r = await journalAPI.create(payload);
        setEntries(prev => [...prev, r.data.entry].sort((a,b) => new Date(a.date)-new Date(b.date)));
        toast.success('Journal entry saved! 📖');
      }
      setForm(BLANK); setShowForm(false); setEditId(null);
    } catch { toast.error('Failed to save entry'); }
    finally { setSaving(false); }
  };

  const handleEdit = (entry) => {
    setEditId(entry._id);
    setForm({ date: entry.date.slice(0,10), title: entry.title||'', content: entry.content, mood: entry.mood||'happy', weather: entry.weather||'', location: entry.location||'', tags: (entry.tags||[]).join(', ') });
    setShowForm(true);
    setExpanded(null);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await journalAPI.delete(id);
      setEntries(prev => prev.filter(e => e._id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const wordCount = form.content.split(/\s+/).filter(Boolean).length;

  if (loading) return <div className="tab-loading"><Loader size={28} className="spin"/></div>;

  return (
    <div className="journal-tab">
      {/* Header */}
      <div className="journal-header">
        <div>
          <h3>Travel Journal</h3>
          <p className="journal-sub">{entries.length === 0 ? 'Start writing your travel story' : `${entries.length} entr${entries.length!==1?'ies':'y'}`}</p>
        </div>
        <button className={`btn-add-plan ${showForm?'is-cancel':''}`} onClick={() => { setShowForm(s=>!s); setEditId(null); setForm(BLANK); }}>
          {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> New Entry</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="journal-form fade-in">
          <div className="jf-header"><BookOpen size={14} color="var(--ocean)"/> {editId ? 'Edit Entry' : 'New Journal Entry'}</div>
          <form onSubmit={handleSubmit}>
            <div className="jf-row">
              <div className="jf-field" style={{width:160}}>
                <label>📅 Date</label>
                <input type="date" value={form.date} onChange={e=>f('date',e.target.value)} required/>
              </div>
              <div className="jf-field jf-grow">
                <label>✏️ Title (optional)</label>
                <input placeholder="e.g. First day in Paris..." value={form.title} onChange={e=>f('title',e.target.value)}/>
              </div>
              <div className="jf-field" style={{width:150}}>
                <label>😊 Mood</label>
                <select value={form.mood} onChange={e=>f('mood',e.target.value)}>
                  {Object.entries(MOODS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="jf-row">
              <div className="jf-field jf-grow">
                <label><MapPin size={11}/> Location</label>
                <input placeholder="Where are you?" value={form.location} onChange={e=>f('location',e.target.value)}/>
              </div>
              <div className="jf-field" style={{width:160}}>
                <label>🌤️ Weather</label>
                <input placeholder="Sunny, 28°C" value={form.weather} onChange={e=>f('weather',e.target.value)}/>
              </div>
            </div>
            <div className="jf-field">
              <label>📝 Journal Entry *</label>
              <textarea rows={8} placeholder="Write about your day — what you saw, ate, felt, discovered..." value={form.content} onChange={e=>f('content',e.target.value)} required className="jf-textarea"/>
              <div className="jf-word-count">{wordCount} word{wordCount!==1?'s':''}</div>
            </div>
            <div className="jf-field">
              <label><Tag size={11}/> Tags (comma-separated)</label>
              <input placeholder="e.g. food, museum, sunset" value={form.tags} onChange={e=>f('tags',e.target.value)}/>
            </div>
            <div className="jf-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => {setShowForm(false);setEditId(null);setForm(BLANK);}}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Loader size={13} className="spin"/> : <Check size={13}/>} Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div className="journal-empty">
          <div style={{fontSize:52}}>📖</div>
          <h4>Your journal is empty</h4>
          <p>Write about your daily adventures, feelings and memories. Your future self will thank you!</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14}/> Write First Entry</button>
        </div>
      )}

      {/* Entries timeline */}
      <div className="journal-timeline">
        {entries.map((entry, idx) => {
          const mood = MOODS[entry.mood] || MOODS.happy;
          const isOpen = expanded === entry._id;
          return (
            <div key={entry._id} className="journal-entry">
              {/* Timeline dot */}
              <div className="je-dot" style={{background: mood.color}}>{mood.emoji}</div>
              {idx < entries.length-1 && <div className="je-line"/>}

              <div className={`je-card ${isOpen?'open':''}`}>
                <div className="je-card-header" onClick={() => setExpanded(isOpen ? null : entry._id)}>
                  <div className="je-meta">
                    <span className="je-date">{format(parseISO(entry.date.slice(0,10)),'EEEE, MMMM d yyyy')}</span>
                    {entry.location && <span className="je-loc"><MapPin size={10}/> {entry.location}</span>}
                    {entry.weather  && <span className="je-weather">🌤️ {entry.weather}</span>}
                  </div>
                  <div className="je-right">
                    <span className="je-mood-badge" style={{background:mood.color+'18',color:mood.color}}>{mood.emoji} {mood.label}</span>
                    {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </div>
                </div>

                {entry.title && <div className="je-title">{entry.title}</div>}

                <div className={`je-content ${isOpen?'expanded':''}`}>
                  {entry.content}
                </div>

                {(entry.tags||[]).length > 0 && (
                  <div className="je-tags">
                    {entry.tags.map(t => <span key={t} className="je-tag">#{t}</span>)}
                  </div>
                )}

                {isOpen && (
                  <div className="je-actions">
                    <button className="je-btn je-edit" onClick={() => handleEdit(entry)}><Pencil size={13}/> Edit</button>
                    <button className="je-btn je-del" onClick={() => handleDelete(entry._id)} disabled={deletingId===entry._id}>
                      {deletingId===entry._id ? <Loader size={13} className="spin"/> : <Trash2 size={13}/>} Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
