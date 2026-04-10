import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUI } from '../App';
import api from '../api';

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const T = {
  en: {
    step1title:'Create Account', step2title:'Health Profile',
    step1sub:'Join MediHelp for personalized nutrition guidance',
    step2sub:'Optional - helps improve your AI recommendations',
    name:'Full Name', email:'Email Address', password:'Password', confirm:'Confirm Password',
    age:'Age', blood:'Blood Group', allergies:'Known Allergies', chronic:'Chronic Conditions',
    allergyHint:'e.g. peanuts, shellfish, sulfa (or leave blank)',
    chronicHint:'e.g. diabetes, hypertension (or leave blank)',
    allergyNote:'Your allergies will be used to flag unsafe foods in AI results',
    back:'Back', continue:'Continue', creating:'Creating…', create:'Create Account',
    skip:'Skip health profile for now', hasAccount:'Have an account?', signin:'Sign in',
    unknown:'Unknown', minPwd:'Password must be at least 6 characters', noMatch:'Passwords do not match',
  },
  sw: {
    step1title:'Fungua Akaunti', step2title:'Wasifu wa Afya',
    step1sub:'Jiunge na MediHelp kwa mwongozo wa lishe',
    step2sub:'Hiari - husaidia kuboresha mapendekezo ya AI yako',
    name:'Jina Kamili', email:'Barua Pepe', password:'Nenosiri', confirm:'Thibitisha Nenosiri',
    age:'Umri', blood:'Kundi la Damu', allergies:'Mzio Unaojulikana', chronic:'Magonjwa ya Kudumu',
    allergyHint:'mfano: karanga, samaki, sulfa (au acha wazi)',
    chronicHint:'mfano: kisukari, shinikizo la damu (au acha wazi)',
    allergyNote:'Mzio wako utatumika kupiga alama vyakula hatari katika matokeo ya AI',
    back:'Rudi', continue:'Endelea', creating:'Inaunda…', create:'Fungua Akaunti',
    skip:'Ruka wasifu wa afya kwa sasa', hasAccount:'Una akaunti?', signin:'Ingia',
    unknown:'Haijulikani', minPwd:'Nenosiri lazima liwe herufi 6 au zaidi', noMatch:'Manenosiri hayalingani',
  },
};

export default function Register() {
  const { login }                  = useAuth();
  const { lang, darkMode }         = useUI();
  const navigate                   = useNavigate();
  const [step, setStep]            = useState(1);
  const [form, setForm]            = useState({ name:'', email:'', password:'', confirm:'', age:'', bloodGroup:'', allergies:'', chronicConditions:'' });
  const [error, setError]          = useState('');
  const [loading, setLoading]      = useState(false);
  const t = T[lang] || T.en;
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const nextStep = e => {
    e.preventDefault();
    if (form.password.length < 6) { setError(t.minPwd); return; }
    if (form.password !== form.confirm) { setError(t.noMatch); return; }
    setError(''); setStep(2);
  };

  const handleSubmit = async e => {
    e?.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/api/register', { ...form, language: lang });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setStep(1);
    } finally { setLoading(false); }
  };

  const surf = { background: darkMode ? '#1e293b' : 'white', border: darkMode ? '1px solid #334155' : undefined };
  const text = { color: darkMode ? '#94a3b8' : '#6b7280' };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'2rem 1.25rem', background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
      <div className="card fade-up" style={{ width:'100%', maxWidth:440, ...surf }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16 }}>
            {[1,2].map(s => (
              <div key={s} style={{ width:32, height:4, borderRadius:2, background:s<=step?'#16a34a':'#e5e7eb', transition:'background 0.3s' }} />
            ))}
          </div>
          <h2 style={{ fontSize:'1.6rem', marginBottom:4, color: darkMode?'#f1f5f9':'#111827' }}>
            {step===1?t.step1title:t.step2title}
          </h2>
          <p style={{ ...text, fontSize:'0.875rem' }}>{step===1?t.step1sub:t.step2sub}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step===1 ? (
          <form onSubmit={nextStep}>
            <div className="form-group">
              <label className="form-label" style={text}>{t.name}</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Wanjiku Kamau" required />
            </div>
            <div className="form-group">
              <label className="form-label" style={text}>{t.email}</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@email.com" required />
            </div>
            <div className="form-group">
              <label className="form-label" style={text}>{t.password}</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder={lang==='sw'?'Herufi 6+':'Min. 6 characters'} required />
            </div>
            <div className="form-group">
              <label className="form-label" style={text}>{t.confirm}</label>
              <input type="password" className="form-input" value={form.confirm} onChange={set('confirm')} placeholder={lang==='sw'?'Rudia nenosiri':'Repeat password'} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.75rem', marginTop:8 }}>
              <I c="fa-arrow-right" style={{marginRight:6}}/>{t.continue}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={text}>{t.age}</label>
                <input type="number" className="form-input" value={form.age} onChange={set('age')} placeholder="e.g. 28" min="1" max="120" />
              </div>
              <div className="form-group">
                <label className="form-label" style={text}>{t.blood}</label>
                <select className="form-input" value={form.bloodGroup} onChange={set('bloodGroup')}>
                  <option value="">{t.unknown}</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={text}><I c="fa-triangle-exclamation" style={{marginRight:5,color:'#d97706'}}/>{t.allergies}</label>
              <input className="form-input" value={form.allergies} onChange={set('allergies')} placeholder={t.allergyHint} />
              <div style={{ fontSize:'0.68rem', color:'#d97706', marginTop:3 }}>
                <I c="fa-shield-halved" style={{marginRight:4}}/>{t.allergyNote}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={text}><I c="fa-notes-medical" style={{marginRight:5,color:'#0891b2'}}/>{t.chronic}</label>
              <input className="form-input" value={form.chronicConditions} onChange={set('chronicConditions')} placeholder={t.chronicHint} />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex:1, justifyContent:'center' }}>
                <I c="fa-arrow-left" style={{marginRight:6}}/>{t.back}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:2, justifyContent:'center', padding:'0.75rem' }}>
                {loading ? <><span className="spinner" style={{ width:16, height:16 }} /> {t.creating}</> : <><I c="fa-user-plus" style={{marginRight:6}}/>{t.create}</>}
              </button>
            </div>
            <button type="button" onClick={handleSubmit} disabled={loading} style={{ width:'100%', background:'none', border:'none', color:darkMode?'#64748b':'#6b7280', cursor:'pointer', fontSize:'0.8rem', marginTop:8 }}>
              {t.skip}
            </button>
          </form>
        )}

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', ...text }}>
          {t.hasAccount} <Link to="/login" style={{ color:'#16a34a', fontWeight:600 }}>{t.signin}</Link>
        </p>
        <div style={{ textAlign:'center', marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:`1px solid ${darkMode?'#334155':'#f3f4f6'}` }}>
          <Link to="/guest" style={{ fontSize:'0.8rem', color: darkMode?'#64748b':'#9ca3af', display:'inline-flex', alignItems:'center', gap:5, textDecoration:'none' }}>
            <i className="fa-solid fa-eye" style={{fontSize:'0.7rem'}}/>
            {lang==='sw'?'Jaribu bila akaunti (Hali ya Onyesho)':'Just browsing? Try Preview Mode'}
          </Link>
        </div>
      </div>
    </div>
  );
}