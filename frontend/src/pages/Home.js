import React from 'react';
import { Link } from 'react-router-dom';
import { useUI } from '../App';

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;

const FEATURES_EN = [
  { icon:'fa-stethoscope',           title:'AI Symptom Analysis',            desc:'Describe your symptoms in plain language. Our AI identifies nutritional deficiencies common in Kenya with confidence scores.' },
  { icon:'fa-leaf',                  title:'Kenyan Food Guidance',            desc:'Recommendations for locally available foods - omena, sukuma wiki, ugali, kunde - tailored to your deficiency.' },
  { icon:'fa-hospital',              title:'Hospital Locator',                desc:'Find any Kenyan hospital via OpenStreetMap. Search by name or tap Near Me for GPS-based results.' },
  { icon:'fa-chart-line',            title:'Health History & Trends',         desc:'Track all your analyses over time, view charts, expand past results and monitor your nutritional journey.' },
  { icon:'fa-calendar-check',        title:'Appointment Booking',             desc:'Book and manage healthcare appointments. Receive email confirmations and track appointment status.' },
  { icon:'fa-capsules',              title:'Medication Tracker',              desc:'Log medications, track adherence, and get automatic drug-interaction safety warnings.' },
  { icon:'fa-triangle-exclamation',  title:'Allergy & Condition Awareness',   desc:'Save your allergies and chronic conditions. The AI flags unsafe foods and supplements for your profile.' },
  { icon:'fa-circle-exclamation',    title:'SOS Emergency Alert',             desc:'One-tap SOS sends your GPS location and health summary to your emergency contact by email.' },
  { icon:'fa-shield-halved',         title:'Blockchain Audit Trail',          desc:'Every analysis is cryptographically logged - tamper-evident health records.' },
  { icon:'fa-file-pdf',              title:'PDF Export',                      desc:'Download your history as a formatted PDF report to share with your doctor.' },
  { icon:'fa-robot',                 title:'ML-Powered Engine',               desc:'Trained Naive Bayes classifier alongside rule-based analysis for high-accuracy deficiency detection.' },
  { icon:'fa-language',              title:'Swahili / English',               desc:'Full bilingual support. Switch languages anytime - including chatbot responses and all labels.' },
];

const FEATURES_SW = [
  { icon:'fa-stethoscope',           title:'Uchambuzi wa Dalili wa AI',       desc:'Elezea dalili zako kwa lugha rahisi. AI yetu hutambua upungufu wa lishe nchini Kenya na asilimia ya uaminifu.' },
  { icon:'fa-leaf',                  title:'Mwongozo wa Vyakula vya Kenya',   desc:'Mapendekezo ya vyakula vinapopatikana hapa Kenya - omena, sukuma wiki, ugali, kunde - kulingana na upungufu wako.' },
  { icon:'fa-hospital',              title:'Mtafutaji wa Hospitali',           desc:'Pata hospitali yoyote Kenya kupitia OpenStreetMap. Tafuta kwa jina au bonyeza Karibu Nami.' },
  { icon:'fa-chart-line',            title:'Historia na Mwelekeo wa Afya',    desc:'Fuatilia uchambuzi wako wote, tazama grafu na uangalie safari yako ya lishe.' },
  { icon:'fa-calendar-check',        title:'Kurekebisha Miadi',               desc:'Rekebisha miadi ya huduma ya afya. Pokea uthibitisho kwa barua pepe na ufuatilie hali ya miadi.' },
  { icon:'fa-capsules',              title:'Mfuatiliaji wa Dawa',             desc:'Andika dawa zako, fuatilia utekelezaji na pata maonyo ya mwingiliano wa dawa.' },
  { icon:'fa-triangle-exclamation',  title:'Ufahamu wa Mzio na Magonjwa',    desc:'Hifadhi mzio na hali za kiafya. AI inaonya kuhusu vyakula na virutubisho hatari kwa wasifu wako.' },
  { icon:'fa-circle-exclamation',    title:'Arifa ya Dharura ya SOS',         desc:'Bonyeza moja SOS inatuma eneo lako la GPS na muhtasari wa afya kwa anayekuhusika dharura.' },
  { icon:'fa-shield-halved',         title:'Kumbukumbu ya Blockchain',        desc:'Kila uchambuzi unarekodiwa kwa njia ya kriptografia - rekodi za afya zinazoweza kuthibitishwa.' },
  { icon:'fa-file-pdf',              title:'Usafirishaji wa PDF',             desc:'Pakua historia yako kama ripoti iliyopangwa ya PDF kushiriki na daktari wako.' },
  { icon:'fa-robot',                 title:'Injini ya ML',                    desc:'Kiainishaji kilichofunzwa cha Naive Bayes pamoja na uchambuzi wa kanuni kwa usahihi zaidi.' },
  { icon:'fa-language',              title:'Kiswahili / Kiingereza',          desc:'Usaidizi kamili wa lugha mbili. Badilisha lugha wakati wowote - ikiwa ni pamoja na majibu ya chatbot.' },
];

