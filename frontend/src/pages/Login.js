import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Globe, Eye, EyeOff, Mail, Lock, ArrowRight, MapPin, BarChart2, Camera, Package } from 'lucide-react';
import './Auth.css';

const FEATURES = [
  { icon: <MapPin size={18}/>, title: 'Smart Trip Planning', desc: 'Organize every detail of your trip in one place' },
  { icon: <BarChart2 size={18}/>, title: 'Budget Analytics', desc: 'Track spending with visual charts and breakdowns' },
  { icon: <Camera size={18}/>, title: 'Photo Gallery', desc: 'Store and relive your travel memories' },
  { icon: <Package size={18}/>, title: 'Packing Lists', desc: 'Never forget essentials with smart checklists' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
      toast.success('Welcome back! ✈️');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left visual panel */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Globe size={52} className="auth-globe"/>
          <h1>Your Journey<br/>Awaits</h1>
          <p>Plan, track and relive your travel adventures with Travelify</p>
          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f.title} className="auth-feature-item">
                <div className="af-icon">{f.icon}</div>
                <div className="af-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-panel">
          <div className="auth-form-card">
            <div className="auth-logo-row">
              <Globe size={26} color="var(--ocean)"/>
              <span className="auth-logo-text">Travelify</span>
            </div>

            <h2>Welcome back</h2>
            <p className="auth-sub">Sign in to continue your adventures</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="form-label">Email Address</label>
                <div className="auth-field-icon-wrap">
                  <Mail size={16} className="auth-field-icon"/>
                  <input type="email" className="auth-input" placeholder="you@example.com"
                    value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required autoFocus/>
                </div>
              </div>

              <div className="auth-field">
                <label className="form-label">Password</label>
                <div className="auth-field-icon-wrap" style={{position:'relative'}}>
                  <Lock size={16} className="auth-field-icon"/>
                  <input type={showPass?'text':'password'} className="auth-input" placeholder="Your password"
                    value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex'}}>
                    {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-full" disabled={loading}>
                {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16}/></>}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/register">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
