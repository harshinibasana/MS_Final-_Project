import React, { useState, useEffect } from 'react';
import { currencyAPI } from '../../utils/api';
import { ArrowLeftRight, RefreshCw, Loader } from 'lucide-react';
import './CurrencyConverter.css';

const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CAD','INR','SGD','CHF','CNY','MYR','THB','AED','MXN','BRL'];

export default function CurrencyConverter({ tripCurrency = 'USD' }) {
  const [rates, setRates]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount]   = useState('100');
  const [from, setFrom]       = useState('USD');
  const [to, setTo]           = useState(tripCurrency !== 'USD' ? tripCurrency : 'EUR');
  const [updated, setUpdated] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const loadRates = async () => {
    setLoading(true);
    try {
      const r = await currencyAPI.getRates(from);
      setRates(r.data.rates);
      setIsFallback(r.data.fallback || false);
      if (r.data.updated) setUpdated(new Date(r.data.updated).toLocaleDateString());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadRates(); }, [from]);

  const result = rates && amount ? (parseFloat(amount) * (rates[to] / (rates[from] || 1))).toFixed(2) : '—';
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="currency-converter">
      <div className="cc-header">
        <div className="cc-title">💱 Currency Converter</div>
        {isFallback && <span className="cc-fallback">Using estimated rates</span>}
        {updated && !isFallback && <span className="cc-updated">Updated {updated}</span>}
        <button className="cc-refresh" onClick={loadRates} disabled={loading}>
          {loading ? <Loader size={12} className="spin"/> : <RefreshCw size={12}/>}
        </button>
      </div>

      <div className="cc-inputs">
        <div className="cc-group">
          <input type="number" className="cc-amount" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="Amount"/>
          <select className="cc-sel" value={from} onChange={e => setFrom(e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button className="cc-swap" onClick={swap} title="Swap currencies">
          <ArrowLeftRight size={16}/>
        </button>

        <div className="cc-group cc-result-group">
          <div className="cc-result">{loading ? '…' : result}</div>
          <select className="cc-sel" value={to} onChange={e => setTo(e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Quick conversions */}
      {rates && (
        <div className="cc-quick">
          {[1, 5, 10, 50, 100, 500].map(n => (
            <button key={n} className="cc-quick-btn" onClick={() => setAmount(String(n))}>
              {from} {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