const STATS_EN = [
  { value:'35%',     label:'of Kenyan women have iron deficiency anaemia' },
  { value:'1:5,000', label:'doctor-to-patient ratio in Kenya (WHO 2023)' },
  { value:'26%',     label:'of children under 5 are stunted due to poor nutrition' },
];
const STATS_SW = [
  { value:'35%',     label:'ya wanawake wa Kenya wana upungufu wa chuma' },
  { value:'1:5,000', label:'uwiano daktari kwa mgonjwa Kenya (WHO 2023)' },
  { value:'26%',     label:'ya watoto chini ya miaka 5 wana ukuaji mbaya kutokana na lishe duni' },
];

const DEFICIENCIES = [
  { icon:'fa-droplet',       name:{ en:'Iron Anaemia',  sw:'Upungufu wa Chuma' },  color:'#dc2626' },
  { icon:'fa-eye',           name:{ en:'Vitamin A',     sw:'Vitamini A' },          color:'#d97706' },
  { icon:'fa-sun',           name:{ en:'Vitamin D',     sw:'Vitamini D' },          color:'#f59e0b' },
  { icon:'fa-brain',         name:{ en:'Vitamin B12',   sw:'Vitamini B12' },        color:'#0891b2' },
  { icon:'fa-seedling',      name:{ en:'Folate',        sw:'Folate (B9)' },         color:'#16a34a' },
  { icon:'fa-shield-halved', name:{ en:'Iodine',        sw:'Iodini' },              color:'#7c3aed' },
  { icon:'fa-shield',        name:{ en:'Zinc',          sw:'Zinki' },               color:'#0f766e' },
  { icon:'fa-bone',          name:{ en:'Calcium',       sw:'Kalsiamu' },            color:'#64748b' },
  { icon:'fa-lemon',         name:{ en:'Vitamin C',     sw:'Vitamini C' },          color:'#ea580c' },
  { icon:'fa-dumbbell',      name:{ en:'Protein',       sw:'Protini' },             color:'#b45309' },
];

