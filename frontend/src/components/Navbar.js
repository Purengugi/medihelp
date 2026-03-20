import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUI } from '../App';

const Logo = () => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
    <path d="M24 3L5 11.5V23C5 34.5 13.2 43.5 24 45.5C34.8 43.5 43 34.5 43 23V11.5L24 3Z"
          fill="#16a34a" opacity="0.15" stroke="#16a34a" strokeWidth="2"/>
    <rect x="21.5" y="13" width="5" height="22" rx="2.5" fill="#16a34a"/>
    <rect x="13" y="21.5" width="22" height="5" rx="2.5" fill="#16a34a"/>
  </svg>
);

const NAV_T = {
  en: { home:'Home', dashboard:'Dashboard', admin:'Admin', signIn:'Sign In', getStarted:'Get Started', logout:'Logout' },
  sw: { home:'Nyumbani', dashboard:'Dashibodi', admin:'Msimamizi', signIn:'Ingia', getStarted:'Anza Sasa', logout:'Toka' },
};

export default function Navbar() {
  const { user, logout }                         = useAuth();
  const { lang, setLang, darkMode, setDarkMode } = useUI();
  const navigate                                 = useNavigate();
  const location                                 = useLocation();
  const [menuOpen, setMenuOpen]                  = useState(false);
  const t   = NAV_T[lang] || NAV_T.en;
  const onAdmin = location.pathname.startsWith('/admin');
  const isActive = p => location.pathname === p || location.pathname.startsWith(p+'/');

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const navLinkStyle = active => ({
    color: active ? '#16a34a' : darkMode ? '#94a3b8' : '#6b7280',
    fontWeight: active ? 600 : 500, fontSize:'0.9rem',
    padding:'0.4rem 0.75rem', borderRadius:8, textDecoration:'none',
    display:'flex', alignItems:'center', gap:6, transition:'color 0.15s',
  });

  const iconBtn = {
    background: darkMode ? '#1e293b' : '#f3f4f6',
    border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
    borderRadius:8, padding:'5px 10px', cursor:'pointer',
    color: darkMode ? '#f1f5f9' : '#374151',
    fontSize:'0.78rem', fontWeight:700,
    display:'flex', alignItems:'center', gap:4,
  };

  return (
    <>
      <nav style={{
        background: darkMode ? 'rgba(30,41,59,0.97)' : 'rgba(255,255,255,0.97)',
        backdropFilter:'blur(12px)',
        borderBottom: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
        position:'sticky', top:0, zIndex:100, height:60,
      }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.25rem', height:'100%',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>

          <Link to={user ? '/dashboard' : '/'} style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
            <Logo/>
            <span style={{fontFamily:'Fraunces, serif',fontWeight:700,fontSize:'1.15rem',color:darkMode?'#f1f5f9':'#111827'}}>
              MediHelp
            </span>
          </Link>

          <div style={{display:'flex',alignItems:'center',gap:6}} className="desktop-nav">
            {!user ? (
              <>
                <Link to="/" style={navLinkStyle(location.pathname==='/')}>{t.home}</Link>
                <Link to="/login" className="btn btn-outline btn-sm">{t.signIn}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t.getStarted}</Link>
              </>
            ) : !onAdmin ? (
              <>
                {user.role==='ADMIN' && (
                  <Link to="/admin" style={navLinkStyle(isActive('/admin'))}>
                    <i className="fa-solid fa-gear" style={{fontSize:'0.75rem'}}/>{t.admin}
                  </Link>
                )}
              </>
            ) : null /* on admin: no extra links */ }

            <div style={{display:'flex',gap:5,alignItems:'center',marginLeft:4}}>
              <button onClick={() => setLang(lang==='en'?'sw':'en')} style={iconBtn} title="Toggle Language">
                <i className="fa-solid fa-language"/>
                <span>{lang==='en'?'SW':'EN'}</span>
              </button>
              <button onClick={() => setDarkMode(!darkMode)} style={iconBtn} title="Toggle Dark Mode">
                <i className={`fa-solid ${darkMode?'fa-sun':'fa-moon'}`}/>
              </button>
            </div>

            {user && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:8,paddingLeft:8,borderLeft:`1px solid ${darkMode?'#334155':'#e5e7eb'}`}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#16a34a,#15803d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:700,flexShrink:0}}>
                  {(user.name||'U')[0].toUpperCase()}
                </div>
                <span style={{fontSize:'0.82rem',color:darkMode?'#94a3b8':'#374151',fontWeight:500}} className="hide-xs">
                  {user.name?.split(' ')[0]}
                </span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  <i className="fa-solid fa-right-from-bracket"/>
                </button>
              </div>
            )}
          </div>

          <button onClick={()=>setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{
            display:'none',background:'none',border:'none',cursor:'pointer',
            color:darkMode?'#f1f5f9':'#374151',fontSize:'1.2rem',padding:6,borderRadius:6,
          }}>
            <i className={`fa-solid ${menuOpen?'fa-xmark':'fa-bars'}`}/>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position:'fixed',top:60,left:0,right:0,
          background:darkMode?'#1e293b':'white',
          borderBottom:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,
          zIndex:99,boxShadow:'0 8px 24px rgba(0,0,0,0.1)',
          padding:'0.75rem 1.25rem',display:'flex',flexDirection:'column',gap:4,
        }}>
          <div style={{display:'flex',gap:6,padding:'4px 0',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}`,marginBottom:4}}>
            <button onClick={()=>setLang(lang==='en'?'sw':'en')} style={{...iconBtn,flex:1,justifyContent:'center'}}>
              <i className="fa-solid fa-language"/>{lang==='en'?'Kiswahili':'English'}
            </button>
            <button onClick={()=>setDarkMode(!darkMode)} style={{...iconBtn,flex:1,justifyContent:'center'}}>
              <i className={`fa-solid ${darkMode?'fa-sun':'fa-moon'}`}/>{darkMode?'Light':'Dark'}
            </button>
          </div>
          {!user ? (
            <>
              <Link to="/" onClick={()=>setMenuOpen(false)} style={navLinkStyle(location.pathname==='/')}>
                <i className="fa-solid fa-house"/>{t.home}
              </Link>
              <Link to="/login" onClick={()=>setMenuOpen(false)} style={navLinkStyle(false)}>
                <i className="fa-solid fa-right-to-bracket"/>{t.signIn}
              </Link>
              <Link to="/register" onClick={()=>setMenuOpen(false)} style={navLinkStyle(false)}>
                <i className="fa-solid fa-user-plus"/>{t.getStarted}
              </Link>
            </>
          ) : !onAdmin ? (
            <>
              {user.role==='ADMIN' && (
                <Link to="/admin" onClick={()=>setMenuOpen(false)} style={navLinkStyle(isActive('/admin'))}>
                  <i className="fa-solid fa-gear"/>{t.admin}
                </Link>
              )}
            </>
          ) : null}
          {user && (
            <button onClick={handleLogout} style={{...navLinkStyle(false),border:'none',background:'none',cursor:'pointer',color:'#dc2626',marginTop:4,borderTop:`1px solid ${darkMode?'#334155':'#f3f4f6'}`,paddingTop:10}}>
              <i className="fa-solid fa-right-from-bracket"/>{t.logout}
            </button>
          )}
        </div>
      )}
      <style>{`
        @media(max-width:640px){.desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}}
        @media(max-width:480px){.hide-xs{display:none}}
      `}</style>
    </>
  );
}