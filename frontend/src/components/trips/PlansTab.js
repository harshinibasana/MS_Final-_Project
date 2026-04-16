import React, { useState, useEffect, useMemo } from 'react';
import { plansAPI } from '../../utils/api';
import { format, parseISO } from 'date-fns';
import {
  Plus, Pencil, Trash2, Check, X, Loader,
  CheckCircle2, Circle, Calendar, MapPin, Clock,
  ChevronDown, ChevronUp, AlertCircle, Sparkles, Flag,
  AlignLeft, CheckCheck, Activity, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PlansTab.css';

const CATS = ['activity','accommodation','transport','food','sightseeing','shopping','document','other'];
const CAT_ICONS = { activity:'🏃', accommodation:'🏨', transport:'🚗', food:'🍽️', sightseeing:'🏛️', shopping:'🛍️', document:'📄', other:'📌' };
const PRI_COLOR = { high:'#EF4444', medium:'#F59E0B', low:'#22c55e' };
const PRI_BG    = { high:'rgba(239,68,68,0.1)', medium:'rgba(245,158,11,0.1)', low:'rgba(34,197,94,0.1)' };
const BLANK = { title:'', description:'', category:'activity', date:format(new Date(),'yyyy-MM-dd'), time:'', location:'', priority:'medium', notes:'' };

export default function PlansTab({ tripId }) {
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK);
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat]       = useState('all');
  const [expandedId, setExpandedId]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    plansAPI.getByTrip(tripId)
      .then(r => setPlans(r.data.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [tripId]);

  // Build a set of already-used dates (yyyy-MM-dd) for quick lookup
  const usedDates = useMemo(() => {
    const set = new Set();
    plans.forEach(p => {
      if (p.date) set.add(p.date.slice(0, 10));
    });
    return set;
  }, [plans]);

  // When editing, the current plan's date is NOT blocked for itself
  const takenDatesForEdit = useMemo(() => {
    if (!editId) return usedDates;
    const editing = plans.find(p => p._id === editId);
    const editingDate = editing?.date?.slice(0, 10);
    const set = new Set(usedDates);
    if (editingDate) set.delete(editingDate); // allow its own date
    return set;
  }, [usedDates, editId, plans]);

  const completedCount = plans.filter(p => p.status === 'completed').length;
  const progress = plans.length ? Math.round((completedCount / plans.length) * 100) : 0;

  /* ── ADD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Plan title is required');
    if (!form.date) return toast.error('Please select a date for this plan');

    // Front-end duplicate date check
    if (form.date && usedDates.has(form.date)) {
      const clash = plans.find(p => p.date?.slice(0, 10) === form.date);
      toast.error(`"${clash?.title || 'A plan'}" is already on ${format(parseISO(form.date), 'MMM d, yyyy')}. Each day can only have one plan.`, { duration: 4000 });
      return;
    }

    setSaving(true);
    try {
      const res = await plansAPI.create({ ...form, trip: tripId });
      setPlans(p => [...p, res.data.plan]);
      setForm(BLANK); setShowForm(false);
      toast.success('Plan added! ✅');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add plan';
      toast.error(msg, { duration: 4000 });
    } finally { setSaving(false); }
  };

  /* ── TOGGLE STATUS ── */
  const handleToggle = async (plan) => {
    const next = plan.status === 'completed' ? 'active' : 'completed';
    setPlans(p => p.map(x => x._id === plan._id ? { ...x, status: next } : x));
    try {
      const res = await plansAPI.toggle(plan._id);
      setPlans(p => p.map(x => x._id === plan._id ? res.data.plan : x));
      if (next === 'completed') toast.success(`"${plan.title}" completed! 🎉`);
      else toast(`"${plan.title}" marked active`);
    } catch {
      setPlans(p => p.map(x => x._id === plan._id ? plan : x));
      toast.error('Failed to update status');
    }
  };

  /* ── EDIT ── */
  const startEdit = (plan) => {
    setShowForm(false); setEditId(plan._id); setExpandedId(null);
    setEditForm({
      title: plan.title, description: plan.description || '',
      category: plan.category, date: plan.date ? plan.date.slice(0, 10) : '',
      time: plan.time || '', location: plan.location || '',
      priority: plan.priority || 'medium', notes: plan.notes || '',
    });
  };

  const saveEdit = async () => {
    if (!editForm.title?.trim()) return toast.error('Title required');

    // Front-end duplicate date check for edit
    if (editForm.date && takenDatesForEdit.has(editForm.date)) {
      const clash = plans.find(p => p._id !== editId && p.date?.slice(0, 10) === editForm.date);
      toast.error(`"${clash?.title || 'Another plan'}" is already on ${format(parseISO(editForm.date), 'MMM d, yyyy')}.`, { duration: 4000 });
      return;
    }

    setSaving(true);
    try {
      const res = await plansAPI.update(editId, editForm);
      setPlans(p => p.map(x => x._id === editId ? res.data.plan : x));
      setEditId(null); toast.success('Plan updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save changes', { duration: 4000 });
    } finally { setSaving(false); }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id, title } = deleteConfirm;
    setDeletingId(id); setDeleteConfirm(null);
    try {
      await plansAPI.delete(id);
      setPlans(p => p.filter(x => x._id !== id));
      toast.success(`"${title}" deleted`);
    } catch { toast.error('Failed to delete plan'); }
    finally { setDeletingId(null); }
  };

  /* ── FILTER + SORT ── */
  const displayed = plans.filter(p =>
    (filterStatus === 'all' || p.status === filterStatus) &&
    (filterCat === 'all' || p.category === filterCat)
  );
  const sorted = [...displayed].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1; if (b.date) return 1;
    return 0;
  });
  const grouped = sorted.reduce((acc, p) => {
    const key = p.date ? format(parseISO(p.date.slice(0, 10)), 'EEE, MMM d yyyy') : 'No Date Set';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (loading) return (
    <div className="plans-loading"><Loader size={28} className="spin"/><p>Loading plans...</p></div>
  );

  return (
    <div className="plans-tab">

      {/* HEADER */}
      <div className="plans-header">
        <div>
          <h3>Trip Plans</h3>
          <p className="plans-sub">
            {plans.length === 0
              ? 'One plan per day — add activities, bookings & tasks'
              : `${completedCount} of ${plans.length} completed`}
          </p>
        </div>
        <button
          className={`btn-add-plan ${showForm ? 'is-cancel' : ''}`}
          onClick={() => { setShowForm(s => !s); setEditId(null); }}
        >
          {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> Add Plan</>}
        </button>
      </div>

      {/* ONE-PLAN-PER-DAY NOTICE */}
      {plans.filter(p => p.date).length > 0 && (
        <div className="plans-rule-notice">
          <AlertTriangle size={13}/>
          <span>Each date can only have <strong>one plan</strong>. Dates already in use are blocked.</span>
        </div>
      )}

      {/* PROGRESS */}
      {plans.length > 0 && (
        <div className="plans-progress-wrap">
          <div className="plans-progress-bar">
            <div className="plans-progress-fill" style={{
              width: `${progress}%`,
              background: progress === 100 ? '#22c55e' : progress >= 60 ? '#6B8F71' : 'var(--ocean)',
            }}/>
          </div>
          <span className="plans-progress-pct">{progress}%</span>
          {progress === 100 && <span className="plans-all-done">🎉 All done!</span>}
        </div>
      )}

      {/* QUICK STATS */}
      {plans.length > 0 && (
        <div className="plans-quick-stats">
          <div className="pqs-item"><span className="pqs-num">{plans.length}</span><span className="pqs-label">Total</span></div>
          <div className="pqs-item pqs-active"><Activity size={13}/><span className="pqs-num">{plans.filter(p => p.status !== 'completed').length}</span><span className="pqs-label">Active</span></div>
          <div className="pqs-item pqs-done"><CheckCheck size={13}/><span className="pqs-num">{completedCount}</span><span className="pqs-label">Done</span></div>
          <div className="pqs-item pqs-dated"><Calendar size={13}/><span className="pqs-num">{usedDates.size}</span><span className="pqs-label">Dates used</span></div>
        </div>
      )}

      {/* ADD FORM */}
      {showForm && (
        <form className="plan-form fade-in" onSubmit={handleAdd}>
          <div className="pf-form-header"><Sparkles size={14} color="var(--ocean)"/> New Plan</div>

          <div className="pf-row">
            <div className="pf-field pf-grow">
              <label>Title *</label>
              <input autoFocus placeholder="e.g. Visit Eiffel Tower, Hotel check-in..." value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required/>
            </div>
            <div className="pf-field pf-cat">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div className="pf-field pf-pri">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Taken dates strip */}
          {usedDates.size > 0 && (
            <div className="pf-taken-dates">
              <span className="pf-td-label">📅 Dates already planned:</span>
              <div className="pf-td-chips">
                {[...usedDates].sort().map(d => {
                  const plan = plans.find(p => p.date?.slice(0,10) === d);
                  return (
                    <span key={d} className={`pf-td-chip ${form.date === d ? 'clash' : ''}`}
                      title={plan?.title || d}>
                      {format(parseISO(d),'MMM d')}
                      {form.date === d && ' ✗'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pf-row">
            <div className="pf-field">
              <label><Calendar size={11}/> Date *</label>
              <div className="pf-date-wrap">
                <input type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className={form.date && usedDates.has(form.date) ? 'date-taken' : ''}
                  required
                />
                {form.date && usedDates.has(form.date) && (
                  <div className="pf-date-clash">
                    <AlertTriangle size={11}/>
                    {(() => {
                      const clash = plans.find(p => p.date?.slice(0,10) === form.date);
                      return `"${clash?.title || 'A plan'}" is already on this date`;
                    })()}
                  </div>
                )}
                {form.date && !usedDates.has(form.date) && (
                  <div className="pf-date-ok"><Check size={11}/> Date is available</div>
                )}
              </div>
            </div>
            <div className="pf-field">
              <label><Clock size={11}/> Time</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}/>
            </div>
            <div className="pf-field pf-grow">
              <label><MapPin size={11}/> Location</label>
              <input placeholder="Venue or address" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/>
            </div>
          </div>

          <div className="pf-field">
            <label><AlignLeft size={11}/> Notes</label>
            <textarea rows={2} placeholder="Booking reference, tips, reminders..." value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}/>
          </div>

          <div className="pf-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm(BLANK); }}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm"
              disabled={saving || (!!form.date && usedDates.has(form.date))}>
              {saving ? <Loader size={13} className="spin"/> : <Plus size={13}/>} Add Plan
            </button>
          </div>
        </form>
      )}

      {/* FILTERS */}
      {plans.length > 0 && (
        <div className="plans-filters">
          <div className="pf-status-pills">
            {[
              { v:'all',       l:'All',       count:plans.length,                                     icon:null },
              { v:'active',    l:'Active',    count:plans.filter(p=>p.status!=='completed').length,   icon:<Circle size={10}/> },
              { v:'completed', l:'Completed', count:completedCount,                                   icon:<CheckCircle2 size={10}/> },
            ].map(({ v, l, count, icon }) => (
              <button key={v} className={`pf-pill pf-pill-${v} ${filterStatus===v?'active':''}`} onClick={() => setFilterStatus(v)}>
                {icon}{l}<span className="pill-count">{count}</span>
              </button>
            ))}
          </div>
          <select className="pf-cat-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
      )}

      {/* EMPTY */}
      {plans.length === 0 && !showForm && (
        <div className="plans-empty">
          <div className="pe-icon">📋</div>
          <h4>No plans yet</h4>
          <p>Add one plan per day — activities, hotel check-ins, bookings and sightseeing to organise your trip.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14}/> Add Your First Plan</button>
        </div>
      )}

      {/* PLAN LIST */}
      {Object.entries(grouped).map(([day, dayPlans]) => (
        <div key={day} className="plan-day-group">
          <div className="pdg-label">
            <Calendar size={11}/><span>{day}</span>
            <span className="pdg-count">{dayPlans.length} item{dayPlans.length !== 1 ? 's' : ''}</span>
            {dayPlans.some(p => p.status === 'completed') && (
              <span className="pdg-done">{dayPlans.filter(p => p.status==='completed').length}/{dayPlans.length} done</span>
            )}
          </div>

          {dayPlans.map(plan => (
            editId === plan._id
              ? (
                <EditCard key={plan._id}
                  editForm={editForm} setEditForm={setEditForm}
                  saving={saving} onSave={saveEdit} onCancel={() => setEditId(null)}
                  takenDates={takenDatesForEdit}
                />
              )
              : (
                <PlanCard key={plan._id}
                  plan={plan} deletingId={deletingId} expandedId={expandedId} setExpandedId={setExpandedId}
                  onToggle={() => handleToggle(plan)}
                  onEdit={() => startEdit(plan)}
                  onDelete={() => setDeleteConfirm({ id: plan._id, title: plan.title })}
                />
              )
          ))}
        </div>
      ))}

      {sorted.length === 0 && plans.length > 0 && (
        <div className="plans-empty-filter">
          <AlertCircle size={18} opacity={0.4}/><p>No plans match this filter</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCat('all'); setFilterStatus('all'); }}>Clear filters</button>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="plan-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="plan-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="pdm-icon">🗑️</div>
            <h4>Delete this plan?</h4>
            <p>"{deleteConfirm.title}" will be permanently removed. The date will become available again.</p>
            <div className="pdm-actions">
              <button className="pdm-btn-cancel" onClick={() => setDeleteConfirm(null)}>Keep it</button>
              <button className="pdm-btn-delete" onClick={handleDelete}><Trash2 size={13}/> Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── EDIT CARD ── */
function EditCard({ editForm, setEditForm, saving, onSave, onCancel, takenDates }) {
  const CI = { activity:'🏃', accommodation:'🏨', transport:'🚗', food:'🍽️', sightseeing:'🏛️', shopping:'🛍️', document:'📄', other:'📌' };
  const dateTaken = editForm.date && takenDates.has(editForm.date);
  return (
    <div className="plan-card editing fade-in">
      <div className="pf-form-header editing-label"><Pencil size={13} color="var(--ocean)"/> Editing plan</div>
      <div className="pf-row">
        <div className="pf-field pf-grow"><label>Title *</label><input autoFocus value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})} placeholder="Plan title"/></div>
        <div className="pf-field pf-cat"><label>Category</label>
          <select value={editForm.category||'activity'} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
            {['activity','accommodation','transport','food','sightseeing','shopping','document','other'].map(c=><option key={c} value={c}>{CI[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div className="pf-field pf-pri"><label>Priority</label>
          <select value={editForm.priority||'medium'} onChange={e=>setEditForm({...editForm,priority:e.target.value})}>
            <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
          </select>
        </div>
      </div>
      <div className="pf-row">
        <div className="pf-field">
          <label>Date</label>
          <div className="pf-date-wrap">
            <input type="date" value={editForm.date||''} onChange={e=>setEditForm({...editForm,date:e.target.value})}
              className={dateTaken ? 'date-taken' : ''}/>
            {dateTaken && <div className="pf-date-clash"><AlertTriangle size={11}/> Date already has a plan</div>}
          </div>
        </div>
        <div className="pf-field"><label>Time</label><input type="time" value={editForm.time||''} onChange={e=>setEditForm({...editForm,time:e.target.value})}/></div>
        <div className="pf-field pf-grow"><label>Location</label><input value={editForm.location||''} onChange={e=>setEditForm({...editForm,location:e.target.value})} placeholder="Venue or address"/></div>
      </div>
      <div className="pf-field"><label>Notes</label><textarea rows={2} value={editForm.notes||''} onChange={e=>setEditForm({...editForm,notes:e.target.value})}/></div>
      <div className="pf-actions">
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13}/> Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving || dateTaken}>
          {saving ? <Loader size={13} className="spin"/> : <Check size={13}/>} Save Changes
        </button>
      </div>
    </div>
  );
}

/* ── PLAN CARD ── */
function PlanCard({ plan, deletingId, expandedId, setExpandedId, onToggle, onEdit, onDelete }) {
  const isDone     = plan.status === 'completed';
  const isExpanded = expandedId === plan._id;
  const CI = { activity:'🏃', accommodation:'🏨', transport:'🚗', food:'🍽️', sightseeing:'🏛️', shopping:'🛍️', document:'📄', other:'📌' };
  const PC = { high:'#EF4444', medium:'#F59E0B', low:'#22c55e' };
  const PB = { high:'rgba(239,68,68,0.1)', medium:'rgba(245,158,11,0.1)', low:'rgba(34,197,94,0.1)' };

  return (
    <div className={`plan-card ${isDone?'card-done':'card-active'}`}>
      <div className={`pc-stripe ${isDone?'stripe-done':'stripe-active'}`}/>
      <div className="pc-main">
        <div className="pc-toggle-wrap">
          <button className={`pc-toggle-btn ${isDone?'toggle-done':'toggle-active'}`} onClick={onToggle}
            title={isDone?'Mark as active':'Mark as completed'}>
            {isDone ? <CheckCircle2 size={28} color="#8B5CF6"/> : <Circle size={28} color="#94a3b8"/>}
          </button>
          <span className={`pc-status-label ${isDone?'sl-done':'sl-active'}`}>{isDone?'Done':'Active'}</span>
        </div>
        <div className="pc-content" onClick={() => setExpandedId(isExpanded?null:plan._id)}>
          <div className="pc-title-row">
            <span className={`pc-title ${isDone?'title-done':''}`}>{plan.title}</span>
          </div>
          <div className="pc-badges">
            <span className="badge-cat">{CI[plan.category]} {plan.category}</span>
            <span className="badge-priority" style={{color:PC[plan.priority||'medium'],background:PB[plan.priority||'medium']}}>
              <Flag size={9}/> {plan.priority||'medium'}
            </span>
            <span className={`badge-status-chip ${isDone?'bsc-done':'bsc-active'}`}>
              {isDone ? <><CheckCircle2 size={10}/> Completed</> : <><Activity size={10}/> Active</>}
            </span>
          </div>
          {(plan.date||plan.time||plan.location) && (
            <div className="pc-meta">
              {plan.date && <span><Calendar size={10}/>{format(parseISO(plan.date.slice(0,10)),'MMM d, yyyy')}</span>}
              {plan.time && <span><Clock size={10}/>{plan.time}</span>}
              {plan.location && <span><MapPin size={10}/>{plan.location}</span>}
            </div>
          )}
          {(plan.notes||plan.description) && (
            <div className={`pc-notes ${isExpanded?'notes-open':''}`}>{plan.description||plan.notes}</div>
          )}
        </div>
        <div className="pc-actions">
          <button className="pca-btn pca-expand" onClick={() => setExpandedId(isExpanded?null:plan._id)}>
            {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
          </button>
          <button className="pca-btn pca-edit" onClick={onEdit}><Pencil size={14}/><span>Edit</span></button>
          <button className="pca-btn pca-delete" onClick={onDelete} disabled={deletingId===plan._id}>
            {deletingId===plan._id ? <Loader size={14} className="spin"/> : <Trash2 size={14}/>}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