const T = {
  en: {
    emergencyBanner:'Medical Emergency? Call 999 or go to your nearest hospital immediately.',
    badge:'Kenya Nutrition AI · Free · Private',
    headline:'Know Your Nutritional',
    headlineSpan:'Health Risks',
    heroPara:'AI-powered analysis of nutritional deficiencies common in Kenya. Describe your symptoms, get guidance, find nearby hospitals - all free.',
    getStarted:'Get Started Free',
    signIn:'Sign In',
    tryGuest:'Try Without Account',
    guestBadge:'No registration needed',
    guestSubtext:'3 free AI checks · No registering required',
    statsLabel:'10 Deficiencies Tracked',
    statsSubLabel:'Kenya-specific knowledge base with local food remedies and supplement guidance',
    featuresTitle:'What MediHelp Does',
    ctaTitle:'Start Your Health Check',
    ctaSub:'Free · No subscription · Works offline once loaded',
    ctaBtn:'Create Free Account',
    footerDisclaimer:'MediHelp provides AI guidance only. It does not replace a licensed healthcare professional.',
    footerCopy:'MediHelp · Kenya Health AI',
  },
  sw: {
    emergencyBanner:'Dharura ya Afya? Piga simu 999 au nenda hospitali iliyo karibu nawe mara moja.',
    badge:'AI ya Lishe Kenya · Bure · Faragha',
    headline:'Jua Hatari Zako za',
    headlineSpan:'Lishe Duni',
    heroPara:'Uchambuzi wa AI wa upungufu wa lishe nchini Kenya. Elezea dalili zako, pata mwongozo, pata hospitali - bure kabisa.',
    getStarted:'Anza Sasa Bure',
    signIn:'Ingia',
    tryGuest:'Jaribu Bila Akaunti',
    guestBadge:'Hakuna usajili unaohitajika',
    guestSubtext:'Ukaguzi 3 bure wa AI · Bure kabisa',
    statsLabel:'Upungufu 10 Unaofuatiliwa',
    statsSubLabel:'Msingi wa maarifa wa Kenya na dawa za vyakula vya hapa na mwongozo wa virutubisho',
    featuresTitle:'MediHelp Hufanya Nini',
    ctaTitle:'Anza Ukaguzi Wako wa Afya',
    ctaSub:'Bure · Bila usajili · Inafanya kazi bila mtandao baada ya kupakia',
    ctaBtn:'Fungua Akaunti Bure',
    footerDisclaimer:'MediHelp hutoa mwongozo wa AI tu. Haibadilishi mtaalamu wa afya aliyeidhinishwa.',
    footerCopy:'MediHelp · AI ya Afya Kenya',
  },
};

