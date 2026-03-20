import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Global UI context - lang + darkMode shared across ALL pages/components
export const UIContext = createContext({ lang:'en', setLang:()=>{}, darkMode:false, setDarkMode:()=>{} });
export const useUI = () => useContext(UIContext);

// ── Global dark-mode CSS injected at App level so it applies to ALL pages ─────
// (Dashboard also injects this, but Admin/Home/Login don't - this ensures coverage)
const GLOBAL_DARK_CSS = `
  /* ── LIGHT MODE: explicit resets so no dark styles bleed through ── */
  body:not(.mh-dark) { background:#f9fafb!important; color:#111827!important; }
  body:not(.mh-dark) .card { color:#111827; }
  body:not(.mh-dark) nav:not(.mh-admin-nav), body:not(.mh-dark) header { background:rgba(255,255,255,0.97)!important; }
  body:not(.mh-dark) input:not([type="range"]),
  body:not(.mh-dark) select,
  body:not(.mh-dark) textarea { background:#ffffff!important; color:#111827!important; }
  body:not(.mh-dark) table { background:#ffffff!important; }
  body:not(.mh-dark) th { background:#f9fafb!important; color:#6b7280!important; }
  body:not(.mh-dark) td { color:#111827!important; }
  body:not(.mh-dark) h1, body:not(.mh-dark) h2, body:not(.mh-dark) h3,
  body:not(.mh-dark) h4, body:not(.mh-dark) h5, body:not(.mh-dark) h6 { color:#111827; }
  body:not(.mh-dark) p { color:#374151; }
  body:not(.mh-dark) label, body:not(.mh-dark) .form-label { color:#374151; }
  body:not(.mh-dark) .alert-error { background:#fef2f2!important; color:#dc2626!important; }
  body:not(.mh-dark) .alert-success { background:#f0fdf4!important; color:#15803d!important; }
  body:not(.mh-dark) .alert-warning { background:#fffbeb!important; color:#92400e!important; }

  /* ── DARK MODE ── */
  body.mh-dark { background:#0f172a!important; color:#f1f5f9!important; }
  body.mh-dark #root { background:#0f172a!important; }

  /* Surfaces - explicit class targeting, NO wildcard */
  body.mh-dark .card { background:#1e293b!important; border-color:#334155!important; color:#f1f5f9!important; }
  body.mh-dark .modal-inner { background:#1e293b!important; }
  body.mh-dark .modal-inner div,
  body.mh-dark .modal-inner h3,
  body.mh-dark .modal-inner p,
  body.mh-dark .modal-inner span,
  body.mh-dark .modal-inner label { color:#f1f5f9!important; }
  body.mh-dark nav, body.mh-dark header { background:rgba(30,41,59,0.97)!important; border-color:#334155!important; }

  /* Tabs */
  body.mh-dark .tabs { background:#1e293b!important; border-color:#334155!important; }
  body.mh-dark .tab { color:#64748b!important; background:transparent!important; border-color:#334155!important; }
  body.mh-dark .tab.active { color:#4ade80!important; border-color:#4ade80!important; }

  /* Forms */
  body.mh-dark input:not([type="range"]), body.mh-dark select,
  body.mh-dark textarea, body.mh-dark .form-input {
    background:#0f172a!important; border-color:#334155!important; color:#f1f5f9!important;
  }
  body.mh-dark input::placeholder, body.mh-dark textarea::placeholder { color:#64748b!important; }
  body.mh-dark label, body.mh-dark .form-label { color:#94a3b8!important; }
  body.mh-dark option { background:#1e293b; color:#f1f5f9; }

  /* Buttons */
  body.mh-dark .btn-ghost { color:#64748b!important; border-color:#334155!important; background:transparent!important; }
  body.mh-dark .btn-ghost:hover { background:#334155!important; color:#f1f5f9!important; }
  body.mh-dark .btn-outline { border-color:#334155!important; color:#94a3b8!important; }

  /* Alerts */
  body.mh-dark .alert { background:#1e293b!important; border-color:#334155!important; color:#f1f5f9!important; }
  body.mh-dark .alert-warning { background:#1c1608!important; border-color:#854d0e!important; color:#fde047!important; }
  body.mh-dark .alert-error { background:#1c0808!important; border-color:#991b1b!important; color:#f87171!important; }
  body.mh-dark .alert-success { background:#081c08!important; border-color:#166534!important; color:#4ade80!important; }

  /* Tables */
  body.mh-dark table { background:#1e293b!important; }
  body.mh-dark th { background:#0f172a!important; color:#64748b!important; border-color:#334155!important; }
  body.mh-dark td { border-color:#1e293b!important; color:#f1f5f9!important; }
  body.mh-dark tr:hover td { background:#334155!important; }

  /* Typography */
  body.mh-dark h1, body.mh-dark h2, body.mh-dark h3,
  body.mh-dark h4, body.mh-dark h5, body.mh-dark h6 { color:#f1f5f9!important; }
  body.mh-dark p { color:#cbd5e1; }
  body.mh-dark small { color:#64748b!important; }
  body.mh-dark hr { border-color:#334155!important; }

  /* Chat */
  body.mh-dark .chatbox { background:#0f172a!important; border-color:#334155!important; }
  body.mh-dark .chat-header, body.mh-dark .chat-footer { background:#1e293b!important; border-color:#334155!important; }
  body.mh-dark .ai-bubble { background:#1e293b!important; border-color:#334155!important; color:#f1f5f9!important; }

  /* Dashboard cards */
  body.mh-dark .history-item { background:#1e293b!important; border-color:#334155!important; }
  body.mh-dark .history-detail { background:#0f172a!important; }
  body.mh-dark .def-card { background:#1e293b!important; }
  body.mh-dark .def-card-body { background:#0f172a!important; }
  body.mh-dark .hospital-list-item { background:#1e293b!important; border-color:#334155!important; }

  /* Scrollbar */
  body.mh-dark ::-webkit-scrollbar { width:6px; }
  body.mh-dark ::-webkit-scrollbar-track { background:#0f172a; }
  body.mh-dark ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }

  /* Mobile responsive */
  @media(max-width:640px){
    .mh-tabs-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch;white-space:nowrap!important}
    .mh-tabs-wrap .tab{display:inline-flex!important;flex-shrink:0;font-size:0.72rem!important;padding:7px 10px!important}
    .mh-grid-2{grid-template-columns:1fr!important}
    .mh-header-row{flex-direction:column!important;align-items:flex-start!important;gap:8px!important}
    .mh-hospital-map{display:none!important}
    .mh-chat-height{height:calc(100svh - 180px)!important;min-height:380px!important}
    .mh-hide-mobile{display:none!important}
    .mh-full-mobile{width:100%!important;flex:1!important}
    .mh-action-row{flex-wrap:wrap!important}
    .mh-tab-label-long{display:none!important}
  }
`;

