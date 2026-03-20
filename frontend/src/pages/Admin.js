import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useUI } from '../App';
import api from '../api';

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;

// ── Admin translations ────────────────────────────────────────────────────────
const AT = {
  en: {
    overview:'Overview', users:'Users', knowledge:'AI Knowledge', analytics:'Analytics',
    ml:'ML Engine', feedback:'Feedback', audit:'Audit Logs', online:'Online',
    logout:'Logout', console:'Admin Console', administrator:'Administrator',
    // Overview
    registeredUsers:'Registered Users', aiAnalyses:'AI Analyses Run',
    hospitalsListed:'Hospitals Listed', activeDeficiencies:'Active Deficiencies',
    recentAnalyses:'Recent User Analyses', refresh:'Refresh', noAnalyses:'No analyses yet.',
    // System status
    systemStatus:'System Status',
    // Users
    users_label:'Users', searchUsers:'Search users...', never:'Never',
    user:'User', role:'Role', analyses:'Analyses', lastActive:'Last Active', actions:'Actions',
    noUsers:'No users found.', deleteUserMsg:(n)=>`Delete ${n}? This removes all their data permanently.`,
    updated:'Updated!', saveFailed:'Save failed',
    // Forms
    fullName:'Full Name', email:'Email', roleLbl:'Role', age:'Age', bloodGroup:'Blood Group',
    newPassword:'New Password', passwordHint:'Leave blank to keep current',
    allergies:'Allergies', chronicConds:'Chronic Conditions',
    cancel:'Cancel', save:'Save', delete:'Delete', edit:'Edit', view:'View',
    close:'Close', confirm:'Confirm', retry:'Retry',
    // Knowledge
    knowledge10:'10 Deficiencies in Knowledge Base', addDeficiency:'+ Add Deficiency',
    editKnowledge:'Edit the AI knowledge base directly - changes take effect immediately.',
    // Analytics
    totalAnalyses:'Total Analyses', newRegistrations:'New Registrations (30d)',
    appointments:'Appointments', aiFeedback:'AI Feedback', topDeficiencies:'Top Deficiencies',
    engineBreakdown:'Engine Breakdown', recentAppointments:'Recent Appointments', noAppointments:'No appointments yet.',
    userBreakdown:'User Breakdown',
    // ML
    mlEngine:'ML Engine', currentEngine:'CURRENT ENGINE', feedbackReceived:'FEEDBACK RECEIVED',
    helpful:'helpful', total:'total', modelInfo:'Model Information', howMLWorks:'How the ML Engine Works',
    retrainModel:'Retrain Model', mlSuccess:'Model retrained successfully!',
    // Feedback
    totalFeedback:'Total Feedback', helpful2:'Helpful', notHelpful:'Not Helpful',
    satisfaction:'Satisfaction', user2:'USER', predicted:'PREDICTED', correction:'CORRECTION',
    helpful3:'HELPFUL', comment:'COMMENT', date:'DATE', userFeedback:'User Feedback on AI Predictions',
    // Audit
    auditLogs:'Audit Logs', filterAudit:'Filter by action or user...',
    time:'TIME', user3:'USER', action:'ACTION', details:'DETAILS',
  },
  sw: {
    overview:'Muhtasari', users:'Watumiaji', knowledge:'Maarifa ya AI', analytics:'Uchambuzi',
    ml:'Injini ya ML', feedback:'Maoni', audit:'Kumbukumbu', online:'Mtandaoni',
    logout:'Toka', console:'Dashibodi ya Msimamizi', administrator:'Msimamizi',
    registeredUsers:'Watumiaji Waliojisajili', aiAnalyses:'Uchambuzi wa AI Uliofanywa',
    hospitalsListed:'Hospitali Zilizoorodheshwa', activeDeficiencies:'Upungufu Amilifu',
    recentAnalyses:'Uchambuzi wa Hivi Karibuni', refresh:'Onyesha Upya', noAnalyses:'Hakuna uchambuzi bado.',
    systemStatus:'Hali ya Mfumo',
    users_label:'Watumiaji', searchUsers:'Tafuta watumiaji...', never:'Kamwe',
    user:'Mtumiaji', role:'Jukumu', analyses:'Uchambuzi', lastActive:'Mwisho Amilifu', actions:'Vitendo',
    noUsers:'Hakuna watumiaji walioopatikana.', deleteUserMsg:(n)=>`Futa ${n}? Hii huondoa data yao yote kabisa.`,
    updated:'Imesasishwa!', saveFailed:'Imeshindwa kuhifadhi',
    fullName:'Jina Kamili', email:'Barua Pepe', roleLbl:'Jukumu', age:'Umri', bloodGroup:'Kundi la Damu',
    newPassword:'Nenosiri Jipya', passwordHint:'Acha wazi kudumisha ya sasa',
    allergies:'Mzio', chronicConds:'Magonjwa ya Kudumu',
    cancel:'Ghairi', save:'Hifadhi', delete:'Futa', edit:'Hariri', view:'Tazama',
    close:'Funga', confirm:'Thibitisha', retry:'Jaribu Tena',
    knowledge10:'Upungufu 10 katika Msingi wa Maarifa', addDeficiency:'+ Ongeza Upungufu',
    editKnowledge:'Hariri msingi wa maarifa wa AI moja kwa moja - mabadiliko yanaathiri mara moja.',
    totalAnalyses:'Jumla ya Uchambuzi', newRegistrations:'Wasajili Wapya (Siku 30)',
    appointments:'Miadi', aiFeedback:'Maoni ya AI', topDeficiencies:'Upungufu wa Juu',
    engineBreakdown:'Muhtasari wa Injini', recentAppointments:'Miadi ya Hivi Karibuni', noAppointments:'Hakuna miadi bado.',
    userBreakdown:'Muhtasari wa Watumiaji',
    mlEngine:'Injini ya ML', currentEngine:'INJINI YA SASA', feedbackReceived:'MAONI YALIYOPOKELEWA',
    helpful:'ya kusaidia', total:'jumla', modelInfo:'Taarifa za Mfano', howMLWorks:'Jinsi Injini ya ML Inavyofanya Kazi',
    retrainModel:'Fundisha Upya Mfano', mlSuccess:'Mfano umefunzwa upya!',
    totalFeedback:'Jumla ya Maoni', helpful2:'Ya Kusaidia', notHelpful:'Haisaidii',
    satisfaction:'Kuridhika', user2:'MTUMIAJI', predicted:'UTABIRI', correction:'MAREKEBISHO',
    helpful3:'KUSAIDIA', comment:'MAONI', date:'TAREHE', userFeedback:'Maoni ya Watumiaji kuhusu Utabiri wa AI',
    auditLogs:'Kumbukumbu za Ukaguzi', filterAudit:'Chuja kwa kitendo au mtumiaji...',
    time:'WAKATI', user3:'MTUMIAJI', action:'KITENDO', details:'MAELEZO',
  }
};

// Helper: get admin translation
const useAT = () => {
  const { lang } = useUI();
  return AT[lang] || AT.en;
};

// Deficiency name SW map (for admin trends/overview)
const SW_DEF_FULL = {
  'Iron Deficiency Anaemia':'Upungufu wa Chuma',
  'Iron Deficiency Anemia':'Upungufu wa Chuma',
  'Vitamin A Deficiency':'Upungufu wa Vitamini A',
  'Vitamin D Deficiency':'Upungufu wa Vitamini D',
  'Vitamin B12 Deficiency':'Upungufu wa Vitamini B12',
  'Folate (Vitamin B9) Deficiency':'Upungufu wa Folate (B9)',
  'Folate Deficiency':'Upungufu wa Folate (B9)',
  'Iodine Deficiency':'Upungufu wa Iodini',
  'Zinc Deficiency':'Upungufu wa Zinki',
  'Calcium Deficiency':'Upungufu wa Kalsiamu',
  'Vitamin C Deficiency (Scurvy)':'Upungufu wa Vitamini C',
  'Vitamin C Deficiency':'Upungufu wa Vitamini C',
  'Protein Deficiency (Kwashiorkor)':'Upungufu wa Protini (Kwashiorkor)',
  'Protein Deficiency':'Upungufu wa Protini',
};
const swDef = (name, lang) => lang === 'sw' ? (SW_DEF_FULL[name] || name) : name;

const ADMIN_TABS = [
  { key:'overview',      icon:'fa-chart-line',   label:'Overview'      },
  { key:'users',         icon:'fa-users',        label:'Users'         },
  { key:'knowledge',     icon:'fa-brain',        label:'AI Knowledge'  },
  { key:'analytics',     icon:'fa-chart-bar',    label:'Analytics'     },
  { key:'ml',            icon:'fa-robot',        label:'ML Engine'     },
  { key:'feedback',      icon:'fa-star',         label:'Feedback'      },
  { key:'audit',         icon:'fa-shield-halved',label:'Audit Logs'    },
];

const ROLES         = ['USER','ADMIN','HEALTHCARE_PRO'];
const BLOOD_GROUPS  = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const HOSPITAL_TYPES = ['government','private','mission','clinic'];
const SEVERITIES    = ['Mild','Mild-Moderate','Moderate','Moderate-Severe','Severe'];
const FA_ICONS      = [
  'fa-droplet','fa-eye','fa-sun','fa-brain','fa-seedling','fa-shield-halved',
  'fa-shield','fa-bone','fa-lemon','fa-dumbbell','fa-heart','fa-lungs',
  'fa-circle-dot','fa-stethoscope','fa-pills','fa-flask',
];
const COLORS = [
  '#dc2626','#d97706','#f59e0b','#0891b2','#16a34a','#7c3aed',
  '#0f766e','#64748b','#ea580c','#b45309','#db2777','#0284c7',
];