export default function Home() {
  const { lang, darkMode } = useUI();
  const t        = T[lang] || T.en;
  const features = lang === 'sw' ? FEATURES_SW : FEATURES_EN;
  const stats    = lang === 'sw' ? STATS_SW : STATS_EN;

  const cardBg  = darkMode ? '#1e293b' : 'white';
  const textSoft = darkMode ? '#94a3b8' : '#6b7280';
  const textMain = darkMode ? '#f1f5f9' : '#111827';

  return (
    <div style={{ background: darkMode ? '#0f172a' : 'white', color: textMain, minHeight:'100vh' }}>
      {/* Emergency banner */}
      <div style={{ background:'#dc2626', color:'white', textAlign:'center', padding:'8px', fontSize:'0.8rem', fontWeight:600 }}>
        <I c="fa-circle-exclamation" style={{marginRight:8}}/>
        {t.emergencyBanner}
      </div>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg, #052e16 0%, #14532d 50%, #16a34a 100%)', color:'white', padding:'5rem 1.25rem 4rem', textAlign:'center' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:20, padding:'6px 16px', fontSize:'0.8rem', marginBottom:'1.5rem' }}>
            <I c="fa-location-dot" style={{color:'#86efac'}}/>{t.badge}
          </div>
          <h1 style={{ fontFamily:'Fraunces, serif', fontSize:'clamp(2rem, 5vw, 3.2rem)', fontWeight:700, lineHeight:1.2, marginBottom:'1.25rem' }}>
            {t.headline}<br/><span style={{color:'#86efac'}}>{t.headlineSpan}</span>
          </h1>
          <p style={{ fontSize:'1.1rem', opacity:0.85, marginBottom:'2rem', background:'rgba(255,255,255,0.1)', lineHeight:1.7 }}>
            {t.heroPara}
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding:'0.85rem 2rem', fontSize:'1rem', borderRadius:12 }}>
              <I c="fa-circle-play" style={{marginRight:8}}/>{t.getStarted}
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding:'0.85rem 2rem', fontSize:'1rem', borderRadius:12, borderColor:'rgba(255,255,255,0.4)', color:'white' }}>
              <I c="fa-right-to-bracket" style={{marginRight:8}}/>{t.signIn}
            </Link>
          </div>
          <div style={{ marginTop:'1rem' }}>
            <Link to="/guest" style={{ display:'inline-flex', alignItems:'center', gap:7,
              color:'rgba(255,255,255,0.7)', fontSize:'0.82rem', textDecoration:'none',
              padding:'6px 16px', borderRadius:20, border:'1px solid rgba(255,255,255,0.2)',
              background:'rgba(255,255,255,0.05)', transition:'all 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <I c="fa-eye" style={{fontSize:'0.75rem'}}/>
              {t.tryGuest}
              <span style={{background:'rgba(134,239,172,0.2)',color:'#86efac',borderRadius:10,padding:'1px 7px',fontSize:'0.68rem',fontWeight:700,border:'1px solid rgba(134,239,172,0.3)'}}>
                {t.guestSubtext}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: darkMode ? '#0f172a' : '#f0fdf4', padding:'2.5rem 1.25rem', borderBottom: `1px solid ${darkMode?'#334155':'#d1fae5'}` }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 }}>
          {stats.map(s => (
            <div key={s.value} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:'2.8rem', fontWeight:700, color:'#15803d', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.875rem', color: textSoft, marginTop:6, lineHeight:1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deficiencies tracked */}
      <div style={{ padding:'3rem 1.25rem', maxWidth:900, margin:'0 auto' }}>
        <h2 style={{ fontFamily:'Fraunces, serif', textAlign:'center', fontSize:'1.6rem', marginBottom:'0.5rem', color: textMain }}>{t.statsLabel}</h2>
        <p style={{ textAlign:'center', color: textSoft, marginBottom:'1.75rem', fontSize:'0.9rem' }}>{t.statsSubLabel}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
          {DEFICIENCIES.map(d => (
            <span key={d.name.en} style={{ display:'inline-flex', alignItems:'center', gap:7, background:`${d.color}10`, color:d.color, border:`1px solid ${d.color}30`, borderRadius:20, padding:'7px 16px', fontSize:'0.875rem', fontWeight:600 }}>
              <I c={d.icon}/>{d.name[lang] || d.name.en}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ background: darkMode ? '#0f172a' : '#f9fafb', padding:'3rem 1.25rem', borderTop:`1px solid ${darkMode?'#334155':'#e5e7eb'}` }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Fraunces, serif', textAlign:'center', fontSize:'1.6rem', marginBottom:'2rem', color: textMain }}>{t.featuresTitle}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:20 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: cardBg, border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, borderRadius:14, padding:'1.25rem', textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'#f0fdf4', border:'1px solid #d1fae5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                  <I c={f.icon} style={{ color:'#16a34a', fontSize:'1.4rem' }}/>
                </div>
                <h3 style={{ fontSize:'0.9rem', fontFamily:'Outfit, sans-serif', fontWeight:700, marginBottom:8, color: textMain }}>{f.title}</h3>
                <p style={{ fontSize:'0.8rem', color: textSoft, lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'3.5rem 1.25rem', textAlign:'center', background:'linear-gradient(135deg,#052e16,#16a34a)', color:'white' }}>
        <h2 style={{ fontFamily:'Fraunces, serif', fontSize:'2rem', marginBottom:'0.75rem' }}>{t.ctaTitle}</h2>
        <p style={{ opacity:0.85, marginBottom:'1.75rem',background:'rgba(255,255,255,0.1)', fontSize:'0.95rem' }}>{t.ctaSub}</p>
        <Link to="/register" className="btn btn-primary" style={{ padding:'0.85rem 2.5rem', fontSize:'1rem', borderRadius:12, background:'white', color:'#16a34a' }}>
          <I c="fa-user-plus" style={{marginRight:8}}/>{t.ctaBtn}
        </Link>
      </div>

      {/* Footer */}
      <div style={{ background: darkMode ? '#0f172a' : '#111827', color:'rgba(255,255,255,0.5)', padding:'1.5rem 1.25rem', textAlign:'center', fontSize:'0.78rem' }}>
        <p style={{ marginBottom:4 }}>
          <I c="fa-triangle-exclamation" style={{marginRight:6, color:'#f59e0b'}}/>
          {t.footerDisclaimer}
        </p>
        <p>{t.footerCopy} · {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}