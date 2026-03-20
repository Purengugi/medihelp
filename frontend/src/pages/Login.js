import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUI } from '../App';
import api from '../api';

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;

const T = {
  en: { title:'Welcome Back', sub:'Sign in to your MediHelp account',
        email:'Email Address', password:'Password',
        btn:'Sign In', busy:'Signing in…',
        noAccount:"No account?", create:'Create one free' },
  sw: { title:'Karibu Tena', sub:'Ingia kwenye akaunti yako ya MediHelp',
        email:'Barua Pepe', password:'Nenosiri',
        btn:'Ingia', busy:'Inaingia…',
        noAccount:'Huna akaunti?', create:'Fungua bure' },
};

export default function Login() {
  const { login }                  = useAuth();
  const { lang, darkMode }         = useUI();
  const navigate                   = useNavigate();
  const [form, setForm]            = useState({ email:'', password:'' });
  const [error, setError]          = useState('');
  const [loading, setLoading]      = useState(false);
  const t = T[lang] || T.en;
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/login', form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || (lang==='sw'?'Imeshindwa. Angalia tena.':'Login failed. Check your credentials.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'2rem 1.25rem',
      background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
      <div className="card fade-up" style={{ width:'100%', maxWidth:420,
        background: darkMode ? '#1e293b' : 'white',
        border: darkMode ? '1px solid #334155' : undefined }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#15803d)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <I c="fa-hand" style={{ color:'white', fontSize:'1.4rem' }}/>
          </div>
          <h2 style={{ fontSize:'1.6rem', marginBottom:4, color: darkMode?'#f1f5f9':'#111827' }}>{t.title}</h2>
          <p style={{ color: darkMode?'#94a3b8':'#6b7280', fontSize:'0.875rem' }}>{t.sub}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{color:darkMode?'#94a3b8':undefined}}>{t.email}</label>
            <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{color:darkMode?'#94a3b8':undefined}}>{t.password}</label>
            <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'0.75rem', marginTop:8 }}>
            {loading ? <><span className="spinner" style={{ width:16, height:16 }} /> {t.busy}</> : <><I c="fa-right-to-bracket" style={{marginRight:6}}/>{t.btn}</>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color: darkMode?'#94a3b8':'#6b7280' }}>
          {t.noAccount} <Link to="/register" style={{ color:'#16a34a', fontWeight:600 }}>{t.create}</Link>
        </p>
      </div>
    </div>
  );
}