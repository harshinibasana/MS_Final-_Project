import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Globe } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
      toast.success('Account created! Welcome to Travelify!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Globe size={48} className="auth-globe" />
          <h1>Start Exploring</h1>
          <p>Join thousands of travelers planning their dream journeys</p>
          <div className="auth-stats">
            <div className="auth-stat"><span className="auth-stat-number">50K+</span><span>Trips Planned</span></div>
            <div className="auth-stat"><span className="auth-stat-number">120+</span><span>Countries</span></div>
            <div className="auth-stat"><span className="auth-stat-number">4.9★</span><span>Rating</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <Globe size={28} />
            <span>Travelify</span>
          </div>
          <h2>Create account</h2>
          <p className="auth-subtitle">Start planning your adventures</p>

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: 'Repeat password' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input type={f.type} className="form-input" placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
