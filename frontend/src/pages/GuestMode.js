/**
 * MediHelp — Guest / Preview Mode ("Window Shopping")
 * =====================================================
 * A freemium experience that lets unauthenticated visitors:
 *  1. Try the AI symptom checker (3 free checks)
 *  2. Browse sample hospitals (static KE list)
 *  3. Read a Health Tips library
 *  4. Hit "smart locks" on restricted features → upgrade prompt
 *
 * Impressors call this: "Guest Experience Layer" / "Freemium Access Model"
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUI } from '../App';
import { analyzeSymptomsFull } from '../engine/analyzer.js';

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    badge: 'Preview Mode',
    headline: 'Try MediHelp',
    headlineSub: 'No account needed · 3 free AI checks',
    tryAI: 'AI Symptom Checker',
    tryAIDesc: 'Describe your symptoms and get instant nutritional guidance.',
    hospitals: 'Nearby Hospitals',
    hospitalsDesc: 'Browse hospitals across Kenya.',
    tips: 'Health Tips',
    tipsDesc: 'Free nutrition & health guidance.',
    locked: 'Full Diagnosis',
    lockedDesc: 'Complete AI results, history tracking & personalized care.',
    checksLeft: n => `${n} free ${n === 1 ? 'check' : 'checks'} remaining`,
    checksUsed: 'You\'ve used all 3 free checks!',
    upgradeTitle: 'Unlock Full Access',
    upgradeSub: 'Create a free account to continue your health journey',
    upgradeBtn: 'Create Free Account',
    signIn: 'Already have an account?',
    signInLink: 'Sign in',
    typeHere: 'Describe your symptoms… e.g. I feel tired, dizzy and my hair is falling',
    analyse: 'Analyse',
    analysing: 'Analysing…',
    noMatch: 'No specific deficiency detected. Try describing physical symptoms like fatigue, pale skin, or bone pain.',
    previewOnly: '⚠️ Preview result — sign up for full diagnosis, food remedies & personalized tips.',
    lockedFeature: 'This feature is for registered users.',
    lockedFeatureBtn: 'Sign up to unlock',
    progressLabel: 'Free check',
    sampleLabel: '(Sample)',
    tipsTitle: 'Common Health Tips',
    hosTitle: 'Sample Hospitals in Kenya',
    featuresTitle: 'What you unlock with a free account',
    features: [
      { icon: 'fa-robot',          text: 'Unlimited AI symptom analysis' },
      { icon: 'fa-clock-rotate-left', text: 'Full history & trends tracking' },
      { icon: 'fa-capsules',       text: 'Medication tracker & drug interaction checker' },
      { icon: 'fa-calendar-check', text: 'Appointment booking & reminders' },
      { icon: 'fa-circle-exclamation', text: 'SOS emergency alert with GPS' },
      { icon: 'fa-file-pdf',       text: 'PDF health report export' },
      { icon: 'fa-shield-halved',  text: 'Allergy & chronic condition awareness' },
      { icon: 'fa-language',       text: 'Full Swahili / English support' },
    ],
    all_free: 'All features are completely free.',
  },
  sw: {
    badge: 'Hali ya Onyesho — Angalia Bure',
    headline: 'Jaribu MediHelp',
    headlineSub: 'Hakuna akaunti · Ukaguzi 3 bure wa AI',
    tryAI: 'Kikaguzi cha Dalili cha AI',
    tryAIDesc: 'Elezea dalili zako na upate mwongozo wa lishe mara moja.',
    hospitals: 'Hospitali Karibu',
    hospitalsDesc: 'Tazama hospitali kote Kenya.',
    tips: 'Vidokezo vya Afya',
    tipsDesc: 'Mwongozo bure wa lishe na afya.',
    locked: 'Uchambuzi Kamili',
    lockedDesc: 'Matokeo kamili ya AI, ufuatiliaji wa historia na huduma ya kibinafsi.',
    checksLeft: n => `Ukaguzi ${n} bure uliobaki`,
    checksUsed: 'Umetumia ukaguzi wako wote 3 bure!',
    upgradeTitle: 'Fungua Ufikiaji Kamili',
    upgradeSub: 'Fungua akaunti bure kuendelea na safari yako ya afya',
    upgradeBtn: 'Fungua Akaunti Bure',
    signIn: 'Una akaunti tayari?',
    signInLink: 'Ingia',
    typeHere: 'Elezea dalili zako… mfano: Ninajisikia uchovu, kizunguzungu na nywele zinaanguka',
    analyse: 'Chunguza',
    analysing: 'Inachunguza…',
    noMatch: 'Hakuna upungufu mahususi. Jaribu kuelezea dalili za kimwili kama uchovu, ngozi ya rangi, au maumivu ya mifupa.',
    previewOnly: '⚠️ Matokeo ya onyesho tu — Jisajili kwa uchambuzi kamili, dawa za vyakula & vidokezo.',
    lockedFeature: 'Kipengele hiki ni kwa watumiaji waliojisajili.',
    lockedFeatureBtn: 'Jisajili kufungua',
    progressLabel: 'Ukaguzi bure',
    sampleLabel: '(Mfano)',
    tipsTitle: 'Vidokezo vya Kawaida vya Afya',
    hosTitle: 'Hospitali za Mfano Kenya',
    featuresTitle: 'Unachofungua na akaunti bure',
    features: [
      { icon: 'fa-robot',          text: 'Uchambuzi wa dalili wa AI bila kikomo' },
      { icon: 'fa-clock-rotate-left', text: 'Historia kamili & ufuatiliaji wa mwelekeo' },
      { icon: 'fa-capsules',       text: 'Kifuatiliaji cha dawa & kikaguzi cha mwingiliano' },
      { icon: 'fa-calendar-check', text: 'Uwekaji wa miadi & vikumbusho' },
      { icon: 'fa-circle-exclamation', text: 'Arifa ya dharura ya SOS na GPS' },
      { icon: 'fa-file-pdf',       text: 'Usafirishaji wa ripoti ya PDF ya afya' },
      { icon: 'fa-shield-halved',  text: 'Ufahamu wa mzio & hali ya kudumu' },
      { icon: 'fa-language',       text: 'Msaada kamili wa Kiswahili / Kiingereza' },
    ],
    all_free: 'Vipengele vyote ni bure kabisa.',
  },
};

// ── Static sample hospitals shown in preview ──────────────────────────────────
const SAMPLE_HOSPITALS = [
  { name:'Kenyatta National Hospital', address:'Upper Hill, Nairobi', phone:'+254 20 272 6300', type:'Government', emergency:true },
  { name:'Nairobi Hospital',           address:'Argwings Kodhek Rd',  phone:'+254 20 284 6000', type:'Private',    emergency:true },
  { name:'Aga Khan University Hospital',address:'Parklands, Nairobi', phone:'+254 20 366 2000', type:'Private',    emergency:true },
  { name:'Moi Teaching & Referral',    address:'Eldoret',             phone:'+254 53 203 3471', type:'Government', emergency:true },
  { name:'Coast General Teaching',     address:'Mombasa',             phone:'+254 41 231 3578', type:'Government', emergency:false },
  { name:'Kakamega County General',    address:'Kakamega',            phone:'+254 56 203 1555', type:'Government', emergency:false },
];

// ── Static health tips ────────────────────────────────────────────────────────
const TIPS_EN = [
  { icon:'fa-droplet', color:'#dc2626', title:'Iron Deficiency', tip:'Eat liver, omena (dagaa), and dark greens like sukuma wiki. Drink orange juice with iron-rich meals to triple absorption.' },
  { icon:'fa-sun',     color:'#f59e0b', title:'Vitamin D',       tip:'20 minutes of morning sunlight (7–10am) daily is the best source. Also eat eggs, sardines and fortified uji.' },
  { icon:'fa-brain',   color:'#0891b2', title:'Vitamin B12',     tip:'B12 is only in animal products. Vegetarians should supplement. Metformin users should check B12 levels annually.' },
  { icon:'fa-bone',    color:'#64748b', title:'Calcium',         tip:'Drink milk or mursik daily. Omena eaten with bones is an excellent calcium source. Pair with Vitamin D for absorption.' },
  { icon:'fa-seedling',color:'#16a34a', title:'Folate (B9)',     tip:'Critical before and during pregnancy. Eat lentils (dengu), spinach and avocado. Steam — don\'t boil — vegetables.' },
  { icon:'fa-lemon',   color:'#ea580c', title:'Vitamin C',       tip:'Local guava has more Vitamin C than oranges. Eat fruit raw — cooking destroys Vitamin C completely.' },
  { icon:'fa-triangle-exclamation', color:'#7c3aed', title:'When to See a Doctor', tip:'Seek care if symptoms persist over 2 weeks, you notice vision changes, neck swelling, or a child shows slow growth / swollen belly.' },
  { icon:'fa-glass-water', color:'#0891b2', title:'Hydration',   tip:'Drink 8 glasses of water daily. Dehydration causes fatigue, headaches and poor concentration — symptoms often mistaken for deficiencies.' },
];

const TIPS_SW = [
  { icon:'fa-droplet', color:'#dc2626', title:'Upungufu wa Chuma', tip:'Kula ini, omena (dagaa), na mboga za kijani kama sukuma wiki. Kunywa juisi ya machungwa na chakula chenye chuma kuongeza unyonyaji mara tatu.' },
  { icon:'fa-sun',     color:'#f59e0b', title:'Vitamini D',        tip:'Dakika 20 za jua la asubuhi (saa 1–4 asubuhi) kila siku ndiyo chanzo bora. Pia kula mayai, sardini na uji ulioboreshwa.' },
  { icon:'fa-brain',   color:'#0891b2', title:'Vitamini B12',      tip:'B12 ipo katika bidhaa za wanyama pekee. Mboga safi wanapaswa kuchukua virutubisho. Wanaotumia metformin waangalie kiwango cha B12 kila mwaka.' },
  { icon:'fa-bone',    color:'#64748b', title:'Kalsiamu',          tip:'Kunywa maziwa au mursik kila siku. Omena inayoliwa pamoja na mifupa ni chanzo kizuri cha kalsiamu. Ichanganye na Vitamini D kwa unyonyaji.' },
  { icon:'fa-seedling',color:'#16a34a', title:'Folate (B9)',       tip:'Muhimu kabla na wakati wa ujauzito. Kula dengu, mchicha na avokado. Pika kwa mvuke — usichemshe — mboga.' },
  { icon:'fa-lemon',   color:'#ea580c', title:'Vitamini C',        tip:'Mapera ya Kenya yana Vitamini C zaidi kuliko machungwa. Kula matunda mabichi — kupika kunamaliza Vitamini C kabisa.' },
  { icon:'fa-triangle-exclamation', color:'#7c3aed', title:'Wakati wa Kwenda Hospitali', tip:'Tafuta huduma ikiwa dalili zinaendelea zaidi ya wiki 2, unaona mabadiliko ya maono, uvimbe wa shingo, au mtoto anaonyesha ukuaji mbaya.' },
  { icon:'fa-glass-water', color:'#0891b2', title:'Kunywa Maji',   tip:'Kunywa glasi 8 za maji kila siku. Kukosa maji husababisha uchovu, maumivu ya kichwa na umakini mbaya — dalili zinazokosea kama upungufu.' },
];

// ── Deficiency icon map ───────────────────────────────────────────────────────
const DEF_ICONS = {
  iron:'fa-droplet', vitamin_a:'fa-eye', vitamin_d:'fa-sun', vitamin_b12:'fa-brain',
  folate:'fa-seedling', iodine:'fa-shield-halved', zinc:'fa-shield', calcium:'fa-bone',
  vitamin_c:'fa-lemon', protein:'fa-dumbbell',
};

const MAX_FREE = 3;

// ── Locked feature overlay ────────────────────────────────────────────────────
function LockedFeature({ t, darkMode }) {
  return (
    <div style={{
      position:'relative', borderRadius:12, overflow:'hidden',
      border:`1.5px dashed ${darkMode?'#334155':'#d1d5db'}`,
      padding:'2rem', textAlign:'center',
      background: darkMode ? '#1e293b' : '#f9fafb',
    }}>
      <div style={{ fontSize:'2rem', marginBottom:8 }}>🔒</div>
      <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4, color: darkMode?'#f1f5f9':'#111827' }}>
        {t.lockedFeature}
      </div>
      <Link to="/register">
        <button className="btn btn-primary btn-sm" style={{ marginTop:8 }}>
          <I c="fa-user-plus" style={{ marginRight:6 }} />{t.lockedFeatureBtn}
        </button>
      </Link>
    </div>
  );
}

// ── Upgrade Gate Modal ────────────────────────────────────────────────────────
function UpgradeModal({ t, darkMode, onClose }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
               display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: darkMode ? '#1e293b' : 'white',
        borderRadius:20, padding:'2rem', maxWidth:440, width:'100%',
        boxShadow:'0 24px 64px rgba(0,0,0,0.3)',
        border: darkMode ? '1px solid #334155' : 'none',
        textAlign:'center',
      }}>
        <div style={{ fontSize:'3rem', marginBottom:8 }}>🔓</div>
        <h2 style={{ fontFamily:'Fraunces,serif', fontSize:'1.5rem', marginBottom:8,
                     color: darkMode?'#f1f5f9':'#111827' }}>{t.upgradeTitle}</h2>
        <p style={{ color: darkMode?'#94a3b8':'#6b7280', marginBottom:'1.5rem', fontSize:'0.9rem' }}>
          {t.upgradeSub}
        </p>

        {/* Feature bullets */}
        <div style={{ textAlign:'left', marginBottom:'1.5rem', background: darkMode?'#0f172a':'#f0fdf4',
                      borderRadius:12, padding:'1rem' }}>
          {t.features.map(f => (
            <div key={f.icon} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, fontSize:'0.85rem' }}>
              <I c={f.icon} style={{ color:'#16a34a', width:18, textAlign:'center', flexShrink:0 }} />
              <span style={{ color: darkMode?'#cbd5e1':'#374151' }}>{f.text}</span>
            </div>
          ))}
          <div style={{ fontSize:'0.78rem', color:'#16a34a', fontWeight:700, marginTop:4, textAlign:'center' }}>
            ✅ {t.all_free}
          </div>
        </div>

        <Link to="/register">
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.85rem', fontSize:'1rem', borderRadius:12 }}>
            <I c="fa-user-plus" style={{ marginRight:8 }} />{t.upgradeBtn}
          </button>
        </Link>
        <p style={{ marginTop:'1rem', fontSize:'0.82rem', color: darkMode?'#64748b':'#9ca3af' }}>
          {t.signIn}{' '}
          <Link to="/login" style={{ color:'#16a34a', fontWeight:700 }}>{t.signInLink}</Link>
        </p>
        <button onClick={onClose} style={{ marginTop:8, background:'none', border:'none',
          fontSize:'0.78rem', color: darkMode?'#475569':'#9ca3af', cursor:'pointer' }}>
          Continue exploring preview ›
        </button>
      </div>
    </div>
  );
}