// ── Reusable Modal ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  const { darkMode } = useUI();
  const s = darkMode ? '#1e293b' : '#fff';
  const b = darkMode ? '#334155' : '#e5e7eb';
  const tx = darkMode ? '#f1f5f9' : '#111827';
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,
                  display:'flex',alignItems:'flex-end',justifyContent:'center',
                  padding:'0' }}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-inner" style={{
        background:s, borderRadius:'16px 16px 0 0', width:'100%',
        maxWidth: wide ? 680 : 520, maxHeight:'90vh', overflow:'auto',
        boxShadow:'0 -4px 40px rgba(0,0,0,0.2)', color:tx,
      }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:`1px solid ${b}`,
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      position:'sticky',top:0,background:s,borderBottom:`1px solid ${b}`,zIndex:1 }}>
          <h3 style={{ fontSize:'1rem',fontWeight:700,fontFamily:'Outfit,sans-serif' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',
                                             color:'#6b7280',fontSize:'1.1rem',width:30,height:30,
                                             borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <I c="fa-xmark"/>
          </button>
        </div>
        <div style={{ padding:'1.25rem' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function Confirm({ msg, onConfirm, onCancel }) {
  const at = useAT();
  return (
    <Modal title={at.confirm} onClose={onCancel}>
      <div style={{ textAlign:'center' }}>
        <I c="fa-triangle-exclamation" style={{ fontSize:'2rem',color:'#dc2626',marginBottom:12,display:'block' }}/>
        <p style={{ fontSize:'0.875rem',color:'#374151',marginBottom:16 }}>{msg}</p>
        <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
          <button className="btn btn-ghost" onClick={onCancel}>{at.cancel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <I c="fa-trash" style={{marginRight:6}}/>{at.delete}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────
function FormField({ label, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize:'0.7rem',color:'#9ca3af',marginTop:3 }}>{hint}</div>}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const rowBg = darkMode ? '#0f172a' : '#f9fafb';
  const rowBorder = darkMode ? '#334155' : '#f1f1f1';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true); setErr('');
    api.get('/api/admin/stats')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(e => { setErr(`${at.retry}: ${e.response?.data?.error||e.message}`); setLoading(false); });
  },[at]);
  useEffect(()=>{ load(); },[load]);

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;
  if (err) return <div className="alert alert-error">{err} <button className="btn btn-ghost btn-sm" onClick={load} style={{marginLeft:8}}>{at.retry}</button></div>;

  const CARDS = [
    { label:at.registeredUsers,   value:stats.users,         color:'#16a34a', icon:'fa-users'       },
    { label:at.aiAnalyses,        value:stats.analyses,      color:'#0891b2', icon:'fa-stethoscope'  },
    { label:at.hospitalsListed,   value:stats.hospitals,     color:'#d97706', icon:'fa-hospital'     },
    { label:at.activeDeficiencies,value:stats.deficiencies,  color:'#7c3aed', icon:'fa-brain'        },
  ];

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12 }}>
        {CARDS.map(c => (
          <div key={c.label} className="card" style={{ textAlign:'center',border:`1px solid ${c.color}20`,padding:'1.25rem' }}>
            <I c={c.icon} style={{ fontSize:'1.5rem',color:c.color,marginBottom:8,display:'block' }}/>
            <div style={{ fontSize:'2rem',fontWeight:800,fontFamily:'Fraunces,serif',color:c.color,lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:'0.75rem',color:'#6b7280',fontWeight:600,marginTop:4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8 }}>
          <h4 style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>
            <I c="fa-clock-rotate-left" style={{ marginRight:8,color:'#16a34a' }}/>{at.recentAnalyses}
          </h4>
          <button onClick={load} className="btn btn-ghost btn-sm"><I c="fa-rotate" style={{marginRight:4}}/>{at.refresh}</button>
        </div>
        {stats.recent?.length ? stats.recent.map(r => (
          <div key={r.id} style={{ padding:'10px 12px',background:rowBg,borderRadius:8,border:`1px solid ${rowBorder}`,marginBottom:8 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4,flexWrap:'wrap',gap:4 }}>
              <span style={{ fontSize:'0.8rem',fontWeight:600 }}>
                <I c="fa-user" style={{ marginRight:5,color:'#9ca3af' }}/>{r.user_name}
                <span style={{ color:'#9ca3af',fontWeight:400,marginLeft:4 }}>({r.email})</span>
              </span>
              <span style={{ fontSize:'0.72rem',color:'#9ca3af' }}>{new Date(r.timestamp).toLocaleString('en-KE')}</span>
            </div>
            <div style={{ fontSize:'0.82rem',fontStyle:'italic',marginBottom:6 }}>
              "{r.symptoms.substring(0,90)}{r.symptoms.length>90?'...':''}"
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
              {(r.results||[]).slice(0,3).map(res => (
                <span key={res.id} style={{ background:`${res.color}12`,color:res.color,border:`1px solid ${res.color}30`,borderRadius:12,padding:'1px 8px',fontSize:'0.7rem',fontWeight:700 }}>
                  {swDef(res.name, lang)} · {res.confidence}%
                </span>
              ))}
            </div>
          </div>
        )) : <p style={{ fontSize:'0.875rem' }}>{at.noAnalyses}</p>}
      </div>

      <SystemStatus/>
    </div>
  );
}

function SystemStatus() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const [health, setHealth] = useState(null);
  useEffect(()=>{
    api.get('/api/health').then(r=>setHealth({ok:true,...r.data})).catch(()=>setHealth({ok:false}));
  },[]);

  const statusLabel = (key, health) => {
    const sw = lang === 'sw';
    const map = {
      api:   [sw?'Mtandaoni':'Online', sw?'Nje ya mtandao':'Offline'],
      db:    [sw?`Imeunganishwa (watumiaji ${health?.registered_users||0})`:`Connected (${health?.registered_users||0} users)`, sw?'Imekatika':'Disconnected'],
      kb:    [sw?`Upungufu ${health?.active_deficiencies||0} amilifu`:`${health?.active_deficiencies||0} active deficiencies`, sw?'Haijulikani':'Unknown'],
      jseng: [sw?'Amilifu (inafanya kazi kwenye kivinjari)':'Active (runs in browser)', ''],
      osm:   [sw?'Bure - hakuna ufunguo wa API':'Free - no API key needed', ''],
      jwt:   [sw?'Imewezeshwa (muda wa token masaa 12)':'Enabled (12h token expiry)', ''],
    };
    return map[key][health?.ok ? 0 : 1] || '';
  };

  const rows = health ? [
    { label:'Flask API',         ok:health.ok, status:statusLabel('api', health)  },
    { label:'SQLite Database',   ok:health.ok, status:statusLabel('db', health)   },
    { label:lang==='sw'?'Msingi wa Maarifa ya AI':'AI Knowledge Base', ok:health.ok, status:statusLabel('kb', health) },
    { label:lang==='sw'?'Injini ya JS ya Dalili':'JS Symptom Engine', ok:true, status:statusLabel('jseng', health) },
    { label:'OpenStreetMap',     ok:true, status:statusLabel('osm', health) },
    { label:'JWT Auth',          ok:true, status:statusLabel('jwt', health) },
  ] : [];
  return (
    <div className="card">
      <h4 style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.95rem',marginBottom:'1rem' }}>
        <I c="fa-server" style={{ marginRight:8,color:'#16a34a' }}/>{at.systemStatus}
      </h4>
      {!health ? <div style={{textAlign:'center'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div> :
        rows.map(r=>(
          <div key={r.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}` }}>
            <span style={{ fontSize:'0.875rem' }}>{r.label}</span>
            <span style={{ fontSize:'0.78rem',fontWeight:700,color:r.ok?'#16a34a':'#dc2626',display:'flex',alignItems:'center',gap:5 }}>
              <I c={r.ok?'fa-circle-check':'fa-circle-xmark'}/>{r.status}
            </span>
          </div>
        ))
      }
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function Users() {
  const at = useAT();
  const { darkMode } = useUI();
  const tblBg = darkMode ? '#1e293b' : '#fff';
  const tblBorder = darkMode ? '#334155' : '#e5e7eb';
  const evenRow = darkMode ? '#243350' : '#fafafa';
  const oddRow  = darkMode ? '#1e293b' : 'white';
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editUser, setEditUser]   = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [confirm, setConfirm]     = useState(null);

  const load = useCallback(()=>{
    setLoading(true);
    api.get(`/api/admin/users${search?`?q=${encodeURIComponent(search)}`:''}`)
      .then(r=>{ setUsers(r.data); setLoading(false); })
      .catch(()=>setLoading(false));
  },[search]);
  useEffect(()=>{ load(); },[load]);

  const openDetail = async uid => {
    try { const r = await api.get(`/api/admin/users/${uid}`); setDetailUser(r.data); } catch {}
  };

  const save = async form => {
    setSaving(true); setMsg('');
    try { await api.put(`/api/admin/users/${form.id}`,form); setMsg('Updated!'); setEditUser(null); load(); }
    catch(e){ setMsg(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  };

  const del = async uid => {
    try { await api.delete(`/api/admin/users/${uid}`); setConfirm(null); load(); }
    catch(e){ alert(e.response?.data?.error||'Delete failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',gap:8,flexWrap:'wrap' }}>
        <h4 style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>
          <I c="fa-users" style={{ marginRight:8,color:'#16a34a' }}/>{users.length} {at.users_label}
        </h4>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <I c="fa-magnifying-glass" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'0.8rem' }}/>
            <input className="form-input" value={search} onChange={e=>setSearch(e.target.value)}
                   placeholder={at.searchUsers} style={{ paddingLeft:30,width:200 }}/>
          </div>
          <button onClick={load} className="btn btn-ghost btn-sm"><I c="fa-rotate" style={{marginRight:4}}/>{at.refresh}</button>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{marginBottom:'1rem'}}>{msg}</div>}

      {loading ? <div style={{textAlign:'center',padding:'2rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div> : (
        <div style={{ background:tblBg,borderRadius:12,border:`1px solid ${tblBorder}`,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead style={{ background:darkMode?'#0f172a':'#f9fafb' }}>
              <tr>{[at.user,at.role,at.analyses,at.lastActive,at.actions].map(h=>(
                <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:darkMode?'#64748b':'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`1px solid ${tblBorder}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id} style={{ background:i%2?evenRow:oddRow }}
                    onMouseEnter={e=>e.currentTarget.style.background=darkMode?'#334155':'#f0fdf4'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2?evenRow:oddRow}>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:28,height:28,borderRadius:'50%',background:u.role==='ADMIN'?'linear-gradient(135deg,#dc2626,#b91c1c)':'linear-gradient(135deg,#16a34a,#15803d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.75rem',fontWeight:700,flexShrink:0 }}>
                        {(u.name||'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:'0.875rem',fontWeight:600 }}>{u.name}</div>
                        <div style={{ fontSize:'0.72rem',color:darkMode?'#64748b':'#9ca3af' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <span style={{ background:u.role==='ADMIN'?(darkMode?'#1c0808':'#fef2f2'):(darkMode?'#052e16':'#f0fdf4'),color:u.role==='ADMIN'?'#dc2626':'#16a34a',borderRadius:8,padding:'2px 8px',fontSize:'0.7rem',fontWeight:700 }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'10px 14px',fontSize:'0.875rem',fontWeight:600,borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>{u.analyses_count}</td>
                  <td style={{ padding:'10px 14px',fontSize:'0.75rem',color:darkMode?'#64748b':'#6b7280',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    {u.last_active ? new Date(u.last_active).toLocaleDateString('en-KE') : <span style={{color:darkMode?'#334155':'#d1d5db'}}>{at.never}</span>}
                  </td>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <div style={{ display:'flex',gap:4 }}>
                      <button onClick={()=>openDetail(u.id)} title={at.view} style={{ background:darkMode?'#052e16':'#f0fdf4',border:'1px solid #bbf7d0',color:'#16a34a',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}><I c="fa-eye"/></button>
                      <button onClick={()=>setEditUser({...u,password:''})} title={at.edit} style={{ background:darkMode?'#1e3a5f':'#eff6ff',border:'1px solid #bfdbfe',color:darkMode?'#60a5fa':'#1d4ed8',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}><I c="fa-pen"/></button>
                      <button onClick={()=>setConfirm({id:u.id,name:u.name})} title={at.delete} style={{ background:darkMode?'#1c0808':'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}><I c="fa-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <div style={{ textAlign:'center',padding:'2rem',fontSize:'0.875rem' }}>{at.noUsers}</div>}
        </div>
      )}

      {editUser && (
        <Modal title={`${at.edit} - ${editUser.name}`} onClose={()=>setEditUser(null)}>
          <UserForm user={editUser} saving={saving} msg={msg} onSave={save} onCancel={()=>setEditUser(null)}/>
        </Modal>
      )}
      {detailUser && (
        <Modal title={at.view} onClose={()=>setDetailUser(null)}>
          <UserDetail data={detailUser} onEdit={u=>{setDetailUser(null);setEditUser({...u,password:''});}}/>
        </Modal>
      )}
      {confirm && <Confirm msg={at.deleteUserMsg(confirm.name)} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

function UserForm({ user, saving, msg, onSave, onCancel }) {
  const at = useAT();
  const [f, setF] = useState({...user});
  const s = k => e => setF(x=>({...x,[k]:e.target.value}));
  return (
    <div>
      {msg && <div className={`alert ${msg===at.updated?'alert-success':'alert-error'}`} style={{marginBottom:'1rem'}}>{msg}</div>}
      <FormField label={at.fullName}><input className="form-input" value={f.name||''} onChange={s('name')} required/></FormField>
      <FormField label={at.email}><input type="email" className="form-input" value={f.email||''} onChange={s('email')} required/></FormField>
      <div className="grid-2">
        <FormField label={at.roleLbl}>
          <select className="form-input" value={f.role||'USER'} onChange={s('role')}>
            {ROLES.map(r=><option key={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label={at.age}><input type="number" className="form-input" value={f.age||''} onChange={s('age')} min="1" max="120"/></FormField>
      </div>
      <div className="grid-2">
        <FormField label={at.bloodGroup}>
          <select className="form-input" value={f.blood_group||''} onChange={s('blood_group')}>
            <option value="">{at.cancel.includes('Ghairi') ? 'Haijulikani' : 'Unknown'}</option>
            {BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
          </select>
        </FormField>
        <FormField label={at.newPassword} hint={at.passwordHint}>
          <input type="password" className="form-input" value={f.password||''} onChange={s('password')} placeholder="••••••" minLength={6}/>
        </FormField>
      </div>
      <FormField label={at.allergies}><input className="form-input" value={f.allergies||''} onChange={s('allergies')}/></FormField>
      <FormField label={at.chronicConds}><input className="form-input" value={f.chronic_conditions||''} onChange={s('chronic_conditions')}/></FormField>
      <div style={{ display:'flex',gap:8,marginTop:'0.5rem' }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1,justifyContent:'center' }}>{at.cancel}</button>
        <button className="btn btn-primary" onClick={()=>onSave(f)} disabled={saving} style={{ flex:2,justifyContent:'center' }}>
          {saving ? `${at.save}…` : <><I c="fa-floppy-disk" style={{marginRight:6}}/>{at.save}</>}
        </button>
      </div>
    </div>
  );
}

function UserDetail({ data, onEdit }) {
  const { user, analyses } = data;
  const { darkMode } = useUI();
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:'1rem',padding:'0.9rem',background:darkMode?'#0f172a':'#f9fafb',borderRadius:10,border:`1px solid ${darkMode?'#334155':'#e5e7eb'}` }}>
        <div style={{ width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#16a34a,#15803d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'1.1rem',flexShrink:0 }}>
          {(user.name||'U')[0].toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700 }}>{user.name}</div>
          <div style={{ fontSize:'0.8rem',color:darkMode?'#64748b':'#6b7280' }}>{user.email}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={()=>onEdit(user)}><I c="fa-pen" style={{marginRight:5}}/>Edit</button>
      </div>
      <p style={{ fontSize:'0.78rem',color:darkMode?'#64748b':'#6b7280',marginBottom:'0.75rem' }}>
        <I c="fa-stethoscope" style={{marginRight:5}}/>Last {analyses.length} analyses:
      </p>
      {analyses.map(a=>(
        <div key={a.id} style={{ padding:'8px 12px',background:darkMode?'#0f172a':'#f9fafb',border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,borderRadius:8,marginBottom:8 }}>
          <div style={{ fontSize:'0.72rem',color:darkMode?'#475569':'#9ca3af',marginBottom:2 }}>{new Date(a.timestamp).toLocaleString('en-KE')}</div>
          <div style={{ fontSize:'0.82rem',fontStyle:'italic',color:darkMode?'#cbd5e1':'#374151',marginBottom:4 }}>"{a.symptoms.substring(0,80)}..."</div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
            {(a.results||[]).map(r=>(
              <span key={r.id} style={{ background:`${r.color}12`,color:r.color,border:`1px solid ${r.color}30`,borderRadius:10,padding:'1px 7px',fontSize:'0.68rem',fontWeight:700 }}>
                {r.name} {r.confidence}%
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hospitals ─────────────────────────────────────────────────────────────────
const BLANK_H = { name:'',address:'',latitude:'',longitude:'',phone:'',type:'government',services:'',emergency:false };

function Hospitals() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [edit, setEdit]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [confirm, setConfirm] = useState(null);
  const { darkMode } = useUI();
  const tblBg = darkMode ? '#1e293b' : '#fff';
  const tblBorder = darkMode ? '#334155' : '#e5e7eb';
  const evenRow = darkMode ? '#243350' : '#fafafa';
  const oddRow  = darkMode ? '#1e293b' : 'white';

  const load = useCallback(()=>{
    setLoading(true);
    api.get(`/api/hospitals${search?`?q=${encodeURIComponent(search)}`:''}`)
      .then(r=>{ setList(r.data); setLoading(false); })
      .catch(()=>setLoading(false));
  },[search]);
  useEffect(()=>{ load(); },[load]);

  const save = async form => {
    setSaving(true); setMsg('');
    try {
      const payload = { ...form, emergency:!!form.emergency,
        services: typeof form.services==='string' ? form.services.split(',').map(s=>s.trim()).filter(Boolean) : form.services };
      form.id ? await api.put(`/api/hospitals/${form.id}`,payload) : await api.post('/api/hospitals',payload);
      setMsg(form.id?'Hospital updated!':'Hospital added!'); setEdit(null); load();
    } catch(e){ setMsg(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  };

  const del = async id => {
    try { await api.delete(`/api/hospitals/${id}`); setConfirm(null); load(); }
    catch(e){ alert(e.response?.data?.error||'Delete failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',gap:8,flexWrap:'wrap' }}>
        <h4 style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>
          <I c="fa-hospital" style={{ marginRight:8,color:'#16a34a' }}/>{list.length} Hospitals
        </h4>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <I c="fa-magnifying-glass" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'0.8rem' }}/>
            <input className="form-input" value={search} onChange={e=>setSearch(e.target.value)}
                   placeholder="Search hospitals..." style={{ paddingLeft:30,width:180 }}/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setEdit({...BLANK_H})}>
            <I c="fa-plus" style={{marginRight:5}}/>Add
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{marginBottom:'1rem'}}>{msg}</div>}

      {loading ? <div style={{textAlign:'center',padding:'2rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div> : (
        <div style={{ background:tblBg,borderRadius:12,border:`1px solid ${tblBorder}`,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead style={{ background:darkMode?'#0f172a':'#f9fafb' }}>
              <tr>{['Name','Type','Phone','Emerg.','Actions'].map(h=>(
                <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:darkMode?'#64748b':'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`1px solid ${tblBorder}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {list.map((h,i)=>(
                <tr key={h.id} style={{ background:i%2?evenRow:oddRow }}
                    onMouseEnter={e=>e.currentTarget.style.background=darkMode?'#334155':'#f0fdf4'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2?evenRow:oddRow}>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <div style={{ fontWeight:600,fontSize:'0.875rem' }}>{h.name}</div>
                    <div style={{ fontSize:'0.72rem',color:darkMode?'#64748b':'#9ca3af' }}>{h.address}</div>
                  </td>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <span style={{ background:h.type==='private'?(darkMode?'#052e16':'#dcfce7'):(darkMode?'#1e3a5f':'#dbeafe'),color:h.type==='private'?'#16a34a':(darkMode?'#60a5fa':'#1d4ed8'),borderRadius:8,padding:'2px 8px',fontSize:'0.7rem',fontWeight:700,textTransform:'capitalize' }}>{h.type}</span>
                  </td>
                  <td style={{ padding:'10px 14px',fontSize:'0.8rem',color:darkMode?'#cbd5e1':'#374151',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>{h.phone}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <I c={h.emergency?'fa-circle-check':'fa-circle-xmark'} style={{ color:h.emergency?'#16a34a':'#d1d5db' }}/>
                  </td>
                  <td style={{ padding:'10px 14px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}` }}>
                    <div style={{ display:'flex',gap:4 }}>
                      <button onClick={()=>setEdit({...h,services:Array.isArray(h.services)?h.services.join(', '):(()=>{try{return JSON.parse(h.services||'[]').join(', ');}catch{return '';}})()})}
                              style={{ background:darkMode?'#1e3a5f':'#eff6ff',border:'1px solid #bfdbfe',color:darkMode?'#60a5fa':'#1d4ed8',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}><I c="fa-pen"/></button>
                      <button onClick={()=>setConfirm({id:h.id,name:h.name})}
                              style={{ background:darkMode?'#1c0808':'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}><I c="fa-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <div style={{ textAlign:'center',padding:'2rem',color:darkMode?'#64748b':'#6b7280',fontSize:'0.875rem' }}>No hospitals found.</div>}
        </div>
      )}

      {edit!==null && (
        <Modal title={edit.id?`Edit - ${edit.name}`:'Add New Hospital'} onClose={()=>setEdit(null)}>
          <HospitalForm h={edit} saving={saving} msg={msg} onSave={save} onCancel={()=>setEdit(null)}/>
        </Modal>
      )}
      {confirm && <Confirm msg={`Delete ${confirm.name}?`} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

function HospitalForm({ h, saving, msg, onSave, onCancel }) {
  const [f, setF] = useState({...h});
  const s = k => e => setF(x=>({...x,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
  return (
    <div>
      {msg && <div className={`alert ${msg.includes('!')?'alert-success':'alert-error'}`} style={{marginBottom:'1rem'}}>{msg}</div>}
      <FormField label="Hospital Name *"><input className="form-input" value={f.name||''} onChange={s('name')} required/></FormField>
      <FormField label="Address"><input className="form-input" value={f.address||''} onChange={s('address')}/></FormField>
      <div className="grid-2">
        <FormField label="Latitude *" hint="e.g. -1.3048"><input type="number" step="any" className="form-input" value={f.latitude||''} onChange={s('latitude')} required/></FormField>
        <FormField label="Longitude *" hint="e.g. 36.8156"><input type="number" step="any" className="form-input" value={f.longitude||''} onChange={s('longitude')} required/></FormField>
      </div>
      <div style={{ fontSize:'0.72rem',color:'#9ca3af',marginTop:-8,marginBottom:12 }}>
        <I c="fa-circle-info" style={{marginRight:4}}/>Find coordinates at <a href="https://www.latlong.net/" target="_blank" rel="noreferrer" style={{color:'#16a34a'}}>latlong.net</a>
      </div>
      <div className="grid-2">
        <FormField label="Phone"><input className="form-input" value={f.phone||''} onChange={s('phone')}/></FormField>
        <FormField label="Type">
          <select className="form-input" value={f.type||'government'} onChange={s('type')}>
            {HOSPITAL_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Services" hint="Comma-separated, e.g. Emergency, Surgery, ICU">
        <input className="form-input" value={f.services||''} onChange={s('services')}/>
      </FormField>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:'1rem' }}>
        <input type="checkbox" id="emerg" checked={!!f.emergency} onChange={s('emergency')} style={{ width:16,height:16,accentColor:'#16a34a' }}/>
        <label htmlFor="emerg" style={{ fontSize:'0.875rem',fontWeight:500,cursor:'pointer' }}>24-hour Emergency Service</label>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1,justifyContent:'center' }}>{lang==='sw'?'Ghairi':'Cancel'}</button>
        <button className="btn btn-primary" onClick={()=>onSave(f)} disabled={saving||!f.name||!f.latitude||!f.longitude} style={{ flex:2,justifyContent:'center' }}>
          {saving?'Saving...':<><I c="fa-floppy-disk" style={{marginRight:6}}/>{f.id?'Save Changes':'Add Hospital'}</>}
        </button>
      </div>
    </div>
  );
}

// ── AI Knowledge Base Editor ──────────────────────────────────────────────────
function Knowledge() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const rowBg = darkMode ? '#1e293b' : '#fff';
  const rowBorder = darkMode ? '#334155' : '#e5e7eb';
  const subBg = darkMode ? '#0f172a' : '#f9fafb';
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit]       = useState(null);    // null=closed, 'new'=add new
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [confirm, setConfirm] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(()=>{
    setLoading(true);
    api.get('/api/deficiencies')
      .then(r=>{ setList(r.data); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);
  useEffect(()=>{ load(); },[load]);

  const save = async form => {
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        symptoms:          arrFromText(form.symptoms),
        foods_recommended: arrFromText(form.foods_recommended),
        foods_avoid:       arrFromText(form.foods_avoid),
        tips:              arrFromText(form.tips),
        risk_groups:       arrFromText(form.risk_groups),
      };
      if (form._isNew) {
        await api.post('/api/deficiencies', payload);
        setMsg('Deficiency added!');
      } else {
        await api.put(`/api/deficiencies/${form.id}`, payload);
        setMsg('Deficiency updated!');
      }
      setEdit(null); load();
    } catch(e){ setMsg(e.response?.data?.error||'Save failed'); }
    setSaving(false);
  };

  const del = async id => {
    try { await api.delete(`/api/deficiencies/${id}`); setConfirm(null); load(); }
    catch(e){ alert(e.response?.data?.error||'Delete failed'); }
  };

  const toggle = async (def) => {
    try {
      await api.put(`/api/deficiencies/${def.id}`, { ...def, active: def.active ? 0 : 1,
        symptoms: def.symptoms, foods_recommended: def.foods_recommended,
        foods_avoid: def.foods_avoid, tips: def.tips, risk_groups: def.risk_groups });
      load();
    } catch {}
  };

  return (
    <div>
      <div style={{ padding:'0.75rem 1rem',background:darkMode?'#052e16':'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,marginBottom:'1rem',fontSize:'0.82rem',color:'#4ade80',display:'flex',gap:8,alignItems:'flex-start' }}>
        <I c="fa-circle-info" style={{marginTop:2,flexShrink:0}}/>
        <span>{lang==='sw'?'Hariri msingi wa maarifa wa AI moja kwa moja - hakuna msimbo unaohitajika. Mabadiliko yanaathiri mara moja.':'Edit the AI knowledge base directly from here - no coding needed. Changes take effect immediately.'}</span>
      </div>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8 }}>
        <h4 style={{ fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.95rem' }}>
          <I c="fa-brain" style={{ marginRight:8,color:'#16a34a' }}/>{list.length} Deficiencies in Knowledge Base
        </h4>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={load} className="btn btn-ghost btn-sm"><I c="fa-rotate" style={{marginRight:4}}/>Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setEdit({
            _isNew:true, id:'', name:'', icon:'fa-circle-dot', color:'#16a34a', bg:'#f0fdf4',
            icd:'', severity:'Moderate', kenya_stat:'',
            symptoms:'', foods_recommended:'', foods_avoid:'',
            tips:'', supplement:'', risk_groups:'', when_to_see_doctor:'', active:1
          })}>
            <I c="fa-plus" style={{marginRight:5}}/>Add Deficiency
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success" style={{marginBottom:'1rem'}}>{msg}</div>}

      {loading ? <div style={{textAlign:'center',padding:'2rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div> :
        list.map(d => (
          <div key={d.id} style={{ background:rowBg,border:`1.5px solid ${rowBorder}`,borderRadius:12,marginBottom:10,overflow:'hidden' }}>
            <div style={{ padding:'0.9rem 1rem',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
              {/* Icon + color swatch */}
              <div style={{ width:36,height:36,borderRadius:10,background:d.bg||'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1.5px solid ${d.color}30` }}>
                <I c={d.icon||'fa-circle-dot'} style={{ color:d.color,fontSize:'1rem' }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:700,fontSize:'0.9rem',color:d.color }}>{d.name}</div>
                <div style={{ fontSize:'0.7rem',color:darkMode?'#64748b':'#6b7280' }}>
                  ICD {d.icd} · {d.severity} · {(d.symptoms||[]).length} symptoms · {d.active?'Active':'Disabled'}
                </div>
              </div>
              <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
                {/* Active toggle */}
                <button onClick={()=>toggle(d)} title={d.active?'Disable':'Enable'}
                        style={{ background:d.active?(darkMode?'#052e16':'#f0fdf4'):(darkMode?'#1e293b':'#f9fafb'),border:`1px solid ${d.active?'#bbf7d0':(darkMode?'#334155':'#e5e7eb')}`,color:d.active?'#16a34a':(darkMode?'#64748b':'#9ca3af'),borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:'0.72rem',fontWeight:600 }}>
                  {d.active ? <><I c="fa-toggle-on" style={{marginRight:4}}/>On</> : <><I c="fa-toggle-off" style={{marginRight:4}}/>Off</>}
                </button>
                <button onClick={()=>setExpanded(expanded===d.id?null:d.id)} style={{ background:darkMode?'#1e293b':'#f9fafb',border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,color:darkMode?'#94a3b8':'#6b7280',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}>
                  <I c={expanded===d.id?'fa-chevron-up':'fa-chevron-down'}/>
                </button>
                <button onClick={()=>setEdit({...d,
                  symptoms:          arrToText(d.symptoms),
                  foods_recommended: arrToText(d.foods_recommended),
                  foods_avoid:       arrToText(d.foods_avoid),
                  tips:              arrToText(d.tips),
                  risk_groups:       arrToText(d.risk_groups),
                })} style={{ background:darkMode?'#1e3a5f':'#eff6ff',border:'1px solid #bfdbfe',color:darkMode?'#60a5fa':'#1d4ed8',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}>
                  <I c="fa-pen"/>
                </button>
                <button onClick={()=>setConfirm({id:d.id,name:d.name})}
                        style={{ background:darkMode?'#1c0808':'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:'0.75rem' }}>
                  <I c="fa-trash"/>
                </button>
              </div>
            </div>

            {/* Expanded view */}
            {expanded === d.id && (
              <div style={{ padding:'0 1rem 1rem',borderTop:`1px solid ${darkMode?'#334155':'#f3f4f6'}` }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:12 }}>
                  <div>
                    <div style={{ fontSize:'0.7rem',fontWeight:700,color:darkMode?'#64748b':'#6b7280',textTransform:'uppercase',marginBottom:6 }}>Kenya Stat</div>
                    <div style={{ fontSize:'0.82rem',color:darkMode?'#cbd5e1':'#374151' }}>{d.kenya_stat||'-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.7rem',fontWeight:700,color:'#16a34a',textTransform:'uppercase',marginBottom:6 }}>Symptoms ({(d.symptoms||[]).length})</div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                      {(d.symptoms||[]).slice(0,8).map(s=>(
                        <span key={s} style={{ background:`${d.color}12`,color:d.color,borderRadius:8,padding:'2px 8px',fontSize:'0.68rem',border:`1px solid ${d.color}20` }}>{s}</span>
                      ))}
                      {(d.symptoms||[]).length>8 && <span style={{ fontSize:'0.68rem',color:darkMode?'#475569':'#9ca3af' }}>+{d.symptoms.length-8} more</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.7rem',fontWeight:700,color:'#d97706',textTransform:'uppercase',marginBottom:6 }}>Kenyan Foods ({(d.foods_recommended||[]).length})</div>
                    <div style={{ fontSize:'0.82rem',color:darkMode?'#cbd5e1':'#374151',lineHeight:1.7 }}>{(d.foods_recommended||[]).slice(0,3).join(', ')}{(d.foods_recommended||[]).length>3?', ...':''}</div>
                  </div>
                </div>
                <div style={{ marginTop:10,fontSize:'0.78rem',color:darkMode?'#94a3b8':'#6b7280',background:subBg,borderRadius:8,padding:'8px 12px' }}>
                  <strong>When to see doctor:</strong> {d.when_to_see_doctor||'-'}
                </div>
              </div>
            )}
          </div>
        ))
      }

      {edit !== null && (
        <Modal title={edit._isNew ? (lang==='sw'?'Ongeza Upungufu Mpya':'Add New Deficiency') : `${lang==='sw'?'Hariri':'Edit'} - ${edit.name}`} onClose={()=>setEdit(null)} wide>
          <DeficiencyForm f={edit} saving={saving} msg={msg} onSave={save} onCancel={()=>setEdit(null)}/>
        </Modal>
      )}
      {confirm && <Confirm msg={`Delete "${confirm.name}" from the knowledge base? This cannot be undone.`} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

function arrToText(arr) {
  if (!arr) return '';
  if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { return arr; } }
  return Array.isArray(arr) ? arr.join('\n') : '';
}
function arrFromText(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return v.split('\n').map(s=>s.trim()).filter(Boolean);
}

function DeficiencyForm({ f, saving, msg, onSave, onCancel }) {
  const { lang } = useUI();
  const [form, setForm] = useState({...f});
  const s = k => e => setForm(x=>({...x,[k]:e.target.value}));

  return (
    <div>
      {msg && <div className={`alert ${msg.includes('!')?'alert-success':'alert-error'}`} style={{marginBottom:'1rem'}}>{msg}</div>}
      <div className="grid-2">
        {form._isNew && (
          <FormField label="ID (unique, no spaces)" hint="e.g. vitamin_k, magnesium">
            <input className="form-input" value={form.id||''} onChange={s('id')} placeholder="e.g. vitamin_k" required/>
          </FormField>
        )}
        <FormField label="Name *"><input className="form-input" value={form.name||''} onChange={s('name')} required/></FormField>
      </div>

      <div className="grid-2">
        <FormField label="Icon" hint="Font Awesome class e.g. fa-droplet">
          <select className="form-input" value={form.icon||'fa-circle-dot'} onChange={s('icon')}>
            {FA_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}
          </select>
        </FormField>
        <FormField label="Color (hex)">
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <input type="color" value={form.color||'#16a34a'} onChange={e=>setForm(x=>({...x,color:e.target.value,bg:e.target.value+'15'}))}
                   style={{ width:40,height:38,border:'1px solid #e5e7eb',borderRadius:8,cursor:'pointer' }}/>
            <input className="form-input" value={form.color||''} onChange={s('color')} style={{ flex:1 }}/>
          </div>
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="ICD Code" hint="e.g. D50, E55"><input className="form-input" value={form.icd||''} onChange={s('icd')}/></FormField>
        <FormField label="Severity">
          <select className="form-input" value={form.severity||'Moderate'} onChange={s('severity')}>
            {SEVERITIES.map(sv=><option key={sv}>{sv}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Kenya Statistic" hint="e.g. Affects ~35% of women of reproductive age">
        <input className="form-input" value={form.kenya_stat||''} onChange={s('kenya_stat')}/>
      </FormField>

      <div className="grid-2">
        <FormField label="Symptoms" hint="One per line - these are what the AI matches against">
          <textarea className="form-input" value={form.symptoms||''} onChange={s('symptoms')} rows={6}
                    placeholder={"fatigue\ntiredness\npale\ndizzy\nhair loss"} style={{ resize:'vertical' }}/>
        </FormField>
        <FormField label="Kenyan Foods to Eat" hint="One per line">
          <textarea className="form-input" value={form.foods_recommended||''} onChange={s('foods_recommended')} rows={6}
                    placeholder={"Liver & offal\nOmena/dagaa\nSukuma wiki"} style={{ resize:'vertical' }}/>
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Foods / Things to Avoid" hint="One per line">
          <textarea className="form-input" value={form.foods_avoid||''} onChange={s('foods_avoid')} rows={4}
                    placeholder={"Tea/coffee within 1hr of meals"} style={{ resize:'vertical' }}/>
        </FormField>
        <FormField label="Tips" hint="One per line">
          <textarea className="form-input" value={form.tips||''} onChange={s('tips')} rows={4}
                    placeholder={"Take with citrus juice\nCook in cast iron pot"} style={{ resize:'vertical' }}/>
        </FormField>
      </div>

      <FormField label="Supplement Guidance">
        <input className="form-input" value={form.supplement||''} onChange={s('supplement')}
               placeholder="e.g. Ferrous sulphate 200mg daily - consult a doctor first"/>
      </FormField>

      <FormField label="Risk Groups" hint="One per line">
        <textarea className="form-input" value={form.risk_groups||''} onChange={s('risk_groups')} rows={3}
                  placeholder={"Pregnant women\nYoung children"} style={{ resize:'vertical' }}/>
      </FormField>

      <FormField label="When to See a Doctor">
        <input className="form-input" value={form.when_to_see_doctor||''} onChange={s('when_to_see_doctor')}
               placeholder="e.g. If symptoms persist beyond 2 weeks or are severe"/>
      </FormField>

      <div style={{ display:'flex',gap:8,marginTop:'0.5rem' }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1,justifyContent:'center' }}>{lang==='sw'?'Ghairi':'Cancel'}</button>
        <button className="btn btn-primary" onClick={()=>onSave(form)} disabled={saving||!form.name} style={{ flex:2,justifyContent:'center' }}>
          {saving?`${lang==='sw'?'Inahifadhi':'Saving'}...`:<><I c="fa-floppy-disk" style={{marginRight:6}}/>{form._isNew?(lang==='sw'?'Ongeza kwenye Msingi':'Add to Knowledge Base'):(lang==='sw'?'Hifadhi Mabadiliko':'Save Changes')}</>}
        </button>
      </div>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function Analytics() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/analytics')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;
  if (!data) return <div className="alert alert-error">{lang==='sw'?'Imeshindwa kupakia uchambuzi. Je, mfumo unafanya kazi?':'Could not load analytics. Is the backend running?'}</div>;

  const maxDaily = Math.max(...(data.daily_analyses.map(d => d.count) || [1]), 1);
  const maxReg   = Math.max(...(data.daily_registrations.map(d => d.count) || [1]), 1);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
        {[
          {label:at.totalAnalyses,     value:data.daily_analyses.reduce((s,d)=>s+d.count,0)||0,           color:'#16a34a', icon:'fa-stethoscope'},
          {label:at.newRegistrations,  value:data.daily_registrations.reduce((s,d)=>s+d.count,0)||0,      color:'#0891b2', icon:'fa-user-plus'},
          {label:at.appointments,      value:(data.appointment_statuses||[]).reduce((s,d)=>s+d.count,0)||0, color:'#d97706', icon:'fa-calendar-check'},
          {label:at.aiFeedback,        value:0, color:'#7c3aed', icon:'fa-star'},
        ].map(c => (
          <div key={c.label} className="card" style={{textAlign:'center',border:`1px solid ${c.color}20`,padding:'1rem'}}>
            <I c={c.icon} style={{fontSize:'1.4rem',color:c.color,marginBottom:6,display:'block'}}/>
            <div style={{fontSize:'1.8rem',fontWeight:800,fontFamily:'Fraunces,serif',color:c.color,lineHeight:1}}>{c.value}</div>
            <div style={{fontSize:'0.7rem',color:'#6b7280',marginTop:4}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h4 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-chart-bar" style={{color:'#16a34a',marginRight:8}}/>{at.totalAnalyses} - {lang==='sw'?'Siku 30 Zilizopita':'Last 30 Days'}
        </h4>
        {data.daily_analyses.length === 0
          ? <div style={{textAlign:'center',color:'#9ca3af',padding:'2rem',fontSize:'0.875rem'}}>{lang==='sw'?'Hakuna data ya uchambuzi bado.':'No analysis data yet.'}</div>
          : <div style={{display:'flex',gap:3,alignItems:'flex-end',height:120,overflowX:'auto',paddingBottom:4}}>
            {data.daily_analyses.map(d => (
              <div key={d.day} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:26,flex:1}}>
                <div style={{fontSize:'0.55rem',color:'#9ca3af'}}>{d.count}</div>
                <div title={`${d.day}: ${d.count}`} style={{width:'100%',minWidth:18,height:`${Math.max((d.count/maxDaily)*90,6)}px`,background:'linear-gradient(to top,#16a34a,#4ade80)',borderRadius:'3px 3px 0 0'}}/>
                <div style={{fontSize:'0.5rem',color:'#9ca3af',whiteSpace:'nowrap',transform:'rotate(-45deg)',transformOrigin:'top left',marginTop:2}}>
                  {new Date(d.day).toLocaleDateString('en-KE',{month:'short',day:'numeric'})}
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      <div className="card">
        <h4 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-user-plus" style={{color:'#0891b2',marginRight:8}}/>{at.newRegistrations} - {lang==='sw'?'Siku 30 Zilizopita':'Last 30 Days'}
        </h4>
        {data.daily_registrations.length === 0
          ? <div style={{textAlign:'center',color:'#9ca3af',padding:'1.5rem',fontSize:'0.875rem'}}>{lang==='sw'?'Hakuna wasajili katika kipindi hiki.':'No registrations in this period.'}</div>
          : <div style={{display:'flex',gap:3,alignItems:'flex-end',height:80,overflowX:'auto',paddingBottom:4}}>
            {data.daily_registrations.map(d => (
              <div key={d.day} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:26,flex:1}}>
                <div style={{fontSize:'0.55rem',color:'#9ca3af'}}>{d.count}</div>
                <div style={{width:'100%',minWidth:18,height:`${Math.max((d.count/maxReg)*60,6)}px`,background:'linear-gradient(to top,#0891b2,#67e8f9)',borderRadius:'3px 3px 0 0'}}/>
              </div>
            ))}
          </div>
        }
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
        {/* Top deficiencies */}
        <div className="card">
          <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
            <I c="fa-trophy" style={{color:'#d97706',marginRight:6}}/>{lang==='sw'?'Upungufu wa Juu':'Top Deficiencies Found'}
          </h4>
          {(data.top_deficiencies||[]).length === 0
            ? <div style={{color:'#9ca3af',fontSize:'0.875rem'}}>No data yet.</div>
            : data.top_deficiencies.map(([name, count], i) => (
              <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:i<data.top_deficiencies.length-1?'1px solid #f3f4f6':'none'}}>
                <span style={{fontSize:'0.72rem',fontWeight:800,color:'#9ca3af',width:18,textAlign:'center'}}>#{i+1}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.82rem',fontWeight:600,color:'#374151',marginBottom:1}}>{name}</div>
                  <div style={{height:4,background:'#f3f4f6',borderRadius:2}}>
                    <div style={{height:'100%',background:'#16a34a',width:`${(count/data.top_deficiencies[0][1])*100}%`,borderRadius:2}}/>
                  </div>
                </div>
                <span style={{fontSize:'0.78rem',fontWeight:700,color:'#16a34a'}}>{count}×</span>
              </div>
            ))
          }
        </div>

        {/* AI Engine breakdown */}
        <div className="card">
          <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
            <I c="fa-robot" style={{color:'#7c3aed',marginRight:6}}/>AI Engine Usage
          </h4>
          {(data.engine_breakdown||[]).map(e => (
            <div key={e.engine} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}`}}>
              <span style={{fontSize:'0.82rem',color:darkMode?'#cbd5e1':'#374151',display:'flex',alignItems:'center',gap:6}}>
                <I c={e.engine?.includes('ml')?'fa-robot':'fa-book'} style={{color:e.engine?.includes('ml')?'#7c3aed':'#16a34a'}}/>
                {e.engine === 'ml_naive_bayes' ? 'ML (Naive Bayes)' : 'Rule-based'}
              </span>
              <span style={{fontWeight:700,fontSize:'0.82rem',color:darkMode?'#cbd5e1':'#374151'}}>{e.count}</span>
            </div>
          ))}
          {!(data.engine_breakdown||[]).length && <div style={{color:darkMode?'#475569':'#9ca3af',fontSize:'0.875rem'}}>No data yet.</div>}

          {/* Appointment status */}
          <h4 style={{fontSize:'0.875rem',fontWeight:700,margin:'1rem 0 0.75rem',fontFamily:'Outfit,sans-serif'}}>
            <I c="fa-calendar" style={{color:'#d97706',marginRight:6}}/>{lang==='sw'?'Miadi kwa Hali':'Appointments by Status'}
          </h4>
          {(data.appointment_statuses||[]).map(s => (
            <div key={s.status} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}`}}>
              <span style={{fontSize:'0.82rem',color:darkMode?'#cbd5e1':'#374151',textTransform:'capitalize'}}>{s.status}</span>
              <span style={{fontWeight:700,fontSize:'0.82rem'}}>{s.count}</span>
            </div>
          ))}
          {!(data.appointment_statuses||[]).length && <div style={{color:'#9ca3af',fontSize:'0.875rem'}}>{lang==='sw'?'Hakuna miadi bado.':'No appointments yet.'}</div>}
        </div>
      </div>

      {/* User roles */}
      <div className="card">
        <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-users" style={{color:'#0891b2',marginRight:6}}/>User Role Distribution
        </h4>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {(data.user_roles||[]).map(r => (
            <div key={r.role} style={{textAlign:'center',padding:'0.75rem 1.5rem',background:darkMode?'#0f172a':'#f9fafb',borderRadius:10,border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`}}>
              <div style={{fontSize:'1.5rem',fontWeight:800,fontFamily:'Fraunces,serif',color:darkMode?'#f1f5f9':'#374151'}}>{r.count}</div>
              <div style={{fontSize:'0.75rem',color:darkMode?'#64748b':'#6b7280',fontWeight:600}}>{r.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain verification */}
      <BlockchainStatus/>
    </div>
  );
}

function BlockchainStatus() {
  const { lang } = useUI();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = (type) => {
    setLoading(true);
    api.get(`/api/admin/blockchain/verify?type=${type}`)
      .then(r => { setStatus(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return (
    <div className="card">
      <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
        <I c="fa-link" style={{color:'#7c3aed',marginRight:6}}/>{lang==='sw'?'Uthibitisho wa Mlolongo wa Blockchain':'Blockchain Audit Chain Verification'}
      </h4>
      <div style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:'0.75rem'}}>
        {lang==='sw'
          ? 'Kila rekodi ya afya, miadi, na dawa imewekwa nambari na kuunganishwa kuthibitisha. Bonyeza kuthibitisha.'
          : 'Each health record, appointment, and medication is hashed and chained for tamper-evidence. Click to verify integrity.'}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:'0.75rem',flexWrap:'wrap'}}>
        {['analysis','appointment','medication'].map(type => (
          <button key={type} className="btn btn-outline btn-sm" onClick={()=>verify(type)} disabled={loading}>
            <I c="fa-shield-halved" style={{marginRight:4}}/>{lang==='sw'?`Thibitisha ${type}`:`Verify ${type} chain`}
          </button>
        ))}
      </div>
      {status && (
        <div className={`alert ${status.chain_valid?'alert-success':'alert-error'}`}>
          <strong>{status.record_type} {lang==='sw'?'mnyororo':'chain'}:</strong> {status.total_records} {lang==='sw'?'rekodi':'records'} ·{' '}
          {status.chain_valid
            ? <><I c="fa-circle-check" style={{marginRight:4}}/>{lang==='sw'?'Mnyororo ni sahihi':'Chain is valid'} ✓</>
            : <><I c="fa-triangle-exclamation" style={{marginRight:4}}/>{lang==='sw'?`Mnyororo umevunjika kwenye rekodi #${status.broken_at_id}`:`Chain broken at record #${status.broken_at_id}`}</>
          }
        </div>
      )}
    </div>
  );
}

// ── ML Status ─────────────────────────────────────────────────────────────────
function MLStatus() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainOutput, setTrainOutput] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/api/admin/ml/status')
      .then(r => { setInfo(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const triggerTrain = async () => {
    const msg = lang === 'sw'
      ? 'Hii itafanya ml_train.py ifanye kazi kwenye seva. Endelea?'
      : 'This will run ml_train.py on the server. Proceed?';
    if (!window.confirm(msg)) return;
    setTraining(true); setTrainOutput('');
    try {
      const res = await api.post('/api/admin/ml/train');
      setTrainOutput(res.data.output || at.mlSuccess);
      load();
    } catch (e) {
      setTrainOutput(e.response?.data?.output || e.response?.data?.error || (lang==='sw'?'Mafunzo yameshindwa.':'Training failed.'));
    }
    setTraining(false);
  };

  const ML_HOW = lang === 'sw' ? [
    ['Data ya Mafunzo', '- Inazalishwa kutoka msingi wa maarifa wa upungufu na maelezo 100 ya dalili kwa kila darasa'],
    ['Usindikaji wa NLP', '- spaCy tokenization, lemmatization, kuondoa maneno ya kawaida'],
    ['TF-IDF Vectorizer', '- Inabadilisha maandishi kuwa sifa za nambari (unigrams + bigrams, vipengele 5000)'],
    ['Multinomial Naive Bayes', '- Huainisha maelezo ya dalili katika makundi ya upungufu'],
    ['Alama ya Uaminifu', '- Uwezekano wa mfano hubadilishwa kuwa asilimia 20–95'],
    ['Fallback', '- Ikiwa ML itashindwa, kulinganisha kwa maneno muhimu hutumika moja kwa moja'],
  ] : [
    ['Training Data', '- Generated from deficiency knowledge base with 100 varied symptom descriptions per class'],
    ['NLP Preprocessing', '- spaCy tokenization, lemmatization, stop-word removal'],
    ['TF-IDF Vectorizer', '- Converts text to numerical features (unigrams + bigrams, 5000 features)'],
    ['Multinomial Naive Bayes', '- Classifies symptom descriptions into deficiency categories'],
    ['Confidence Score', '- Model probability converted to 20–95% range'],
    ['Fallback', '- If ML fails, rule-based keyword matching is used automatically'],
  ];

  const subBg = darkMode ? '#0f172a' : '#f9fafb';
  const subBg2 = darkMode ? '#0a0f1e' : '#f8faff';
  const subBorder = darkMode ? '#334155' : '#e5e7eb';

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div className="card">
        <h4 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-robot" style={{color:'#7c3aed',marginRight:6}}/>{at.mlEngine}
        </h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
          <div style={{padding:'0.9rem',background:info?.model_trained?(darkMode?'#052e16':'#f0fdf4'):(darkMode?'#1a1005':'#fff7ed'),borderRadius:10,border:`1px solid ${info?.model_trained?'#bbf7d0':'#fcd34d'}`}}>
            <div style={{fontSize:'0.7rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',marginBottom:4}}>{at.currentEngine}</div>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:info?.model_trained?'#16a34a':'#d97706'}}>
              <I c={info?.model_trained?'fa-robot':'fa-book'} style={{marginRight:6}}/>{info?.engine}
            </div>
          </div>
          <div style={{padding:'0.9rem',background:subBg,borderRadius:10,border:`1px solid ${subBorder}`}}>
            <div style={{fontSize:'0.7rem',fontWeight:700,color:'#6b7280',textTransform:'uppercase',marginBottom:4}}>{at.feedbackReceived}</div>
            <div style={{fontWeight:700,fontSize:'0.9rem'}}>
              {info?.feedback_total || 0} {at.total} · {info?.feedback_helpful || 0} {at.helpful}
            </div>
          </div>
        </div>

        {info?.model_trained && info?.model_info && (
          <div style={{background:subBg,borderRadius:10,padding:'0.9rem',marginBottom:'1rem',fontSize:'0.82rem'}}>
            <div style={{fontWeight:700,marginBottom:6}}>{at.modelInfo}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {Object.entries(info.model_info).map(([k, v]) => k !== 'error' && (
                <div key={k}><span style={{color:'#9ca3af'}}>{k.replace(/_/g,' ')}:</span> <strong>{String(v)}</strong></div>
              ))}
            </div>
          </div>
        )}

        <div style={{padding:'0.9rem',background:subBg2,borderRadius:10,border:`1px solid ${subBorder}`,marginBottom:'1rem'}}>
          <div style={{fontWeight:700,fontSize:'0.8rem',marginBottom:6}}>{at.howMLWorks}</div>
          <div style={{fontSize:'0.78rem',color:'#6b7280',lineHeight:1.8}}>
            <ol style={{paddingLeft:16,margin:0}}>
              {ML_HOW.map(([title, desc], i) => (
                <li key={i}><strong>{title}</strong>{desc}</li>
              ))}
            </ol>
          </div>
        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={triggerTrain} disabled={training}>
            {training
              ? <><span className="spinner" style={{width:16,height:16}}/> {lang==='sw'?'Inafunza…':'Training…'}</>
              : <><I c="fa-gear" style={{marginRight:6}}/>{at.retrainModel}</>}
          </button>
          <button className="btn btn-ghost" onClick={load}><I c="fa-rotate" style={{marginRight:4}}/>{at.refresh}</button>
        </div>

        {trainOutput && (
          <div style={{marginTop:'0.75rem',background:'#111827',color:'#4ade80',borderRadius:8,padding:'0.75rem',fontSize:'0.75rem',fontFamily:'monospace',whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto'}}>
            {trainOutput}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedback ──────────────────────────────────────────────────────────────────
function FeedbackTab() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/feedback')
      .then(r => { setFeedback(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;

  const helpful = feedback.filter(f => f.helpful).length;
  const total = feedback.length;

  return (
    <div>
      {total > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:'1rem'}}>
          {[
            {label:at.totalFeedback, value:total,  color:'#374151', icon:'fa-star'},
            {label:at.helpful2,      value:helpful, color:'#16a34a', icon:'fa-thumbs-up'},
            {label:at.notHelpful,    value:total-helpful, color:'#dc2626', icon:'fa-thumbs-down'},
            {label:at.satisfaction,  value:`${total>0?Math.round(helpful/total*100):0}%`, color:'#0891b2', icon:'fa-chart-line'},
          ].map(c => (
            <div key={c.label} className="card" style={{textAlign:'center',padding:'0.9rem',border:`1px solid ${c.color}15`}}>
              <I c={c.icon} style={{color:c.color,fontSize:'1.2rem',marginBottom:4,display:'block'}}/>
              <div style={{fontSize:'1.4rem',fontWeight:800,fontFamily:'Fraunces,serif',color:c.color}}>{c.value}</div>
              <div style={{fontSize:'0.68rem',color:'#6b7280',marginTop:2}}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem',fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-star" style={{color:'#d97706',marginRight:6}}/>{at.userFeedback}
        </h4>
        {!feedback.length ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}>
            {lang==='sw'?'Hakuna maoni bado. Wahimize watumiaji kupima utabiri wa AI!':'No feedback received yet. Encourage users to rate AI predictions!'}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{background:darkMode?'#0f172a':'#f9fafb'}}>
                <tr>
                  {[at.user2,at.predicted,at.correction,at.helpful3,at.comment,at.date].map(h => (
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:darkMode?'#64748b':'#6b7280',textTransform:'uppercase',borderBottom:`1px solid ${darkMode?'#334155':'#e5e7eb'}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedback.map(f => (
                  <tr key={f.id} style={{borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}`}}>
                    <td style={{padding:'8px 12px',fontSize:'0.8rem'}}>{f.user_name || (lang==='sw'?'Asiyejulikana':'Anonymous')}</td>
                    <td style={{padding:'8px 12px',fontSize:'0.78rem'}}>{f.predicted_id || '-'}</td>
                    <td style={{padding:'8px 12px',fontSize:'0.78rem'}}>{f.corrected_id || '-'}</td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <I c={f.helpful?'fa-thumbs-up':'fa-thumbs-down'} style={{color:f.helpful?'#16a34a':'#dc2626'}}/>
                    </td>
                    <td style={{padding:'8px 12px',fontSize:'0.78rem',color:darkMode?'#64748b':'#6b7280',maxWidth:160}}>{f.comment || '-'}</td>
                    <td style={{padding:'8px 12px',fontSize:'0.72rem',color:darkMode?'#475569':'#9ca3af'}}>{new Date(f.timestamp).toLocaleDateString('en-KE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
function AuditLogs() {
  const at = useAT();
  const { lang, darkMode } = useUI();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/api/admin/audit')
      .then(r => { setLogs(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const ACTION_COLORS = {
    login:'#16a34a', login_failed:'#dc2626', register:'#0891b2',
    sos:'#dc2626', ml_train:'#7c3aed', admin_delete_user:'#dc2626',
    add_hospital:'#d97706', validate_analysis:'#0891b2',
  };

  const filtered = filter
    ? logs.filter(l => l.action?.includes(filter) || l.user_name?.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
        <h4 style={{fontSize:'0.95rem',fontWeight:700,fontFamily:'Outfit,sans-serif'}}>
          <I c="fa-shield-halved" style={{color:'#7c3aed',marginRight:6}}/>{at.auditLogs} ({logs.length})
        </h4>
        <input className="form-input" value={filter} onChange={e=>setFilter(e.target.value)}
          placeholder={at.filterAudit} style={{width:220,padding:'0.5rem 0.75rem'}}/>
      </div>
      {!filtered.length ? (
        <div style={{textAlign:'center',padding:'2rem',color:darkMode?'#475569':'#9ca3af'}}>
          {lang==='sw'?'Hakuna kumbukumbu za ukaguzi zilizopatikana.':'No audit logs found.'}
        </div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{background:darkMode?'#0f172a':'#f9fafb'}}>
              <tr>{[at.time,at.user3,at.action,at.details].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:darkMode?'#64748b':'#6b7280',textTransform:'uppercase',borderBottom:`1px solid ${darkMode?'#334155':'#e5e7eb'}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={{borderBottom:`1px solid ${darkMode?'#334155':'#f1f1f1'}`}}>
                  <td style={{padding:'8px 12px',fontSize:'0.72rem',color:darkMode?'#475569':'#9ca3af',whiteSpace:'nowrap'}}>{new Date(l.timestamp).toLocaleString('en-KE')}</td>
                  <td style={{padding:'8px 12px',fontSize:'0.8rem'}}>{l.user_name || <span style={{color:darkMode?'#334155':'#d1d5db'}}>{lang==='sw'?'Mfumo':'System'}</span>}</td>
                  <td style={{padding:'8px 12px'}}>
                    <span style={{background:`${ACTION_COLORS[l.action]||'#6b7280'}20`,color:ACTION_COLORS[l.action]||'#6b7280',borderRadius:6,padding:'2px 8px',fontSize:'0.72rem',fontWeight:700}}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{padding:'8px 12px',fontSize:'0.78rem',color:darkMode?'#64748b':'#6b7280',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin Shell ───────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, logout }        = useAuth();
  const { lang, darkMode }      = useUI();
  const [tab, setTab]           = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const AL = {
    en: { overview:'Overview', users:'Users', knowledge:'AI Knowledge', analytics:'Analytics', ml:'ML Engine', feedback:'Feedback', audit:'Audit Logs', online:'Online', logout:'Logout', console:'Admin Console' },
    sw: { overview:'Muhtasari', users:'Watumiaji', knowledge:'Maarifa ya AI', analytics:'Uchambuzi', ml:'Injini ya ML', feedback:'Maoni', audit:'Kumbukumbu', online:'Mtandaoni', logout:'Toka', console:'Dashibodi ya Msimamizi' },
  };
  const al = AL[lang] || AL.en;
  const labeledTabs = ADMIN_TABS.map(t => ({ ...t, label: al[t.key] || t.label }));
  const current = labeledTabs.find(t=>t.key===tab);
  const bgMain = darkMode ? '#0f172a' : '#f9fafb';
  const textMain = darkMode ? '#f1f5f9' : '#111827';

  // Dark/light mode CSS for admin content area tables/cards only
  const ADMIN_DARK_CSS = `
    body.mh-dark .card { background:#1e293b!important; border-color:#334155!important; color:#f1f5f9!important; }
    body.mh-dark table { background:#1e293b!important; }
    body.mh-dark th { background:#0f172a!important; color:#64748b!important; border-color:#334155!important; }
    body.mh-dark td { border-color:#334155!important; color:#f1f5f9!important; }
    body.mh-dark tr:hover td { background:#334155!important; }
    body:not(.mh-dark) .card { background:#ffffff!important; border-color:#e5e7eb!important; color:#111827!important; }
    body:not(.mh-dark) table { background:#ffffff!important; }
    body:not(.mh-dark) th { background:#f9fafb!important; color:#6b7280!important; border-color:#e5e7eb!important; }
    body:not(.mh-dark) td { color:#111827!important; border-color:#f3f4f6!important; }
  `;

  const sidebarBg   = darkMode ? '#1e293b' : '#1e293b';
  const navTxtColor = '#ffffff';
  const navTxtInactive = darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)';

  const navBtn = (t) => {
    const isActive = tab === t.key;
    return (
      <button key={t.key} onClick={()=>{ setTab(t.key); setSidebarOpen(false); }}
              style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'0.6rem 0.75rem',
                       border:'none',borderRadius:8,cursor:'pointer',
                       background:isActive?'#16a34a':'transparent',
                       fontFamily:'Outfit,sans-serif',fontSize:'0.85rem',
                       fontWeight:isActive?600:500,textAlign:'left',transition:'all 0.15s',
                       opacity:isActive?1:0.85 }}
              onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.opacity='1'; }}}
              onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background='transparent'; e.currentTarget.style.opacity='0.85'; }}}>
        <i className={`fa-solid ${t.icon}`} style={{ width:14,textAlign:'center',fontSize:'0.85rem',color:'#ffffff',WebkitTextFillColor:'#ffffff' }}/>
        <span style={{ color:'#ffffff',WebkitTextFillColor:'#ffffff' }}>{t.label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <>
      <div style={{ padding:'0 0.5rem 1rem',borderBottom:'1px solid rgba(255,255,255,0.12)',marginBottom:'1rem' }}>
        <div style={{ fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,color:'rgba(255,255,255,0.5)',WebkitTextFillColor:'rgba(255,255,255,0.5)' }}>{al.console}</div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#16a34a,#15803d)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.85rem',flexShrink:0,color:'#ffffff',WebkitTextFillColor:'#ffffff' }}>
            {(user?.name||'A')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:'0.82rem',fontWeight:600,color:'#ffffff',WebkitTextFillColor:'#ffffff' }}>{user?.name}</div>
            <div style={{ fontSize:'0.67rem',color:'#4ade80',WebkitTextFillColor:'#4ade80' }}>Administrator</div>
          </div>
        </div>
      </div>
      {/* Use div instead of nav to avoid global `nav` CSS override turning bg white */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',gap:2 }}>
        {labeledTabs.map(navBtn)}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.12)',paddingTop:'1rem',marginTop:'1rem' }}>
        <button onClick={logout}
                style={{ display:'flex',alignItems:'center',gap:8,width:'100%',padding:'0.6rem 0.75rem',border:'none',borderRadius:8,cursor:'pointer',background:'transparent',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem',transition:'all 0.15s',opacity:0.6 }}
                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(220,38,38,0.2)'; e.currentTarget.style.opacity='1'; e.currentTarget.querySelectorAll('i,span').forEach(el=>{ el.style.color='#fca5a5'; el.style.WebkitTextFillColor='#fca5a5'; }); }}
                onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.opacity='0.6'; e.currentTarget.querySelectorAll('i,span').forEach(el=>{ el.style.color='#ffffff'; el.style.WebkitTextFillColor='#ffffff'; }); }}>
          <i className="fa-solid fa-right-from-bracket" style={{color:'#ffffff',WebkitTextFillColor:'#ffffff'}}/>
          <span style={{color:'#ffffff',WebkitTextFillColor:'#ffffff'}}>{al.logout}</span>
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 60px)', position:'relative', background: bgMain, color: textMain }}>
      <style>{ADMIN_DARK_CSS}</style>
      <div className="admin-sidebar mh-admin-sidebar"
           style={{ width:220, background:'#1e293b !important', backgroundColor:'#1e293b',
                    display:'flex', flexDirection:'column', padding:'1.25rem 0.75rem',
                    flexShrink:0, colorScheme:'dark', isolation:'isolate',
                    borderRight:'1px solid #334155' }}>
        {sidebarContent}
      </div>
      {sidebarOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:199 }} onClick={()=>setSidebarOpen(false)}>
          <div className="mh-admin-sidebar"
               style={{ width:240, background:'#1e293b', backgroundColor:'#1e293b',
                        height:'100%', padding:'1.25rem 0.75rem',
                        display:'flex', flexDirection:'column', colorScheme:'dark' }}
               onClick={e=>e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}
      <button className="admin-toggle-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>
        <I c={sidebarOpen?'fa-xmark':'fa-bars'}/>
      </button>
      <div style={{ flex:1,padding:'1.25rem',overflow:'auto', background: bgMain }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:8 }}>
          <h2 style={{ fontSize:'1.15rem',display:'flex',alignItems:'center',gap:8, color: textMain }}>
            <I c={current?.icon} style={{ color:'#16a34a' }}/>{current?.label}
          </h2>
          <span style={{ fontSize:'0.75rem',color:'#16a34a',background:darkMode?'#052e16':'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:20,padding:'4px 12px',display:'flex',alignItems:'center',gap:5 }}>
            <I c="fa-circle-check"/>{al.online}
          </span>
        </div>
        {tab==='overview'  && <Overview/>}
        {tab==='users'     && <Users/>}
        {tab==='knowledge' && <Knowledge/>}
        {tab==='analytics' && <Analytics/>}
        {tab==='ml'        && <MLStatus/>}
        {tab==='feedback'  && <FeedbackTab/>}
        {tab==='audit'     && <AuditLogs/>}
      </div>
    </div>
  );
}