export default function App() {
  const [user, setUser]            = useState(null);
  const [token, setToken]          = useState(null);
  const [ready, setReady]          = useState(false);
  const [lang, setLangState]       = useState('en');
  const [darkMode, setDarkModeRaw] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('mh_token');
      const u = localStorage.getItem('mh_user');
      const savedLang = localStorage.getItem('mh_lang');
      const savedDark = localStorage.getItem('mh_dark');
      if (t && u) {
        const ud = JSON.parse(u);
        setToken(t); setUser(ud);
        if (ud.language) setLangState(ud.language);
        if (ud.dark_mode === 1) setDarkModeRaw(true);
      } else {
        if (savedLang) setLangState(savedLang);
        if (savedDark === '1') setDarkModeRaw(true);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mh-dark', darkMode);
    localStorage.setItem('mh_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  const setLang = l => { setLangState(l); localStorage.setItem('mh_lang', l); };
  const setDarkMode = v => setDarkModeRaw(v);

  const login = (userData, authToken) => {
    setUser(userData); setToken(authToken);
    localStorage.setItem('mh_token', authToken);
    localStorage.setItem('mh_user', JSON.stringify(userData));
    if (userData.language)   setLangState(userData.language);
    if (userData.dark_mode === 1) setDarkModeRaw(true);
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <UIContext.Provider value={{ lang, setLang, darkMode, setDarkMode }}>
        <style>{GLOBAL_DARK_CSS}</style>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard/*" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/admin/*" element={user?.role === 'ADMIN' ? <Admin /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </UIContext.Provider>
    </AuthContext.Provider>
  );
}