// ── AI Preview Chatbot ────────────────────────────────────────────────────────
function GuestChatbot({ t, checks, setChecks, onExhausted, lang }) {
  const { darkMode } = useUI();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{
    id:'w', type:'ai',
    text: lang === 'sw'
      ? 'Karibu kwenye MediHelp AI! Elezea dalili zako kwa lugha yoyote nami nitakusaidia.\n\n**Jaribu:** "Ninajisikia uchovu, kizunguzungu na nywele zinaanguka"'
      : 'Welcome to MediHelp AI Preview! Describe your symptoms and I\'ll identify possible nutritional deficiencies.\n\n**Try:** "I feel tired, dizzy and my hair is falling out"',
    results: null,
  }]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const fmt = text => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  const send = () => {
    const text = input.trim();
    if (!text || loading) return;
    if (checks >= MAX_FREE) { onExhausted(); return; }

    setInput('');
    const newChecks = checks + 1;
    setChecks(newChecks);
    setMessages(m => [...m, { id: Date.now(), type:'user', text, results:null }]);
    setLoading(true);

    setTimeout(() => {
      // Run local rule-based engine only (no API call in guest mode)
      const results = analyzeSymptomsFull(text).slice(0, 2); // show max 2 in preview

      let reply;
      if (results.length > 0) {
        const top = results[0];
        reply = lang === 'sw'
          ? `Nimeona **${results.length} hatari ya upungufu** inayowezekana.\n\nInayoongoza: **${top.name}** (${top.confidence}% uwezekano).\n\n${t.previewOnly}`
          : `I detected **${results.length} possible deficiency risk${results.length > 1 ? 's' : ''}**.\n\nTop match: **${top.name}** (${top.confidence}% confidence).\n\n${t.previewOnly}`;
      } else {
        reply = t.noMatch;
      }

      setMessages(m => [...m, { id: Date.now() + 1, type:'ai', text: reply, results }]);
      setLoading(false);

      if (newChecks >= MAX_FREE) {
        setTimeout(() => {
          setMessages(m => [...m, {
            id: Date.now() + 2, type:'gate', text:'', results: null,
          }]);
        }, 800);
      }
    }, 900);
  };

  const remaining = MAX_FREE - checks;

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height: 460, background: darkMode?'#0f172a':'#f9fafb',
      borderRadius:12, border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ padding:'0.75rem 1rem', background: darkMode?'#1e293b':'white',
        borderBottom:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <I c="fa-stethoscope" style={{ color:'#16a34a', fontSize:'0.85rem' }} />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.875rem', color: darkMode?'#f1f5f9':'#111827' }}>MediHelp AI</div>
            <div style={{ fontSize:'0.65rem', color:'#16a34a' }}>Preview Mode</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'0.7rem', color: remaining > 0 ? '#16a34a' : '#dc2626',
            fontWeight:700, marginBottom:3 }}>
            {remaining > 0 ? t.checksLeft(remaining) : t.checksUsed}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: MAX_FREE }).map((_, i) => (
              <div key={i} style={{
                width:24, height:6, borderRadius:3,
                background: i < checks ? '#16a34a' : (darkMode?'#334155':'#e5e7eb'),
                transition:'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map(msg => {
          if (msg.type === 'gate') return (
            <div key={msg.id} style={{ background:'linear-gradient(135deg,#052e16,#16a34a)',
              borderRadius:12, padding:'1rem', textAlign:'center', color:'white' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:4 }}>🔓</div>
              <div style={{ fontWeight:700, marginBottom:4 }}>{t.upgradeTitle}</div>
              <div style={{ fontSize:'0.8rem', opacity:0.85, marginBottom:12 }}>{t.upgradeSub}</div>
              <Link to="/register">
                <button className="btn" style={{ background:'white', color:'#16a34a',
                  fontWeight:700, borderRadius:10, padding:'0.6rem 1.5rem' }}>
                  <I c="fa-user-plus" style={{ marginRight:6 }} />{t.upgradeBtn}
                </button>
              </Link>
            </div>
          );
          return (
            <div key={msg.id}>
              <div style={{ display:'flex', gap:8,
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                alignItems:'flex-end' }}>
                {msg.type === 'ai' && (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#f0fdf4',
                    border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <I c="fa-stethoscope" style={{ color:'#16a34a', fontSize:'0.7rem' }} />
                  </div>
                )}
                <div style={{
                  maxWidth:'80%', padding:'0.6rem 0.9rem',
                  borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.type === 'user' ? 'linear-gradient(135deg,#16a34a,#15803d)' : (darkMode?'#1e293b':'white'),
                  color: msg.type === 'user' ? 'white' : (darkMode?'#f1f5f9':'#111827'),
                  border: msg.type === 'ai' ? `1px solid ${darkMode?'#334155':'#e5e7eb'}` : 'none',
                  fontSize:'0.875rem', lineHeight:1.6,
                }}>
                  <span dangerouslySetInnerHTML={{ __html: fmt(msg.text) }} />
                </div>
              </div>

              {/* Preview results — limited to 2, blurred 2nd one */}
              {msg.results?.length > 0 && (
                <div style={{ marginTop:8, marginLeft:36, display:'flex', flexDirection:'column', gap:6 }}>
                  {msg.results.slice(0, 2).map((r, ri) => (
                    <div key={r.id} style={{
                      position:'relative', background: darkMode?'#1e293b':'white',
                      border:`1.5px solid ${r.color}30`, borderRadius:10, padding:'0.75rem',
                      filter: ri === 1 ? 'blur(4px)' : 'none',
                      userSelect: ri === 1 ? 'none' : 'auto',
                      overflow:'hidden',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:r.bg,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <I c={DEF_ICONS[r.id] || 'fa-circle-dot'} style={{ color:r.color }} />
                        </div>
                        <div>
                          <div style={{ fontWeight:700, color:r.color, fontSize:'0.875rem' }}>{r.name}</div>
                          <div style={{ fontSize:'0.7rem', color:'#6b7280' }}>ICD {r.icd} · {r.severity}</div>
                        </div>
                        <span style={{ marginLeft:'auto', background:r.color, color:'white',
                          borderRadius:20, padding:'2px 8px', fontSize:'0.72rem', fontWeight:700 }}>
                          {r.confidence}%
                        </span>
                      </div>
                      <div style={{ fontSize:'0.75rem', color: darkMode?'#94a3b8':'#6b7280', fontStyle:'italic' }}>
                        <I c="fa-lock" style={{ marginRight:5, color:'#9ca3af' }} />
                        Sign up to see food remedies, supplements & doctor guidance
                      </div>
                      {/* Blur lock overlay on 2nd card */}
                      {ri === 1 && (
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                          justifyContent:'center', background:'rgba(0,0,0,0.05)' }}>
                          <Link to="/register">
                            <button className="btn btn-primary btn-sm" style={{ filter:'none' }}>
                              <I c="fa-lock-open" style={{ marginRight:5 }} />Unlock Full Results
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#f0fdf4',
              border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <I c="fa-stethoscope" style={{ color:'#16a34a', fontSize:'0.7rem' }} />
            </div>
            <div style={{ padding:'0.6rem 0.9rem', background: darkMode?'#1e293b':'white',
              border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,
              borderRadius:'18px 18px 18px 4px', display:'flex', gap:4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:7, height:7, background:'#16a34a', borderRadius:'50%',
                  display:'inline-block', animation:`gb 1.1s ease-in-out ${i*0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'0.65rem 0.9rem', background: darkMode?'#1e293b':'white',
        borderTop:`1px solid ${darkMode?'#334155':'#e5e7eb'}` }}>
        {checks >= MAX_FREE ? (
          <div style={{ textAlign:'center' }}>
            <Link to="/register">
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                <I c="fa-user-plus" style={{ marginRight:8 }} />{t.upgradeBtn}
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={t.typeHere}
              disabled={loading}
              style={{ flex:1, padding:'0.6rem 0.9rem', border:`1.5px solid ${darkMode?'#334155':'#e5e7eb'}`,
                borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'0.875rem', outline:'none',
                background: darkMode?'#0f172a':'white', color: darkMode?'#f1f5f9':'#111827' }}
            />
            <button onClick={send} disabled={!input.trim() || loading} className="btn btn-primary"
              style={{ borderRadius:10, padding:'0 1rem', flexShrink:0 }}>
              {loading ? <span className="spinner" style={{ width:14, height:14 }} /> : <I c="fa-paper-plane" />}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes gb{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ── Main Guest Mode Page ──────────────────────────────────────────────────────
export default function GuestMode() {
  const { lang, darkMode } = useUI();
  const t = T[lang] || T.en;
  const tips = lang === 'sw' ? TIPS_SW : TIPS_EN;

  const [activeSection, setActiveSection] = useState('ai');
  const [checks, setChecks] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const bg     = darkMode ? '#0f172a' : '#f9fafb';
  const surf   = darkMode ? '#1e293b' : 'white';
  const border = darkMode ? '#334155' : '#e5e7eb';
  const text   = darkMode ? '#f1f5f9' : '#111827';
  const muted  = darkMode ? '#94a3b8' : '#6b7280';

  const SECTIONS = [
    { key:'ai',        icon:'fa-stethoscope',    label:t.tryAI,    desc:t.tryAIDesc },
    { key:'hospitals', icon:'fa-hospital',        label:t.hospitals,desc:t.hospitalsDesc },
    { key:'tips',      icon:'fa-lightbulb',       label:t.tips,     desc:t.tipsDesc },
    { key:'locked',    icon:'fa-lock',            label:t.locked,   desc:t.lockedDesc, locked:true },
  ];

  return (
    <div style={{ minHeight:'100vh', background:bg, color:text }}>

      {/* Hero Banner */}
      <div style={{ background:'linear-gradient(135deg,#052e16 0%,#16a34a 100%)', color:'white',
        padding:'2.5rem 1.25rem 2rem', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
          borderRadius:20, padding:'5px 14px', fontSize:'0.75rem', marginBottom:16,
          fontWeight:700, letterSpacing:'0.04em' }}>
          <I c="fa-eye" style={{ color:'#86efac' }} />{t.badge}
        </div>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'clamp(1.8rem,5vw,2.8rem)',
          fontWeight:700, marginBottom:8 }}>{t.headline}</h1>
        <p style={{ opacity:0.85, fontSize:'1rem', marginBottom:'1.5rem' }}>{t.headlineSub}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/register">
            <button className="btn" style={{ background:'white', color:'#16a34a', fontWeight:700,
              padding:'0.7rem 1.75rem', borderRadius:12, fontSize:'0.95rem' }}>
              <I c="fa-user-plus" style={{ marginRight:7 }} />{t.upgradeBtn}
            </button>
          </Link>
          <Link to="/login">
            <button className="btn" style={{ background:'rgba(255,255,255,0.12)',
              color:'white', border:'1px solid rgba(255,255,255,0.3)',
              padding:'0.7rem 1.5rem', borderRadius:12, fontSize:'0.95rem' }}>
              <I c="fa-right-to-bracket" style={{ marginRight:7 }} />{t.signInLink}
            </button>
          </Link>
        </div>
      </div>

      {/* Section Switcher */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem 1.25rem' }}>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',
          gap:10, marginBottom:'1.5rem' }}>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => s.locked ? setShowUpgrade(true) : setActiveSection(s.key)}
              style={{
                background: activeSection === s.key ? (darkMode?'#052e16':'#f0fdf4') : surf,
                border:`1.5px solid ${activeSection === s.key ? '#16a34a' : (s.locked ? (darkMode?'#334155':'#e5e7eb') : border)}`,
                borderRadius:12, padding:'0.9rem', cursor:'pointer', textAlign:'left',
                transition:'all 0.18s', opacity: s.locked ? 0.85 : 1,
                boxShadow: activeSection === s.key ? '0 0 0 2px rgba(22,163,74,0.15)' : 'none',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <I c={s.icon} style={{
                  color: s.locked ? '#9ca3af' : (activeSection === s.key ? '#16a34a' : '#6b7280'),
                  fontSize:'1rem'
                }} />
                <span style={{ fontWeight:700, fontSize:'0.82rem',
                  color: s.locked ? muted : (activeSection === s.key ? '#16a34a' : text) }}>
                  {s.label}{s.locked && ' 🔒'}
                </span>
              </div>
              <p style={{ fontSize:'0.72rem', color:muted, margin:0, lineHeight:1.5 }}>{s.desc}</p>
            </button>
          ))}
        </div>

        {/* ── AI Chatbot Section ── */}
        {activeSection === 'ai' && (
          <GuestChatbot t={t} checks={checks} setChecks={setChecks}
            onExhausted={() => setShowUpgrade(true)} lang={lang} />
        )}

        {/* ── Hospitals Section ── */}
        {activeSection === 'hospitals' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'1rem', color:text }}>
                <I c="fa-hospital" style={{ color:'#16a34a', marginRight:8 }} />{t.hosTitle}
              </h3>
              <span style={{ background:'#fef3c7', color:'#d97706', border:'1px solid #fcd34d',
                borderRadius:6, padding:'2px 8px', fontSize:'0.68rem', fontWeight:700 }}>
                {t.sampleLabel}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
              {SAMPLE_HOSPITALS.map(h => (
                <div key={h.name} className="card" style={{ padding:'0.9rem', background:surf, border:`1px solid ${border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:text, flex:1 }}>{h.name}</div>
                    <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:6 }}>
                      {h.emergency && (
                        <span style={{ background:'#fef2f2', color:'#dc2626', borderRadius:6,
                          padding:'1px 6px', fontSize:'0.62rem', fontWeight:700 }}>Emergency</span>
                      )}
                      <span style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:6,
                        padding:'1px 6px', fontSize:'0.62rem', fontWeight:600 }}>{h.type}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:'0.78rem', color:muted, marginBottom:3 }}>
                    <I c="fa-location-dot" style={{ color:'#16a34a', marginRight:4 }} />{h.address}
                  </div>
                  <a href={`tel:${h.phone}`} style={{ fontSize:'0.78rem', color:'#16a34a',
                    fontWeight:600, textDecoration:'none' }}>
                    <I c="fa-phone" style={{ marginRight:4 }} />{h.phone}
                  </a>
                </div>
              ))}
            </div>
            {/* Prompt to search real hospitals */}
            <div style={{ marginTop:'1.25rem', background: darkMode?'#1e293b':'#f0fdf4',
              border:`1px solid ${darkMode?'#334155':'#bbf7d0'}`, borderRadius:12, padding:'1rem',
              display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <I c="fa-map-location-dot" style={{ color:'#16a34a', fontSize:'1.5rem', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem', color:text, marginBottom:3 }}>
                  {lang === 'sw' ? 'Tafuta hospitali yoyote Kenya' : 'Search any hospital in Kenya'}
                </div>
                <div style={{ fontSize:'0.78rem', color:muted }}>
                  {lang === 'sw'
                    ? 'Jisajili kupata upatikanaji kamili wa OpenStreetMap na maelekezo ya GPS.'
                    : 'Sign up for full OpenStreetMap access with GPS directions and Near Me search.'}
                </div>
              </div>
              <Link to="/register">
                <button className="btn btn-primary btn-sm">
                  <I c="fa-user-plus" style={{ marginRight:6 }} />
                  {lang === 'sw' ? 'Jisajili Bure' : 'Sign Up Free'}
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Health Tips Section ── */}
        {activeSection === 'tips' && (
          <div>
            <h3 style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'1rem',
              marginBottom:12, color:text }}>
              <I c="fa-lightbulb" style={{ color:'#d97706', marginRight:8 }} />{t.tipsTitle}
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {tips.map(tip => (
                <div key={tip.title} className="card" style={{
                  background:surf, border:`1px solid ${border}`, borderRadius:12,
                  padding:'1rem', borderLeft:`3px solid ${tip.color}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <I c={tip.icon} style={{ color:tip.color, fontSize:'1rem' }} />
                    <span style={{ fontWeight:700, fontSize:'0.875rem', color:text }}>{tip.title}</span>
                  </div>
                  <p style={{ fontSize:'0.82rem', color:muted, lineHeight:1.65, margin:0 }}>{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What you unlock — always visible at bottom ── */}
        <div style={{ marginTop:'2rem', background:`linear-gradient(135deg,${darkMode?'#052e16':'#f0fdf4'},${darkMode?'#0f172a':'#dcfce7'})`,
          borderRadius:16, padding:'1.5rem', border:`1px solid ${darkMode?'#166534':'#bbf7d0'}` }}>
          <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1.1rem', marginBottom:'1rem', color:text }}>
            🔓 {t.featuresTitle}
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
            {t.features.map(f => (
              <div key={f.icon} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.82rem',
                color: darkMode?'#cbd5e1':'#374151' }}>
                <I c={f.icon} style={{ color:'#16a34a', width:18, textAlign:'center', flexShrink:0 }} />
                {f.text}
              </div>
            ))}
          </div>
          <div style={{ marginTop:'1.25rem', display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link to="/register">
              <button className="btn btn-primary" style={{ padding:'0.75rem 2rem', borderRadius:12 }}>
                <I c="fa-user-plus" style={{ marginRight:8 }} />{t.upgradeBtn}
              </button>
            </Link>
            <Link to="/login">
              <button className="btn btn-ghost" style={{ padding:'0.75rem 1.5rem', borderRadius:12 }}>
                <I c="fa-right-to-bracket" style={{ marginRight:8 }} />{t.signInLink}
              </button>
            </Link>
          </div>
          <p style={{ marginTop:8, fontSize:'0.75rem', color: darkMode?'#4ade80':'#16a34a', fontWeight:700 }}>
            ✅ {t.all_free}
          </p>
        </div>

      </div>

      {showUpgrade && <UpgradeModal t={t} darkMode={darkMode} onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}