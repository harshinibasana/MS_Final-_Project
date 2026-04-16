import React, { useState, useEffect } from 'react';
import { packingAPI } from '../../utils/api';
import { Plus, Trash2, Check, Pencil, X, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './tabs.css';

const CATS = ['clothing','toiletries','electronics','documents','medicine','accessories','other'];
const CAT_ICONS = { clothing:'👔', toiletries:'🧴', electronics:'📱', documents:'📄', medicine:'💊', accessories:'👓', other:'📦' };

export default function PackingTab({ tripId }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name:'', category:'clothing', quantity:1, notes:'' });
  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    packingAPI.getByTrip(tripId)
      .then(res => setItems(res.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tripId]);

  const packedCount = items.filter(i => i.packed).length;
  const pct = items.length ? Math.round((packedCount / items.length) * 100) : 0;

  const byCategory = CATS.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Item name is required');
    setSaving(true);
    try {
      const res = await packingAPI.create({ ...form, trip: tripId, quantity: parseInt(form.quantity) || 1 });
      setItems(prev => [...prev, res.data.item].sort((a,b) => a.category.localeCompare(b.category)));
      setForm({ name:'', category:'clothing', quantity:1, notes:'' });
      setShowForm(false);
      toast.success('Item added!');
    } catch { toast.error('Failed to add item'); }
    finally { setSaving(false); }
  };

  const togglePacked = async (item) => {
    const newPacked = !item.packed;
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, packed: newPacked } : i));
    try {
      const res = await packingAPI.update(item._id, { packed: newPacked });
      setItems(prev => prev.map(i => i._id === item._id ? res.data.item : i));
      if (newPacked) toast.success('"' + item.name + '" packed!');
      else toast('"' + item.name + '" unpacked');
    } catch {
      setItems(prev => prev.map(i => i._id === item._id ? item : i));
      toast.error('Failed to update');
    }
  };

  const startEdit = (item) => {
    setEditId(item._id);
    setEditForm({ name: item.name, category: item.category, quantity: item.quantity, notes: item.notes || '' });
  };

  const saveEdit = async (id) => {
    if (!editForm.name?.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      const res = await packingAPI.update(id, { ...editForm, quantity: parseInt(editForm.quantity) || 1 });
      setItems(items.map(i => i._id === id ? res.data.item : i));
      setEditId(null);
      toast.success('Item updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm('Delete "' + name + '"?')) return;
    try {
      await packingAPI.delete(id);
      setItems(items.filter(i => i._id !== id));
      toast.success('Item removed');
    } catch { toast.error('Failed to delete'); }
  };

  const loadTemplate = async () => {
    if (!window.confirm('Load default packing template? Common items will be added.')) return;
    try {
      const res = await packingAPI.addTemplate(tripId);
      setItems(prev => [...prev, ...res.data.items].sort((a,b) => a.category.localeCompare(b.category)));
      toast.success(res.data.count + ' items added!');
    } catch { toast.error('Failed to load template'); }
  };

  if (loading) return <div className="tab-loading"><Loader size={28} className="spin"/></div>;

  return (
    <div className="packing-tab">

      {/* HEADER with big counter */}
      <div className="packing-header">
        <div className="packing-progress-wrap">

          {/* Large counter */}
          <div className="packing-counter">
            <div className="pc-nums">
              <span className="pc-packed">{packedCount}</span>
              <span className="pc-slash">/</span>
              <span className="pc-total">{items.length}</span>
            </div>
            <div className="pc-label">
              {items.length === 0
                ? 'No items yet'
                : packedCount === items.length && items.length > 0
                ? 'All packed!'
                : 'items packed'}
            </div>
          </div>

          {/* Progress bar */}
          {items.length > 0 && (
            <div className="packing-bar-wrap">
              <div className="packing-bar">
                <div
                  className="packing-bar-fill"
                  style={{
                    width: pct + '%',
                    background: pct === 100 ? '#22c55e' : pct >= 50 ? 'var(--sage)' : 'var(--ocean)',
                  }}
                />
              </div>
              <span className="packing-bar-pct">{pct}%</span>
            </div>
          )}

          {/* Per-category progress pills */}
          {items.length > 0 && (
            <div className="packing-cat-progress">
              {Object.entries(byCategory).map(([cat, catItems]) => {
                const doneCat = catItems.filter(i => i.packed).length;
                const allDone = doneCat === catItems.length;
                return (
                  <div key={cat} className={'pcp-pill' + (allDone ? ' done' : '')}>
                    <span>{CAT_ICONS[cat]}</span>
                    <span>{doneCat}/{catItems.length}</span>
                    {allDone && <Check size={10}/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          {items.length === 0 && (
            <button className="btn btn-ghost btn-sm" onClick={loadTemplate}>
              Load Template
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={15}/> Cancel</> : <><Plus size={15}/> Add Item</>}
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <h3>New Packing Item</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Passport"
                value={form.name}
                onChange={e => setForm({...form, name:e.target.value})}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={form.quantity}
                onChange={e => setForm({...form, quantity:e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              className="form-input"
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => setForm({...form, notes:e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Loader size={13} className="spin"/> : <Plus size={13}/>} Add Item
            </button>
          </div>
        </form>
      )}

      {/* EMPTY STATE */}
      {items.length === 0 && !showForm && (
        <div className="empty-state">
          <span style={{ fontSize:48 }}>🧳</span>
          <h3>Packing list is empty</h3>
          <p>Add items manually or load our travel template</p>
          <button className="btn btn-primary" onClick={loadTemplate}>Load Template</button>
        </div>
      )}

      {/* ITEMS BY CATEGORY */}
      {Object.entries(byCategory).map(([cat, catItems]) => (
        <div key={cat} className="packing-category">
          <div className="packing-category-header">
            <span className="pcat-icon">{CAT_ICONS[cat]}</span>
            <span className="packing-cat-name">{cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
            <span className="packing-cat-count">
              {catItems.filter(i => i.packed).length}/{catItems.length}
              {catItems.every(i => i.packed) && (
                <span className="pcat-all-done"> done!</span>
              )}
            </span>
          </div>

          <div className="packing-items">
            {catItems.map(item => (
              <div key={item._id} className={'packing-item' + (item.packed ? ' packed' : '')}>

                {/* EDIT MODE */}
                {editId === item._id ? (
                  <div className="packing-edit-row">
                    <input
                      className="packing-edit-input"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name:e.target.value})}
                      autoFocus
                    />
                    <select
                      className="packing-edit-sel"
                      value={editForm.category}
                      onChange={e => setEditForm({...editForm, category:e.target.value})}
                    >
                      {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                    <input
                      type="number"
                      className="packing-edit-qty"
                      min="1"
                      value={editForm.quantity}
                      onChange={e => setEditForm({...editForm, quantity:e.target.value})}
                    />
                    <button className="packing-icon-btn save" onClick={() => saveEdit(item._id)} disabled={saving}>
                      <Save size={13}/>
                    </button>
                    <button className="packing-icon-btn cancel" onClick={() => setEditId(null)}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Check toggle */}
                    <button
                      className={'packing-item-check' + (item.packed ? ' checked' : '')}
                      onClick={() => togglePacked(item)}
                      title={item.packed ? 'Mark unpacked' : 'Mark packed'}
                    >
                      {item.packed && <Check size={12} color="white" strokeWidth={3}/>}
                    </button>

                    {/* Item info */}
                    <div className="packing-item-info">
                      <span className={'packing-item-name' + (item.packed ? ' done' : '')}>{item.name}</span>
                      {item.quantity > 1 && <span className="packing-item-qty">x{item.quantity}</span>}
                      {item.notes && <span className="packing-item-notes">{item.notes}</span>}
                    </div>

                    {/* Packed badge */}
                    {item.packed && (
                      <span className="packing-completed-badge">
                        <Check size={10}/> Packed
                      </span>
                    )}

                    {/* Actions */}
                    <div className="packing-item-actions">
                      <button className="packing-icon-btn edit" onClick={() => startEdit(item)} title="Edit">
                        <Pencil size={12}/>
                      </button>
                      <button className="packing-icon-btn delete" onClick={() => handleDelete(item._id, item.name)} title="Delete">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
