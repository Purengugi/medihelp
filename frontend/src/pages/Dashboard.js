import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth, useUI } from '../App';
import api from '../api';
import { analyzeSymptoms, analyzeSymptomsFull, loadLiveDeficiencies } from '../engine/analyzer.js';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const I = ({ c, style }) => <i className={`fa-solid ${c}`} style={style} />;

// ── i18n / Translations ───────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    // Nav / header
    dashboard: 'MediHelp AI Nutrition Dashboard',
    hello: 'Hello',
    // Tabs
    aiChat: 'AI Chat', history: 'History', hospitals: 'Hospitals',
    appointments: 'Appointments', medications: 'Medications',
    trends: 'Health Trends', profile: 'Profile',
    // Preferences
    sos: 'SOS', darkMode: 'Dark mode', language: 'Language',
    // Appointments
    bookAppointment: 'Add Appointment', doctorName: 'Doctor / Specialist',
    hospitalName: 'Hospital (type any name)', date: 'Date', time: 'Time',
    notes: 'Notes (reason for visit)',
    appointmentDoctorPH: 'e.g. Dr. Wambui Kamau',
    appointmentHospitalPH: 'e.g. Kenyatta National, Aga Khan…',
    appointmentNotesPH: 'Symptoms to discuss, reason for visit…',
    noAppointments: 'No appointments yet. Book your first one below!',
    upcomingAppointments: 'Your Appointments',
    appointmentInfo: 'Appointments are saved to your local dashboard. Find hospital contacts in the Hospitals tab to call and confirm.',
    // Medications
    addMedication: 'Add Medication', checkInteractions: 'Check Interactions',
    drugName: 'Drug / Supplement Name', dosage: 'Dosage', frequency: 'Frequency',
    startDate: 'Start Date', endDate: 'End Date',
    drugNamePH: 'e.g. Ferrous Sulphate, Vitamin D3',
    dosagePH: 'e.g. 200mg, 1 tablet',
    freqPH: 'e.g. Once daily, twice daily',
    medNotesPH: 'Special instructions, e.g. take with food',
    noMedications: 'No medications added yet.',
    interactions: 'Interactions', drugA: 'Drug A', drugB: 'Drug B',
    severity: 'Severity', description: 'Description',
    // History
    exportHistory: 'Export PDF', noHistory: 'No analyses yet. Chat with the AI to get started!',
    deleteRecord: 'Delete this record?', showDetails: 'Show details', collapse: 'Collapse',
    noDeficiencies: 'No deficiencies matched',
    confirmDeleteItem: 'Delete this analysis record? This cannot be undone.',
    // Hospitals
    hospitalSearch: 'Search hospitals in Kenya…',
    hospitalSearchPH: 'e.g. Kenyatta National, Aga Khan, Nairobi Hospital…',
    hospitalSearchBtn: 'Search', nearMe: 'Near Me', locating: 'Locating…',
    searchingOSM: 'Searching OpenStreetMap…',
    hospitalInfo: 'Search any hospital by name, or use Near Me to find facilities within 30 km.',
    noHospitals: 'No hospitals found. Try a different name.',
    hospitalPrompt: 'Search for a hospital by name, or tap Near Me.',
    openInMaps: 'Directions', call: 'Call',
    emergency_badge: 'Emergency',
    hospitalKm: 'km away',
    // Profile
    saveProfile: 'Save Profile', profileUpdated: 'Profile updated!',
    profileError: 'Failed to save. Is the backend running?',
    fullName: 'Full Name', age: 'Age', bloodGroup: 'Blood Group',
    knownAllergies: 'Known Allergies', chronicConditions: 'Chronic Conditions',
    allergiesPH: 'e.g. peanuts, shellfish, sulfa',
    chronicPH: 'e.g. diabetes, hypertension',
    allergyNote: 'Used to flag unsafe foods in AI results',
    emergencyContact: 'Emergency Contact (SOS)',
    contactName: 'Contact Name / Email',
    contactPhone: 'Contact Phone',
    contactNamePH: 'e.g. John Kamau or johnk@gmail.com',
    contactPhonePH: 'e.g. +254 712 345 678',
    preferences: 'Preferences',
    healthInfo: 'Health Information',
    identity: 'Personal Details',
    unknown: 'Unknown',
    dangerZone: 'Danger Zone',
    deleteHistory: 'Delete All History',
    deleteHistoryDesc: 'Permanently removes all your analyses from the database.',
    deleteHistoryBtn: 'Delete History',
    deleteAccount: 'Delete My Account',
    deleteAccountDesc: 'Permanently deletes your account, all analyses, appointments and data.',
    deleteAccountBtn: 'Delete Account',
    typeToConfirm: 'Type to confirm:',
    passwordConfirm: 'Enter your password to confirm',
    operationFailed: 'Operation failed.',
    // SOS
    sendSOS: 'Send Emergency Alert',
    sosConfirm: 'Sends your GPS location and health summary to your emergency contact.',
    sosNoContact: 'No emergency contact set. Go to Profile to add one.',
    sosSent: 'SOS alert sent!', sosFailed: 'Failed to send SOS.',
    sosLocating: 'Getting your location…',
    emergency: 'Emergency',
    // Common
    cancel: 'Cancel', delete: 'Delete', edit: 'Edit', save: 'Save', close: 'Close',
    scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled',
    feedbackHelpful: 'Was this helpful?', yes: 'Yes', no: 'No',
    engineUsed: 'Engine', total: 'Total Analyses',
    topConditions: 'Most Common Findings', last30Days: 'Activity — Last 30 Days',
    ruleBased: 'Rule-based', mlEngine: 'ML Engine',
    aiGuidanceOnly: 'AI guidance only · Not a substitute for medical advice',
    pressEnter: 'Press Enter to send',
    newChat: 'New Chat', online: 'Online',
    // Allergy warnings
    allergyFlagged: 'flagged — allergy risk',
    supplement: 'Supplement',
    seeDoctor: 'See a doctor if',
    kenyaFoods: 'Kenyan Foods',
    tips: 'Tips',
    limitAvoid: 'Limit / Avoid',
  },
  sw: {
    dashboard: 'Dashibodi ya Afya ya MediHelp',
    hello: 'Habari',
    aiChat: 'Mazungumzo ya AI', history: 'Historia', hospitals: 'Hospitali',
    appointments: 'Miadi', medications: 'Dawa',
    trends: 'Mwelekeo wa Afya', profile: 'Wasifu',
    sos: 'SOS', darkMode: 'Hali ya giza', language: 'Lugha',
    bookAppointment: 'Weka Miadi', doctorName: 'Daktari / Mtaalamu',
    hospitalName: 'Hospitali (andika jina lolote)', date: 'Tarehe', time: 'Wakati',
    notes: 'Maelezo (sababu ya ziara)',
    appointmentDoctorPH: 'mfano: Dkt. Wambui Kamau',
    appointmentHospitalPH: 'mfano: Kenyatta National, Aga Khan…',
    appointmentNotesPH: 'Dalili za kujadili, sababu ya ziara…',
    noAppointments: 'Hakuna miadi bado. Weka ya kwanza hapa chini!',
    upcomingAppointments: 'Miadi Yako',
    appointmentInfo: 'Miadi huhifadhiwa kwenye dashibodi yako. Tafuta mawasiliano ya hospitali kwenye kichupo cha Hospitali.',
    addMedication: 'Ongeza Dawa', checkInteractions: 'Angalia Mwingiliano',
    drugName: 'Jina la Dawa / Kirutubisho', dosage: 'Kipimo', frequency: 'Mara ngapi',
    startDate: 'Tarehe ya Kuanza', endDate: 'Tarehe ya Kumalizia',
    drugNamePH: 'mfano: Ferrous Sulphate, Vitamini D3',
    dosagePH: 'mfano: 200mg, kibonge 1',
    freqPH: 'mfano: Mara moja kwa siku, mara mbili',
    medNotesPH: 'Maelekezo maalum, mfano: kula kabla ya dawa',
    noMedications: 'Hakuna dawa zilizoongezwa bado.',
    interactions: 'Mwingiliano', drugA: 'Dawa A', drugB: 'Dawa B',
    severity: 'Ukali', description: 'Maelezo',
    exportHistory: 'Hamisha PDF', noHistory: 'Hakuna uchambuzi bado. Zungumza na AI kuanza!',
    deleteRecord: 'Futa rekodi hii?', showDetails: 'Maelezo', collapse: 'Funga',
    noDeficiencies: 'Hakuna upungufu uliokutana',
    confirmDeleteItem: 'Futa rekodi hii ya uchambuzi? Haiwezi kurejeshwa.',
    hospitalSearch: 'Tafuta hospitali Kenya…',
    hospitalSearchPH: 'mfano: Kenyatta National, Aga Khan, Nairobi Hospital…',
    hospitalSearchBtn: 'Tafuta', nearMe: 'Karibu Nami', locating: 'Inatafuta eneo…',
    searchingOSM: 'Inatafuta OpenStreetMap…',
    hospitalInfo: 'Tafuta hospitali yoyote kwa jina, au tumia Karibu Nami kupata maegesho ndani ya km 30.',
    noHospitals: 'Hakuna hospitali zilizopatikana. Jaribu jina lingine.',
    hospitalPrompt: 'Tafuta hospitali kwa jina, au bonyeza Karibu Nami.',
    openInMaps: 'Maelekezo', call: 'Piga Simu',
    emergency_badge: 'Dharura',
    hospitalKm: 'km mbali',
    saveProfile: 'Hifadhi Wasifu', profileUpdated: 'Wasifu umesasishwa!',
    profileError: 'Imeshindwa kuhifadhi. Je, mfumo unafanya kazi?',
    fullName: 'Jina Kamili', age: 'Umri', bloodGroup: 'Kundi la Damu',
    knownAllergies: 'Mzio Unaojulikana', chronicConditions: 'Magonjwa ya Kudumu',
    allergiesPH: 'mfano: karanga, dagaa, sulfa',
    chronicPH: 'mfano: kisukari, shinikizo la damu',
    allergyNote: 'Hutumika kuweka alama vyakula hatari katika matokeo ya AI',
    emergencyContact: 'Wasiliani wa Dharura (SOS)',
    contactName: 'Jina / Barua Pepe ya Wasiliani',
    contactPhone: 'Simu ya Wasiliani',
    contactNamePH: 'mfano: John Kamau au johnk@gmail.com',
    contactPhonePH: 'mfano: +254 712 345 678',
    preferences: 'Mapendeleo',
    healthInfo: 'Taarifa za Afya',
    identity: 'Maelezo Binafsi',
    unknown: 'Haijulikani',
    dangerZone: 'Eneo Hatari',
    deleteHistory: 'Futa Historia Yote',
    deleteHistoryDesc: 'Huondoa kabisa uchambuzi wako wote kutoka kwenye hifadhidata.',
    deleteHistoryBtn: 'Futa Historia',
    deleteAccount: 'Futa Akaunti Yangu',
    deleteAccountDesc: 'Huondoa kabisa akaunti yako, uchambuzi, miadi na data yote.',
    deleteAccountBtn: 'Futa Akaunti',
    typeToConfirm: 'Andika kuthibitisha:',
    passwordConfirm: 'Ingiza nenosiri lako kuthibitisha',
    operationFailed: 'Operesheni imeshindwa.',
    sendSOS: 'Tuma Arifa ya Dharura',
    sosConfirm: 'Inatuma eneo lako la GPS na muhtasari wa afya kwa wasiliani wa dharura.',
    sosNoContact: 'Hakuna wasiliani wa dharura. Nenda Wasifu kuongeza.',
    sosSent: 'Arifa ya SOS imetumwa!', sosFailed: 'Imeshindwa kutuma SOS.',
    sosLocating: 'Inapata eneo lako…',
    emergency: 'Dharura',
    cancel: 'Ghairi', delete: 'Futa', edit: 'Hariri', save: 'Hifadhi', close: 'Funga',
    scheduled: 'Imewekwa', completed: 'Imekamilika', cancelled: 'Imefutwa',
    feedbackHelpful: 'Je, hii ilisaidia?', yes: 'Ndio', no: 'Hapana',
    engineUsed: 'Injini', total: 'Jumla ya Uchambuzi',
    topConditions: 'Matokeo ya Kawaida', last30Days: 'Shughuli — Siku 30 Zilizopita',
    ruleBased: 'Msingi wa Kanuni', mlEngine: 'Injini ya ML',
    aiGuidanceOnly: 'Mwongozo wa AI tu · Si mbadala wa dawa',
    pressEnter: 'Bonyeza Enter kutuma',
    newChat: 'Mazungumzo Mapya', online: 'Mtandaoni',
    allergyFlagged: 'imewekwa alama — hatari ya mzio',
    supplement: 'Dawa za Ziada',
    seeDoctor: 'Tembelea Daktari Kama',
    kenyaFoods: 'Vyakula vya Kenya',
    tips: 'Vidokezo',
    limitAvoid: 'Epuka / Punguza',
  }
};

// ── MediHelp Logo SVG ─────────────────────────────────────────────────────────
const MediLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 3L5 11.5V23C5 34.5 13.2 43.5 24 45.5C34.8 43.5 43 34.5 43 23V11.5L24 3Z"
      fill="#16a34a" opacity="0.2" stroke="#16a34a" strokeWidth="2"/>
    <rect x="21.5" y="13" width="5" height="22" rx="2.5" fill="#16a34a"/>
    <rect x="13" y="21.5" width="22" height="5" rx="2.5" fill="#16a34a"/>
  </svg>
);
const DARK_STYLE = `
  /* ── Tokens ── */
  body.mh-dark { --bg:#0f172a; --surface:#1e293b; --border:#334155;
    --text:#f1f5f9; --text-soft:#cbd5e1; --muted:#64748b;
    --green:#4ade80; --red:#f87171; --blue:#60a5fa; }
  body:not(.mh-dark) { --bg:#f9fafb; --surface:#ffffff; --border:#e5e7eb;
    --text:#111827; --text-soft:#374151; --muted:#6b7280;
    --green:#16a34a; --red:#dc2626; --blue:#0891b2; }

  /* ── Global overrides (beat inline styles via !important) ── */
  body.mh-dark, body.mh-dark #root { background:var(--bg)!important; color:var(--text)!important; }
  body.mh-dark * { color:inherit; border-color:var(--border); }

  /* Surfaces */
  body.mh-dark .card,
  body.mh-dark [class*="card"] { background:var(--surface)!important; border-color:var(--border)!important; color:var(--text)!important; }

  /* App header / main wrapper */
  body.mh-dark nav, body.mh-dark header,
  body.mh-dark .navbar, body.mh-dark .app-header { background:var(--surface)!important; border-color:var(--border)!important; }

  /* Tabs */
  body.mh-dark .tabs { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .tab { color:var(--muted)!important; background:transparent!important; }
  body.mh-dark .tab.active { color:var(--green)!important; border-color:var(--green)!important; }
  body.mh-dark .tab:hover:not(.active) { color:var(--text)!important; background:#334155!important; }

  /* Forms */
  body.mh-dark input, body.mh-dark select, body.mh-dark textarea,
  body.mh-dark .form-input { background:#0f172a!important; border-color:var(--border)!important; color:var(--text)!important; }
  body.mh-dark input::placeholder, body.mh-dark textarea::placeholder { color:var(--muted)!important; }
  body.mh-dark label, body.mh-dark .form-label { color:var(--text-soft)!important; }
  body.mh-dark option { background:var(--surface); color:var(--text); }

  /* Buttons */
  body.mh-dark .btn-ghost { color:var(--muted)!important; border-color:var(--border)!important; background:transparent!important; }
  body.mh-dark .btn-ghost:hover { background:#334155!important; color:var(--text)!important; }
  body.mh-dark .btn-outline { border-color:var(--border)!important; color:var(--text-soft)!important; }

  /* Alerts */
  body.mh-dark .alert { background:#1e293b!important; border-color:var(--border)!important; color:var(--text)!important; }
  body.mh-dark .alert-warning { background:#1c1608!important; border-color:#854d0e!important; color:#fde047!important; }
  body.mh-dark .alert-error, body.mh-dark .alert-danger { background:#1c0808!important; border-color:#991b1b!important; color:var(--red)!important; }
  body.mh-dark .alert-success { background:#081c08!important; border-color:#166534!important; color:var(--green)!important; }

  /* Chatbox */
  body.mh-dark .chatbox { background:var(--bg)!important; border-color:var(--border)!important; }
  body.mh-dark .chatbox .chat-header,
  body.mh-dark .chatbox .chat-footer { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .chatbox .ai-bubble { background:var(--surface)!important; border-color:var(--border)!important; color:var(--text)!important; }

  /* Deficiency cards */
  body.mh-dark .def-card { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .def-card-body { background:#0f172a!important; border-color:var(--border)!important; }
  body.mh-dark .def-card ul li { color:var(--text-soft)!important; }
  body.mh-dark .def-card strong { color:var(--text)!important; }
  body.mh-dark .def-card p, body.mh-dark .def-card span { color:var(--text-soft); }

  /* History */
  body.mh-dark .history-item { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .history-detail { background:#0f172a!important; border-color:var(--border)!important; }

  /* Hospital list */
  body.mh-dark .hospital-list-item { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .hospital-list-item:hover { background:#334155!important; }

  /* Tables */
  body.mh-dark table { background:var(--surface)!important; }
  body.mh-dark th { background:#0f172a!important; color:var(--muted)!important; border-color:var(--border)!important; }
  body.mh-dark td { border-color:var(--border)!important; color:var(--text)!important; }
  body.mh-dark tr:hover td { background:#334155!important; }

  /* Modals */
  body.mh-dark .modal-backdrop { background:rgba(0,0,0,0.85)!important; }
  body.mh-dark .modal-box { background:var(--surface)!important; border-color:var(--border)!important; color:var(--text)!important; }

  /* Generic text */
  body.mh-dark h1,body.mh-dark h2,body.mh-dark h3,
  body.mh-dark h4,body.mh-dark h5,body.mh-dark h6 { color:var(--text)!important; }
  body.mh-dark p { color:var(--text-soft); }
  body.mh-dark small, body.mh-dark .text-muted { color:var(--muted)!important; }
  body.mh-dark hr { border-color:var(--border)!important; }

  /* Scrollbar */
  body.mh-dark ::-webkit-scrollbar { width:6px; }
  body.mh-dark ::-webkit-scrollbar-track { background:var(--bg); }
  body.mh-dark ::-webkit-scrollbar-thumb { background:#334155; border-radius:3px; }

  /* Home / Login / Register pages */
  body.mh-dark .home-bg,
  body.mh-dark .auth-bg { background:var(--bg)!important; }
  body.mh-dark .stat-card { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .feature-card { background:var(--surface)!important; border-color:var(--border)!important; }
  body.mh-dark .lang-toggle { background:var(--surface)!important; border-color:var(--border)!important; color:var(--text)!important; }

  /* ── Mobile responsive ── */
  @media (max-width: 640px) {
    .mh-tabs-wrap { overflow-x:auto!important; -webkit-overflow-scrolling:touch; white-space:nowrap!important; padding-bottom:4px; }
    .mh-tabs-wrap .tab { display:inline-flex!important; flex-shrink:0; font-size:0.72rem!important; padding:7px 10px!important; }
    .mh-grid-2 { grid-template-columns:1fr!important; }
    .mh-header-row { flex-direction:column!important; align-items:flex-start!important; gap:8px!important; }
    .mh-hospital-map { display:none!important; }
    .mh-chat-height { height:calc(100svh - 180px)!important; min-height:380px!important; }
    .mh-def-grid { grid-template-columns:1fr!important; }
    .mh-hide-mobile { display:none!important; }
    .mh-full-mobile { width:100%!important; flex:1!important; }
    .mh-action-row { flex-wrap:wrap!important; }
    .mh-profile-layout { flex-direction:column!important; }
    .mh-tab-label-long { display:none!important; }
  }
`;

// ── Swahili detection helpers ─────────────────────────────────────────────────
const SW_WORDS = ['nina','ninahisi','sijisikii','mwili','maumivu','kichwa','tumbo',
  'mguu','mkono','jicho','ngozi','nywele','damu','uchovu','udhaifu','homa',
  'kizunguzungu','kichefuchefu','pumzi','moyo','msaada','tatizo','ugonjwa',
  'dalili','tafadhali','mimi','wewe','yeye','sisi','ninajisikia','sijui'];
const detectSwahili = txt => {
  const words = txt.toLowerCase().split(/\s+/);
  return words.filter(w => SW_WORDS.includes(w)).length >= 2;
};

// ── Swahili deficiency name translations ──────────────────────────────────────
const SW_DEF_NAMES = {
  iron:       'Upungufu wa Chuma',
  vitamin_a:  'Upungufu wa Vitamini A',
  vitamin_d:  'Upungufu wa Vitamini D',
  vitamin_b12:'Upungufu wa Vitamini B12',
  folate:     'Upungufu wa Folate (B9)',
  iodine:     'Upungufu wa Iodini',
  zinc:       'Upungufu wa Zinki',
  calcium:    'Upungufu wa Kalsiamu',
  vitamin_c:  'Upungufu wa Vitamini C',
  protein:    'Upungufu wa Protini',
};

// Map full English DB names → Swahili (for Trends top-deficiencies which come from DB)
const SW_DEF_FULL = {
  'Iron Deficiency Anaemia':           'Upungufu wa Chuma',
  'Iron Deficiency Anemia':            'Upungufu wa Chuma',
  'Vitamin A Deficiency':              'Upungufu wa Vitamini A',
  'Vitamin D Deficiency':              'Upungufu wa Vitamini D',
  'Vitamin B12 Deficiency':            'Upungufu wa Vitamini B12',
  'Folate (Vitamin B9) Deficiency':    'Upungufu wa Folate (B9)',
  'Folate Deficiency':                 'Upungufu wa Folate (B9)',
  'Iodine Deficiency':                 'Upungufu wa Iodini',
  'Zinc Deficiency':                   'Upungufu wa Zinki',
  'Calcium Deficiency':                'Upungufu wa Kalsiamu',
  'Vitamin C Deficiency (Scurvy)':     'Upungufu wa Vitamini C (Kipele)',
  'Vitamin C Deficiency':              'Upungufu wa Vitamini C',
  'Protein Deficiency (Kwashiorkor)':  'Upungufu wa Protini (Kwashiorkor)',
  'Protein Deficiency':                'Upungufu wa Protini',
};
const swName = (name, lang) => lang === 'sw' ? (SW_DEF_FULL[name] || name) : name;
// Swahili section headers for DefCard
const SW_LABELS = {
  foods:    'Vyakula vya Kenya',
  tips:     'Vidokezo',
  avoid:    'Epuka / Punguza',
  supp:     'Dawa za Ziada (Supplement)',
  doctor:   'Tembelea Daktari Kama',
  severity: { mild:'Kidogo', moderate:'Wastani', severe:'Kali' },
  match:    'mechi',
  expand:   'Maelezo',
  collapse: 'Funga',
  helpful:  'Je, hii ilisaidia?',
  yes:      'Ndio', no:  'Hapana',
  thanks:   'Asante kwa maoni yako!',
  analysing:'Inachunguza dalili...',
};

// Swahili chatbot messages
const SW_CHAT = {
  welcome: name =>
    `Habari ${name}!\n\nMimi ni MediHelp AI — msaidizi wako wa lishe ya Kenya.\n\nElezea dalili zako kwa lugha yoyote nami nitakusaidia kutambua upungufu wa virutubisho na dawa za asili za Kenya.\n\n**Jaribu:** "Ninajisikia uchovu, nywele zinaanguka na kizunguzungu"\n\nUna dalili gani?`,
  found: (n, name, conf) =>
    `Nimepata **${n} hatari ya upungufu${n>1?'':''}** kulingana na dalili zako.\n\nInayoongoza: **${name}** (${conf}% uwezekano).\n\nPanua kadi kila moja kwa dawa za vyakula vya Kenya, vidokezo, na mwongozo wa virutubisho.`,
  notFound:
    `Sikupata upungufu mahususi kutoka hizo dalili — labda unauliza swali la afya kwa ujumla, ambalo ni sawa kabisa!\n\nKwa matokeo bora, elezea **dalili za kimwili** unazopata. Kwa mfano:\n\n• "Ninajisikia **uchovu**, ninaonekana **rangi ya rangi**, kizunguzungu" → Chuma\n• "**Maumivu ya mifupa**, huzuni, uchovu" → Vitamini D\n• "**Ganzi** mikononi/miguuni, kusahau" → B12\n• "Mtoto ana **tumbo kubwa**, ukuaji mdogo" → Protini\n\nUna dalili gani za kimwili?`,
  analysing: 'Inachunguza dalili...',
};

// ── Helper for formatting message text (bold, newlines) ──────────────────────
const fmt = (text) => {
  if (!text) return '';
  // Replace **text** with <strong>text</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace newlines with <br/>
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
};

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 13, { duration: 1.2 }); }, [coords, map]);
  return null;
}

// ── Deficiency Result Card ────────────────────────────────────────────────────
const DEF_ICONS = {
  iron:'fa-droplet', vitamin_a:'fa-eye', vitamin_d:'fa-sun', vitamin_b12:'fa-brain',
  folate:'fa-seedling', iodine:'fa-shield-halved', zinc:'fa-shield', calcium:'fa-bone',
  vitamin_c:'fa-lemon', protein:'fa-dumbbell',
};

function DefCard({ r, analysisId, onFeedback, lang }) {
  const { darkMode } = useUI();
  const t   = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [open, setOpen] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const iconClass  = DEF_ICONS[r.id] || 'fa-circle-dot';
  const sw         = lang === 'sw';
  const displayName = sw && SW_DEF_NAMES[r.id] ? SW_DEF_NAMES[r.id] : r.name;
  const cardBg = darkMode ? '#1e293b' : '#fff';
  const cardBodyBg = darkMode ? '#0f172a' : '#fafafa';

  const sendFeedback = async (helpful) => {
    try {
      await api.post('/api/feedback', { analysis_id: analysisId, predicted_id: r.id, helpful });
      setFbSent(true);
      if (onFeedback) onFeedback();
    } catch {}
  };

  return (
    <div className="def-card" style={{ background:cardBg, border:`1.5px solid ${r.color}30`, borderRadius:12, overflow:'hidden', marginBottom:10 }}>
      <div style={{ padding:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <I c={iconClass} style={{ color:r.color, fontSize:'1.1rem' }}/>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.95rem', color:r.color }}>{displayName}</div>
              <div style={{ fontSize:'0.72rem', color:'#6b7280' }}>
                ICD {r.icd} · {sw && SW_LABELS.severity[r.severity?.toLowerCase()] ? SW_LABELS.severity[r.severity.toLowerCase()] : r.severity}
                {r.ml_probability && <span style={{marginLeft:6,color:'#0891b2'}}>· ML: {r.ml_probability}%</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:r.color, color:'white', borderRadius:20, padding:'3px 10px', fontSize:'0.75rem', fontWeight:700 }}>{r.confidence}% {sw?'mechi':'match'}</span>
            <button onClick={()=>setOpen(!open)} style={{ background:'none', border:`1px solid ${r.color}40`, borderRadius:8, color:r.color, cursor:'pointer', padding:'4px 10px', fontSize:'0.75rem', fontWeight:600 }}>
              {open ? <><I c="fa-chevron-up" style={{marginRight:4}}/>{sw?'Funga':'Less'}</> : <><I c="fa-chevron-down" style={{marginRight:4}}/>{sw?'Maelezo':'Details'}</>}
            </button>
          </div>

        {/* Allergy / condition warnings */}
        {r.allergy_warnings?.length > 0 && (
          <div style={{marginTop:8,background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:'8px 10px'}}>
            {r.allergy_warnings.map((w,i) => (
              <div key={i} style={{fontSize:'0.75rem',color:'#c2410c',display:'flex',gap:6,alignItems:'flex-start',marginBottom:i<r.allergy_warnings.length-1?4:0}}>
                <I c="fa-triangle-exclamation" style={{flexShrink:0,marginTop:1}}/><span>{w}</span>
              </div>
            ))}
          </div>
        )}
        </div>

        <div style={{ marginTop:8, fontSize:'0.78rem', color: darkMode?'#94a3b8':'#6b7280', background: darkMode?'#0f172a':'#f9fafb', borderRadius:8, padding:'6px 10px' }}>
          <I c="fa-location-dot" style={{marginRight:5, color:'#16a34a'}}/>{r.kenya_stat}
        </div>

        {r.matched_symptoms?.length > 0 && (
          <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:5 }}>
            {r.matched_symptoms.map(s => (
              <span key={s} style={{ background:`${r.color}12`, color:r.color, border:`1px solid ${r.color}30`, borderRadius:12, padding:'2px 8px', fontSize:'0.7rem', fontWeight:600 }}>
                <I c="fa-check" style={{marginRight:4}}/>{s}
              </span>
            ))}
          </div>
        )}

        {/* Feedback */}
        {!fbSent ? (
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color: darkMode?'#64748b':'#9ca3af' }}>
            <span>{sw ? SW_LABELS.helpful : 'Was this helpful?'}</span>
            <button onClick={()=>sendFeedback(true)} style={{background:darkMode?'#052e16':'#dcfce7',color:'#16a34a',border:'none',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontSize:'0.72rem',fontWeight:600}}>👍 {sw?SW_LABELS.yes:'Yes'}</button>
            <button onClick={()=>sendFeedback(false)} style={{background:darkMode?'#1c0808':'#fef2f2',color:'#dc2626',border:'none',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontSize:'0.72rem',fontWeight:600}}>👎 {sw?SW_LABELS.no:'No'}</button>
          </div>
        ) : (
          <div style={{ marginTop:6, fontSize:'0.72rem', color:'#16a34a' }}><I c="fa-circle-check" style={{marginRight:4}}/>{sw?SW_LABELS.thanks:'Thanks for your feedback!'}</div>
        )}
      </div>

        {open && (
        <div className="def-card-body" style={{ padding:'1rem', background:cardBodyBg, borderTop:`1px solid ${r.color}15` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#16a34a', textTransform:'uppercase', marginBottom:6 }}>
                <I c="fa-leaf" style={{marginRight:5}}/>{t.kenyaFoods}
              </div>
              <ul style={{ paddingLeft:16, fontSize:'0.82rem', lineHeight:1.9 }}>
                {r.foods_recommended.map(f => (
                  <li key={f} style={{color: r.foods_flagged?.includes(f) ? '#c2410c' : (darkMode?'#cbd5e1':'inherit')}}>
                    {f}{r.foods_flagged?.includes(f) && <span style={{marginLeft:5,fontSize:'0.65rem',fontWeight:700,background:'#fed7aa',color:'#c2410c',borderRadius:4,padding:'1px 5px'}}>ALLERGY</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#d97706', textTransform:'uppercase', marginBottom:6 }}>
                <I c="fa-lightbulb" style={{marginRight:5}}/>{t.tips}
              </div>
              <ul style={{ paddingLeft:16, fontSize:'0.82rem', lineHeight:1.9 }}>
                {r.tips.map(t => <li key={t}>{t}</li>)}
              </ul>
              {r.foods_avoid?.length > 0 && (
                <>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#dc2626', textTransform:'uppercase', margin:'10px 0 4px' }}>
                    <I c="fa-ban" style={{marginRight:5}}/>{sw?SW_LABELS.avoid:'Limit / Avoid'}
                  </div>
                  <ul style={{ paddingLeft:16, fontSize:'0.82rem', lineHeight:1.9, color:'#dc2626' }}>
                    {r.foods_avoid.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
          <div style={{ marginTop:10, borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', background: darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', border: `1px solid ${darkMode?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}`, color: darkMode?'#cbd5e1':'inherit' }}>
            <I c="fa-capsules" style={{marginRight:6, color:'#6b7280'}}/><strong>{sw?SW_LABELS.supp:'Supplement'}:</strong> {r.supplement}
          </div>
          <div style={{ marginTop:8, background: darkMode?'#1c0808':'#fef2f2', border: `1px solid ${darkMode?'#991b1b':'#fca5a5'}`, borderRadius:8, padding:'8px 12px', fontSize:'0.78rem', color:'#dc2626' }}>
            <I c="fa-hospital" style={{marginRight:6}}/><strong>{sw?SW_LABELS.doctor:'See a doctor if'}:</strong> {r.when_to_see_doctor}
          </div>
          <div style={{ marginTop:6, fontSize:'0.7rem', color: darkMode?'#64748b':'#9ca3af', fontStyle:'italic' }}>
            {sw?'Tathmini ya AI tu. Thibitisha na vipimo vya damu. Daima wasiliana na daktari.':'AI assessment only. Confirm with blood tests. Always consult a licensed healthcare professional.'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
function Chatbot({ user, lang }) {
  const { darkMode } = useUI();
  const sw = lang === 'sw';
  const t  = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const makeWelcome = () => ({
    id:'w', type:'ai', results:null, analysisId:null,
    text: sw
      ? SW_CHAT.welcome(user?.name?.split(' ')[0]||'rafiki')
      : `Hello ${user?.name?.split(' ')[0]||'there'}!\n\nI'm MediHelp AI — your Kenya nutrition health assistant.\n\nDescribe your symptoms in plain language and I'll identify possible nutritional deficiencies with Kenyan food solutions.\n\n**Try:** "I feel tired all the time, my hair is falling out and I get dizzy"\n\nWhat symptoms are you experiencing?`
  });

  const [messages, setMessages] = useState([makeWelcome()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [engineInfo, setEngineInfo] = useState('');
  const endRef = useRef(null);

  // Re-create welcome if language changes
  useEffect(() => { setMessages([makeWelcome()]); }, [lang]); // eslint-disable-line

  useEffect(()=>{ loadLiveDeficiencies(); },[]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { id:Date.now(), type:'user', text, results:null, analysisId:null }]);
    setLoading(true);

    // Detect if user typed in Swahili (either explicit or detected)
    const useSw = lang === 'sw' || detectSwahili(text);

    let results = analyzeSymptomsFull(text);
    let engine = 'rule_based';

    try {
      const res = await api.post('/api/analyze', { symptoms: text, lang: useSw ? 'sw' : 'en' });
      if (res.data.results?.length > 0) {
        results = res.data.results;
        engine = res.data.engine || 'backend';
      }
    } catch {
      try { await api.post('/api/analyze', { symptoms: text, lang: useSw ? 'sw' : 'en' }); } catch {}
    }

    setEngineInfo(engine === 'ml_naive_bayes' ? '🤖 ML (Naive Bayes)' : '📚 Rule-based');

    // Build reply in appropriate language
    let reply;
    if (results.length > 0) {
      const top = results[0];
      const topName = useSw && SW_DEF_NAMES[top.id] ? SW_DEF_NAMES[top.id] : top.name;
      reply = useSw
        ? SW_CHAT.found(results.length, topName, top.confidence)
        : `I found **${results.length} potential deficiency risk${results.length>1?'s':''}** based on your symptoms.\n\nTop match: **${top.name}** (${top.confidence}% confidence).\n\nExpand each card below for Kenyan food remedies, tips, supplements and doctor guidance.`;
    } else {
      reply = useSw ? SW_CHAT.notFound
        : `I didn't detect a specific nutritional deficiency from that — you might be asking a general health question, which is completely fine!\n\nFor the best results, describe **physical symptoms** you're experiencing. For example:\n\n• "I feel **tired**, look **pale**, dizzy" → Iron deficiency\n• "**Bone pain**, low mood, fatigue" → Vitamin D\n• "**Numbness** in hands/feet, forgetful" → Vitamin B12\n• "Child has **swollen belly**, slow growth" → Protein\n• "**Night blindness**, dry eyes" → Vitamin A\n\nWhat physical symptoms are you experiencing?`;
    }

    setMessages(m => [...m, { id:Date.now()+1, type:'ai', text:reply, results, analysisId:null, useSw }]);
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 230px)', minHeight:500, background: darkMode?'#0f172a':'#f9fafb', borderRadius:12, border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, overflow:'hidden' }} className="chatbox mh-chat-height">
      {/* Header */}
      <div className="chat-header" style={{ padding:'0.75rem 1rem', background:darkMode?'#1e293b':'white', borderBottom:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MediLogo size={20}/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.875rem' }}>MediHelp AI</div>
            <div style={{ fontSize:'0.7rem', color:'#16a34a', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
              {t.online} {engineInfo && `· ${engineInfo}`}
            </div>
          </div>
        </div>
        <button onClick={()=>setMessages([makeWelcome()])} className="btn btn-ghost btn-sm" style={{fontSize:'0.72rem'}}>
          <I c="fa-rotate" style={{marginRight:4}}/>{t.newChat}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ animation:'msgfade 0.3s ease' }}>
            <div style={{ display:'flex', gap:8, justifyContent:msg.type==='user'?'flex-end':'flex-start', alignItems:'flex-end' }}>
              {msg.type==='ai' && (
                <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 }}>
                  <MediLogo size={17}/>
                </div>
              )}
              <div className={msg.type==='ai' ? 'ai-bubble' : ''} style={{ maxWidth:'78%', padding:'0.65rem 1rem', borderRadius:msg.type==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', background:msg.type==='user'?'linear-gradient(135deg,#16a34a,#15803d)':(darkMode?'#1e293b':'white'), color:msg.type==='user'?'white':(darkMode?'#f1f5f9':'#111827'), border:msg.type==='ai'?`1px solid ${darkMode?'#334155':'#e5e7eb'}`:'none', fontSize:'0.875rem', lineHeight:1.7, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <span dangerouslySetInnerHTML={{ __html:fmt(msg.text) }}/>
              </div>
              {msg.type==='user' && (
                <div style={{ width:30, height:30, borderRadius:'50%', background:'#374151', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.72rem', fontWeight:700, flexShrink:0, marginBottom:2 }}>
                  {(user?.name||'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            {msg.results?.length > 0 && (
              <div style={{ marginTop:10, marginLeft:38 }}>
                {msg.results.map(r => <DefCard key={r.id} r={r} analysisId={msg.analysisId} lang={msg.useSw ? 'sw' : (lang||'en')}/>)}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'2px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MediLogo size={17}/>
            </div>
            <div style={{ padding:'0.65rem 1rem', background:darkMode?'#1e293b':'white', border:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, borderRadius:'18px 18px 18px 4px', display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => <span key={i} style={{ width:7, height:7, background:'#16a34a', borderRadius:'50%', display:'inline-block', animation:`chatbounce 1.1s ease-in-out ${i*0.18}s infinite` }}/>)}
              <span style={{ marginLeft:8, fontSize:'0.78rem', color:'#6b7280', fontStyle:'italic' }}>{sw?SW_CHAT.analysing:'Analysing symptoms…'}</span>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div className="chat-footer" style={{ padding:'0.75rem 1rem', background:darkMode?'#1e293b':'white', borderTop:`1px solid ${darkMode?'#334155':'#e5e7eb'}`, flexShrink:0 }}>
        <div style={{ display:'flex', gap:8 }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder={sw?"Elezea dalili zako… mfano: Ninajisikia uchovu, nywele zinaanguka":t.aiGuidanceOnly.split('·')[0]?.includes('AI') ? "Describe your symptoms… e.g. I feel tired, hair falling out, dizzy" : "Describe your symptoms…"}
            rows={2} disabled={loading}
            style={{ flex:1, padding:'0.65rem 1rem', border:`1.5px solid ${darkMode?'#334155':'#e5e7eb'}`, borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'0.875rem', resize:'none', outline:'none', lineHeight:1.5, transition:'border-color 0.18s', background:'inherit', color:'inherit' }}
            onFocus={e=>e.target.style.borderColor='#16a34a'}
            onBlur={e=>e.target.style.borderColor='#e5e7eb'}
          />
          <button onClick={send} disabled={!input.trim()||loading} className="btn btn-primary" style={{ borderRadius:10, padding:'0 1.1rem', flexShrink:0 }}>
            <I c="fa-paper-plane"/>
          </button>
        </div>
        <div style={{ fontSize:'0.68rem', color: darkMode?'#64748b':'#9ca3af', marginTop:5 }}>
          {t.pressEnter} · {t.aiGuidanceOnly}
        </div>
      </div>
      <style>{`
        @keyframes chatbounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes msgfade    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── History Item (collapsible, shows full bot output) ─────────────────────────
function HistoryItem({ h, t, onDelete }) {
  const { lang, darkMode } = useUI();
  const sw = lang === 'sw';
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(sw ? 'Futa rekodi hii?' : 'Delete this record?')) return;
    setDeleting(true);
    await onDelete(h.id);
    setDeleting(false);
  };

  return (
    <div className="history-item card" style={{marginBottom:10,borderRadius:12,overflow:'hidden'}}>
      {/* Header row */}
      <div style={{padding:'0.75rem 1rem',cursor:'pointer',userSelect:'none'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
          <div style={{flex:1}} onClick={()=>setOpen(o=>!o)}>
            <div style={{fontSize:'0.73rem',color:darkMode?'#64748b':'#6b7280',marginBottom:4,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span><I c="fa-clock" style={{marginRight:4}}/>{new Date(h.timestamp).toLocaleString('en-KE')}</span>
              {h.engine_used && (
                <span style={{background:h.engine_used.includes('ml')?(darkMode?'#0c2040':'#ecfeff'):(darkMode?'#052e16':'#f0fdf4'),color:h.engine_used.includes('ml')?'#0891b2':'#16a34a',borderRadius:6,padding:'1px 7px',fontSize:'0.65rem',fontWeight:700}}>
                  {h.engine_used.includes('ml') ? 'ML' : sw?'Kanuni':'Rule-based'}
                </span>
              )}
              <span style={{marginLeft:'auto',color:darkMode?'#475569':'#9ca3af',fontSize:'0.72rem'}}>{open?(sw?'▲ Funga':'▲ Collapse'):(sw?'▼ Maelezo':'▼ Show details')}</span>
            </div>
            <div style={{fontSize:'0.875rem',fontStyle:'italic',marginBottom:8,color:darkMode?'#cbd5e1':'#374151'}}>
              "{h.symptoms.length>140 ? h.symptoms.substring(0,140)+'…' : h.symptoms}"
            </div>
            {h.results?.length > 0 ? (
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {h.results.map(r => {
                  const dName = sw && SW_DEF_NAMES[r.id] ? SW_DEF_NAMES[r.id] : r.name;
                  return (
                    <span key={r.id} style={{display:'inline-flex',alignItems:'center',gap:5,background:`${r.color}12`,color:r.color,border:`1px solid ${r.color}30`,borderRadius:20,padding:'3px 10px',fontSize:'0.75rem',fontWeight:600}}>
                      <I c={DEF_ICONS[r.id]||'fa-circle-dot'}/>{dName} · {r.confidence}%
                    </span>
                  );
                })}
              </div>
            ) : <span style={{fontSize:'0.78rem',color:darkMode?'#475569':'#9ca3af'}}>{sw?'Hakuna upungufu uliokutana':'No deficiencies matched'}</span>}
          </div>
          {/* Per-item delete button */}
          <button onClick={doDelete} disabled={deleting}
            title={sw?'Futa':'Delete this record'}
            style={{background:'none',border:'1px solid #fca5a5',borderRadius:7,padding:'4px 8px',cursor:'pointer',color:'#dc2626',fontSize:'0.75rem',flexShrink:0,marginLeft:4}}>
            {deleting ? <span className="spinner" style={{width:12,height:12}}/> : <I c="fa-trash-can"/>}
          </button>
        </div>
      </div>

      {/* Expanded: full details per deficiency */}
      {open && h.results?.length > 0 && (
        <div className="history-detail" style={{borderTop:`1px solid ${darkMode?'#334155':'#e5e7eb'}`,background:darkMode?'#0f172a':'#fafafa',padding:'0.75rem 1rem',display:'flex',flexDirection:'column',gap:12}}>
          {h.results.map(r => {
            const dName = sw && SW_DEF_NAMES[r.id] ? SW_DEF_NAMES[r.id] : r.name;
            return (
            <div key={r.id} style={{borderLeft:`3px solid ${r.color}`,paddingLeft:12}}>
              <div style={{fontWeight:700,color:r.color,fontSize:'0.9rem',marginBottom:6}}>
                <I c={DEF_ICONS[r.id]||'fa-circle-dot'} style={{marginRight:6}}/>{dName}
                <span style={{fontWeight:400,fontSize:'0.75rem',marginLeft:8,color:darkMode?'#64748b':'#6b7280'}}>ICD {r.icd} · {r.severity}</span>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:'0.8rem'}}>
                {r.foods_recommended?.length > 0 && (
                  <div>
                    <div style={{fontWeight:700,color:'#16a34a',textTransform:'uppercase',fontSize:'0.68rem',marginBottom:4}}>
                      <I c="fa-leaf" style={{marginRight:4}}/>{sw?'Vyakula vya Kenya':'Kenyan Foods'}
                    </div>
                    <ul style={{paddingLeft:14,lineHeight:1.8,margin:0,color:darkMode?'#cbd5e1':'inherit'}}>
                      {r.foods_recommended.map(f=><li key={f}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {r.tips?.length > 0 && (
                  <div>
                    <div style={{fontWeight:700,color:'#d97706',textTransform:'uppercase',fontSize:'0.68rem',marginBottom:4}}>
                      <I c="fa-lightbulb" style={{marginRight:4}}/>{sw?'Vidokezo':'Tips'}
                    </div>
                    <ul style={{paddingLeft:14,lineHeight:1.8,margin:0,color:darkMode?'#cbd5e1':'inherit'}}>
                      {r.tips.map(tip=><li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {r.foods_avoid?.length > 0 && (
                <div style={{marginTop:6,fontSize:'0.8rem'}}>
                  <div style={{fontWeight:700,color:'#dc2626',textTransform:'uppercase',fontSize:'0.68rem',marginBottom:3}}>
                    <I c="fa-ban" style={{marginRight:4}}/>{sw?'Epuka/Punguza':'Limit / Avoid'}
                  </div>
                  <ul style={{paddingLeft:14,lineHeight:1.8,margin:0,color:'#dc2626'}}>
                    {r.foods_avoid.map(f=><li key={f}>{f}</li>)}
                  </ul>
                </div>
              )}

              {r.supplement && (
                <div style={{marginTop:6,background:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',borderRadius:7,padding:'6px 10px',fontSize:'0.79rem',color:darkMode?'#cbd5e1':'inherit'}}>
                  <I c="fa-capsules" style={{marginRight:6,color:'#6b7280'}}/><strong>{sw?'Dawa za Ziada':'Supplement'}:</strong> {r.supplement}
                </div>
              )}

              {r.when_to_see_doctor && (
                <div style={{marginTop:5,background:darkMode?'#1c0808':'#fef2f2',border:`1px solid ${darkMode?'#991b1b':'#fca5a5'}`,borderRadius:7,padding:'6px 10px',fontSize:'0.78rem',color:'#dc2626'}}>
                  <I c="fa-hospital" style={{marginRight:6}}/><strong>{sw?'Tembelea Daktari Kama':'See a doctor if'}:</strong> {r.when_to_see_doctor}
                </div>
              )}

              {r.kenya_stat && (
                <div style={{marginTop:4,fontSize:'0.72rem',color:darkMode?'#64748b':'#6b7280'}}>
                  <I c="fa-location-dot" style={{marginRight:4,color:'#16a34a'}}/>{r.kenya_stat}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function History({ t, lang }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/history')
      .then(r => { setHistory(r.data); setLoading(false); })
      .catch(() => { setError('Could not load history. Run migrate_db.py if you haven\'t yet, then restart Flask.'); setLoading(false); });
  }, []);

const exportPDF = async () => {
    try {
      const res = await api.get(`/api/export/history?format=pdf&lang=${lang}`, {
        responseType: 'text',
      });

      // ── Build a full standalone HTML page and trigger real download ──
      const htmlContent = res.data;

      // Inject auto-download script: when opened, immediately saves as PDF via print
      // For a true no-dialog PDF download we use the Blob → <a download> approach
      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      // Open in hidden iframe, trigger print to PDF silently (Chrome/Edge support)
      // Fallback: direct HTML file download if pop-up blocked
      const a = document.createElement('a');
      a.href = blobUrl;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      // Also open in new tab so user can use browser's Save as PDF
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // pop-up blocked — the file download above already handled it
      }
    } catch {
      alert(lang === 'sw'
        ? 'Imeshindwa kuunda ripoti. Je, mfumo unafanya kazi?'
        : 'Could not generate report. Is the backend running?');
    }
  };


  const deleteItem = async (id) => {
    if (!window.confirm(t.confirmDeleteItem || 'Delete this record?')) return;
    try {
      await api.delete(`/api/history?id=${id}`);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch { alert('Delete failed.'); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;
  if (error)   return <div className="alert alert-warning"><I c="fa-triangle-exclamation" style={{marginRight:8}}/>{error}</div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
        <h3 style={{fontSize:'1rem',fontFamily:'Outfit,sans-serif',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          <I c="fa-clock-rotate-left" style={{color:'#16a34a'}}/>{t.history} ({history.length})
        </h3>
        {history.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={exportPDF}>
            <I c="fa-file-pdf" style={{marginRight:4,color:'#dc2626'}}/>{t.exportHistory}
          </button>
        )}
      </div>

      {!history.length ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#6b7280'}}>
          <I c="fa-clipboard-list" style={{fontSize:'3rem',marginBottom:12,display:'block',color:'#d1d5db'}}/>
          <p>{t.noHistory}</p>
        </div>
      ) : history.map(h => (
        <HistoryItem key={h.id} h={h} t={t} onDelete={deleteItem}/>
      ))}
    </div>
  );
}

// ── Hospital Map ──────────────────────────────────────────────────────────────
function HospitalMap() {
  const { lang } = useUI();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating]     = useState(false);
  const [mapCenter, setMapCenter]   = useState(null);
  const [mode, setMode]             = useState('none');

  const fetchOverpass = useCallback((lat, lon, q) => {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (lat != null) { params.set('lat', lat); params.set('lon', lon); params.set('radius', 30000); }
    if (q) params.set('q', q);
    api.get(`/api/hospitals/overpass?${params}`)
      .then(r => {
        if (r.data.error) { setError(r.data.error); setLoading(false); return; }
        setHospitals(r.data); setLoading(false);
      })
      .catch(() => {
        api.get(`/api/hospitals${q?`?q=${encodeURIComponent(q)}`:lat?`?lat=${lat}&lon=${lon}`:''}`)
          .then(r => { setHospitals(r.data); setLoading(false); })
          .catch(() => { setError(lang==='sw'?'Imeshindwa kupakia hospitali. Angalia muunganiko wako.':'Could not load hospitals. Check your internet connection.'); setLoading(false); });
      });
  }, [lang]);

  const doSearch = () => {
    if (!search.trim()) { setError(lang==='sw'?'Ingiza jina la hospitali kutafuta.':'Enter a hospital name to search.'); return; }
    setMode('search'); fetchOverpass(null, null, search.trim());
  };

  const getLocation = () => {
    if (!navigator.geolocation) { alert(lang==='sw'?'Eneo halikubaliki kwenye kivinjari hiki.':'Geolocation not supported.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserLocation({ lat, lon }); setMapCenter([lat, lon]); setLocating(false);
        setMode('nearby'); fetchOverpass(lat, lon, '');
      },
      () => { setError(lang==='sw'?'Imeshindwa kupata eneo lako. Ruhusu ufikiaji wa eneo.':'Could not get your location. Please allow location access.'); setLocating(false); }
    );
  };

  const hospitalIcon = L.divIcon({
    html:`<div style="background:#16a34a;width:30px;height:30px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:13px"><i class='fa-solid fa-hospital-user'></i></div>`,
    className:'', iconSize:[30,30], iconAnchor:[15,15]
  });
  const userIcon = L.divIcon({
    html:`<div style="background:#0891b2;width:28px;height:28px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px"><i class='fa-solid fa-location-crosshairs'></i></div>`,
    className:'', iconSize:[28,28], iconAnchor:[14,14]
  });

  return (
    <div>
      <h3 style={{fontSize:'1rem',fontFamily:'Outfit,sans-serif',fontWeight:700,marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:8}}>
        <I c="fa-hospital" style={{color:'#16a34a'}}/>{t.hospitals}
        <span style={{fontWeight:400,fontSize:'0.75rem',color:'#6b7280',marginLeft:4}}>— Kenya (OpenStreetMap)</span>
      </h3>
      <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:'0.75rem'}}>
        <I c="fa-circle-info" style={{marginRight:5,color:'#0891b2'}}/>{t.hospitalInfo}
      </div>

      {/* Search bar */}
      <div style={{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:180}}>
          <I c="fa-magnifying-glass" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'0.85rem'}}/>
          <input className="form-input" value={search} onChange={e=>setSearch(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doSearch()}
            placeholder={t.hospitalSearchPH}
            style={{paddingLeft:34}}/>
        </div>
        <button className="btn btn-outline mh-full-mobile" onClick={doSearch} disabled={loading}>
          <I c="fa-magnifying-glass" style={{marginRight:6}}/>{t.hospitalSearchBtn}
        </button>
        <button className="btn btn-primary mh-full-mobile" onClick={getLocation} disabled={locating||loading}>
          {locating ? <><span className="spinner" style={{width:14,height:14}}/> {t.locating}</> : <><I c="fa-location-crosshairs" style={{marginRight:6}}/>{t.nearMe}</>}
        </button>
      </div>

      {error && <div className="alert alert-warning" style={{marginBottom:'0.75rem'}}><I c="fa-triangle-exclamation" style={{marginRight:8}}/>{error}</div>}

      {/* Map — hidden on mobile via CSS class */}
      <div className="mh-hospital-map" style={{borderRadius:12,overflow:'hidden',border:'1px solid #e5e7eb',marginBottom:'1rem'}}>
        <MapContainer center={userLocation?[userLocation.lat,userLocation.lon]:[-1.2921,36.8219]} zoom={userLocation?11:6} style={{height:360}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
          {mapCenter && <FlyTo coords={mapCenter}/>}
          {userLocation && <Marker position={[userLocation.lat,userLocation.lon]} icon={userIcon}><Popup><strong>{lang==='sw'?'Eneo Lako':'Your Location'}</strong></Popup></Marker>}
          {hospitals.map(h => (
            <Marker key={h.id} position={[h.latitude,h.longitude]} icon={hospitalIcon} eventHandlers={{click:()=>setSelected(h)}}>
              <Popup>
                <strong style={{color:'#16a34a'}}>{h.name}</strong><br/>
                {h.address && <>{h.address}<br/></>}
                {h.phone && <><I c="fa-phone" style={{marginRight:4}}/>{h.phone}<br/></>}
                {h.distance_km!=null && <><I c="fa-route" style={{marginRight:4}}/>{h.distance_km} {t.hospitalKm}<br/></>}
                {h.emergency ? <span style={{color:'#dc2626',fontWeight:700}}>{t.emergency_badge}</span> : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Prompt */}
      {mode === 'none' && !loading && (
        <div style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}>
          <I c="fa-hospital" style={{fontSize:'2.5rem',display:'block',marginBottom:10,color:'#d1d5db'}}/>
          <p style={{fontSize:'0.875rem'}}>{t.hospitalPrompt}</p>
        </div>
      )}

      {loading && <div style={{textAlign:'center',padding:'2rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/><p style={{marginTop:10,fontSize:'0.8rem',color:'#6b7280'}}>{t.searchingOSM}</p></div>}

      {!loading && hospitals.length > 0 && (
        <>
          <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:8}}>
            <I c="fa-list" style={{marginRight:5}}/>{hospitals.length} {t.hospitals.toLowerCase()} {lang==='sw'?'zimepatikana':'found'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
            {hospitals.map(h => (
              <div key={h.id} className="card hospital-list-item"
                onClick={()=>{setSelected(selected?.id===h.id?null:h); if(h.latitude&&h.longitude) setMapCenter([h.latitude,h.longitude]);}}
                style={{cursor:'pointer',border:selected?.id===h.id?'2px solid #16a34a':'',padding:'0.9rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                  <div style={{fontWeight:700,fontSize:'0.875rem',flex:1}}>{h.name}</div>
                  <div style={{display:'flex',gap:4,flexShrink:0,marginLeft:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    {h.emergency ? <span style={{background:'#fef2f2',color:'#dc2626',borderRadius:6,padding:'1px 6px',fontSize:'0.65rem',fontWeight:700}}>{t.emergency_badge}</span> : null}
                    {h.type && <span style={{background:'#f0fdf4',color:'#16a34a',borderRadius:6,padding:'1px 6px',fontSize:'0.65rem',fontWeight:600,textTransform:'capitalize'}}>{h.type}</span>}
                  </div>
                </div>
                {h.address && h.address.trim() && <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:3}}><I c="fa-location-dot" style={{color:'#16a34a',marginRight:4}}/>{h.address}</div>}
                {h.phone && h.phone.trim()
                  ? <div style={{marginBottom:4}}><a href={`tel:${h.phone}`} onClick={e=>e.stopPropagation()} style={{fontSize:'0.78rem',color:'#16a34a',fontWeight:600,textDecoration:'none'}}><I c="fa-phone" style={{marginRight:4}}/>{h.phone}</a></div>
                  : <div style={{fontSize:'0.72rem',color:'#d1d5db',marginBottom:3,fontStyle:'italic'}}>{lang==='sw'?'Nambari haipatikani':'No phone listed'}</div>
                }
                {h.distance_km!=null && <div style={{fontSize:'0.75rem',color:'#0891b2',fontWeight:700}}><I c="fa-route" style={{marginRight:4}}/>{h.distance_km} {t.hospitalKm}</div>}
                {h.latitude && h.longitude && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,fontSize:'0.72rem',color:'#0891b2',textDecoration:'none'}}
                    onClick={e=>e.stopPropagation()}>
                    <I c="fa-diamond-turn-right"/>{t.openInMaps}
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && mode!=='none' && hospitals.length===0 && !error && (
        <div style={{textAlign:'center',padding:'1.5rem',color:'#6b7280',fontSize:'0.875rem'}}>
          {t.noHospitals}
        </div>
      )}
    </div>
  );
}

// ── Appointments ──────────────────────────────────────────────────────────────
function AppointmentsTab({ t }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ doctor_name:'', hospital_name:'', appointment_date:'', appointment_time:'', notes:'' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/appointments')
      .then(a => { setAppointments(a.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    if (!form.doctor_name || !form.appointment_date || !form.appointment_time) {
      setMsg('Please fill doctor name, date, and time.'); return;
    }
    setSaving(true); setMsg('');
    try {
      if (editId) {
        await api.put(`/api/appointments/${editId}`, form);
      } else {
        await api.post('/api/appointments', form);
      }
      setShowForm(false); setEditId(null); setForm({ doctor_name:'', hospital_name:'', appointment_date:'', appointment_time:'', notes:'' });
      load();
    } catch { setMsg(t.profileError); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.deleteRecord)) return;
    await api.delete(`/api/appointments/${id}`); load();
  };

  const startEdit = (a) => {
    setForm({ doctor_name:a.doctor_name, hospital_name:a.hospital_name||'', appointment_date:a.appointment_date, appointment_time:a.appointment_time, notes:a.notes||'' });
    setEditId(a.id); setShowForm(true);
  };

  const updateStatus = async (id, status) => { await api.put(`/api/appointments/${id}`, { status }); load(); };
  const statusColor = { scheduled:'#0891b2', completed:'#16a34a', cancelled:'#dc2626' };

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;

  return (
    <div>
      <div className="mh-header-row" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
        <h3 style={{fontSize:'1rem',fontFamily:'Outfit,sans-serif',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          <I c="fa-calendar-check" style={{color:'#16a34a'}}/>{t.upcomingAppointments} ({appointments.length})
        </h3>
        <button className="btn btn-primary btn-sm" onClick={()=>{setShowForm(!showForm);setEditId(null);setForm({doctor_name:'',hospital_name:'',appointment_date:'',appointment_time:'',notes:''});}}>
          <I c={showForm?'fa-xmark':'fa-plus'} style={{marginRight:6}}/>{showForm ? t.cancel : t.bookAppointment}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:'1.25rem',border:'1.5px solid #16a34a30'}}>
          <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'0.5rem'}}>
            {editId ? t.edit+' '+t.appointments : t.bookAppointment}
          </h4>
          <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:'0.75rem',background:'#f0fdf4',padding:'6px 10px',borderRadius:7,border:'1px solid #bbf7d0'}}>
            <I c="fa-circle-check" style={{color:'#16a34a',marginRight:5}}/>{t.appointmentInfo}
          </div>
          {msg && <div className="alert alert-error" style={{marginBottom:8}}>{msg}</div>}
          <div className="grid-2 mh-grid-2">
            <div className="form-group">
              <label className="form-label">{t.doctorName} *</label>
              <input className="form-input" value={form.doctor_name} onChange={set('doctor_name')} placeholder={t.appointmentDoctorPH}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t.hospitalName}</label>
              <input className="form-input" value={form.hospital_name} onChange={set('hospital_name')} placeholder={t.appointmentHospitalPH}/>
              <div style={{fontSize:'0.68rem',color:'#9ca3af',marginTop:2}}>{t.hospitalInfo}</div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.date} *</label>
              <input type="date" className="form-input" value={form.appointment_date} onChange={set('appointment_date')} min={new Date().toISOString().split('T')[0]}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t.time} *</label>
              <input type="time" className="form-input" value={form.appointment_time} onChange={set('appointment_time')}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.notes}</label>
            <textarea className="form-input" value={form.notes} onChange={set('notes')} rows={2} placeholder={t.appointmentNotesPH}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
              {saving ? <><span className="spinner" style={{width:14,height:14}}/> {t.save}…</> : <><I c="fa-floppy-disk" style={{marginRight:4}}/>{t.save}</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setShowForm(false);setEditId(null);}}>{t.cancel}</button>
          </div>
        </div>
      )}

      {!appointments.length ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#6b7280'}}>
          <I c="fa-calendar-xmark" style={{fontSize:'3rem',marginBottom:12,display:'block',color:'#d1d5db'}}/>
          <p>{t.noAppointments}</p>
        </div>
      ) : appointments.map(a => (
        <div key={a.id} className="card" style={{marginBottom:10,borderLeft:`3px solid ${statusColor[a.status]||'#e5e7eb'}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:3}}>
                <I c="fa-user-doctor" style={{color:'#16a34a',marginRight:6}}/>{a.doctor_name}
              </div>
              {a.hospital_name && <div style={{fontSize:'0.8rem',color:'#6b7280',marginBottom:2}}><I c="fa-hospital" style={{marginRight:5}}/>{a.hospital_name}</div>}
              <div style={{fontSize:'0.82rem',display:'flex',gap:12,flexWrap:'wrap',marginTop:4}}>
                <span><I c="fa-calendar" style={{marginRight:4,color:'#16a34a'}}/>{new Date(a.appointment_date+'T00:00:00').toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>
                <span><I c="fa-clock" style={{marginRight:4,color:'#16a34a'}}/>{a.appointment_time}</span>
              </div>
              {a.notes && <div style={{fontSize:'0.78rem',color:'#6b7280',marginTop:4,fontStyle:'italic'}}>{a.notes}</div>}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',flexShrink:0}}>
              <span style={{background:statusColor[a.status]||'#e5e7eb',color:'white',borderRadius:8,padding:'2px 10px',fontSize:'0.72rem',fontWeight:700}}>
                {t[a.status]||a.status}
              </span>
              <div className="mh-action-row" style={{display:'flex',gap:4,marginTop:4}}>
                {a.status==='scheduled' && (
                  <button className="btn btn-ghost btn-sm" style={{fontSize:'0.7rem',padding:'3px 8px'}} onClick={()=>updateStatus(a.id,'completed')}>
                    <I c="fa-circle-check" style={{marginRight:3,color:'#16a34a'}}/>{t.completed}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" style={{fontSize:'0.7rem',padding:'3px 8px'}} onClick={()=>startEdit(a)}>
                  <I c="fa-pen" style={{marginRight:3}}/>{t.edit}
                </button>
                <button className="btn btn-ghost btn-sm" style={{fontSize:'0.7rem',padding:'3px 8px',color:'#dc2626'}} onClick={()=>handleDelete(a.id)}>
                  <I c="fa-trash"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Medications ───────────────────────────────────────────────────────────────
function MedicationsTab({ t }) {
  const { lang, darkMode } = useUI();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ drug_name:'', dosage:'', frequency:'', start_date:'', end_date:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [checkingInter, setCheckingInter] = useState(false);
  const [msg, setMsg] = useState('');

  const FREQUENCIES_EN = ['Once daily','Twice daily','Three times daily','Every 8 hours','Every 12 hours','Weekly','As needed'];
  const FREQUENCIES_SW = ['Mara moja kwa siku','Mara mbili kwa siku','Mara tatu kwa siku','Kila masaa 8','Kila masaa 12','Kila wiki','Inapohitajika'];
  const FREQUENCIES = lang==='sw' ? FREQUENCIES_SW : FREQUENCIES_EN;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/medications')
      .then(r => { setMeds(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleAdd = async () => {
    if (!form.drug_name) { setMsg(lang==='sw'?'Jina la dawa linahitajika.':'Drug name is required.'); return; }
    setSaving(true); setMsg('');
    try {
      await api.post('/api/medications', form);
      setShowForm(false); setForm({ drug_name:'', dosage:'', frequency:'', start_date:'', end_date:'', notes:'' });
      load();
    } catch { setMsg(lang==='sw'?'Imeshindwa kuongeza dawa.':'Failed to add medication.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.deleteRecord)) return;
    await api.delete(`/api/medications/${id}`); load();
  };

  const checkInteractions = async () => {
    setCheckingInter(true); setInteractions([]);
    try {
      const drugs = meds.map(m => m.drug_name);
      const res = await api.post('/api/check-interactions', { drugs });
      setInteractions(res.data.interactions || []);
    } catch { setInteractions([]); }
    setCheckingInter(false);
  };

  const sevColor = { severe:'#dc2626', moderate:'#d97706', mild:'#0891b2', beneficial:'#16a34a' };

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
        <h3 style={{fontSize:'1rem',fontFamily:'Outfit,sans-serif',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          <I c="fa-capsules" style={{color:'#16a34a'}}/>{t.medications} ({meds.length})
        </h3>
        <div style={{display:'flex',gap:6}}>
          {meds.length >= 2 && (
            <button className="btn btn-outline btn-sm" onClick={checkInteractions} disabled={checkingInter}>
              {checkingInter ? <><span className="spinner" style={{width:12,height:12}}/> {lang==='sw'?'Inakagua...':'Checking...'}</> : <><I c="fa-triangle-exclamation" style={{marginRight:4}}/>{t.checkInteractions}</>}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={()=>setShowForm(!showForm)}>
            <I c={showForm?'fa-xmark':'fa-plus'} style={{marginRight:6}}/>{showForm ? t.cancel : t.addMedication}
          </button>
        </div>
      </div>

      {/* Drug interaction results */}
      {interactions.length > 0 && (
        <div style={{marginBottom:'1rem'}}>
          {interactions.map((inter, i) => (
            <div key={i} className="alert" style={{background:`${sevColor[inter.severity]||'#6b7280'}10`,borderColor:`${sevColor[inter.severity]||'#6b7280'}40`,color:sevColor[inter.severity]||'#374151',marginBottom:6}}>
              <strong><I c={inter.severity==='beneficial'?'fa-circle-check':'fa-triangle-exclamation'} style={{marginRight:6}}/>{inter.drug1} + {inter.drug2}</strong>
              <span style={{marginLeft:8,background:sevColor[inter.severity]||'#6b7280',color:'white',borderRadius:4,padding:'1px 6px',fontSize:'0.68rem',fontWeight:700,textTransform:'capitalize'}}>{inter.severity}</span>
              <br/><span style={{fontSize:'0.82rem'}}>{inter.description}</span>
              <div style={{fontSize:'0.7rem',marginTop:2,opacity:0.7}}>{lang==='sw'?'Chanzo':'Source'}: {inter.source}</div>
            </div>
          ))}
        </div>
      )}
      {interactions.length === 0 && checkingInter === false && meds.length >= 2 && (
        <div style={{display:'none'}}/>
      )}

      {showForm && (
        <div className="card" style={{marginBottom:'1.25rem',border:'1.5px solid #16a34a30'}}>
          <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem'}}>{t.addMedication}</h4>
          {msg && <div className="alert alert-error" style={{marginBottom:8}}>{msg}</div>}
          <div className="grid-2 mh-grid-2">
            <div className="form-group">
              <label className="form-label">{t.drugName} *</label>
              <input className="form-input" value={form.drug_name} onChange={set('drug_name')} placeholder={t.drugNamePH}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t.dosage}</label>
              <input className="form-input" value={form.dosage} onChange={set('dosage')} placeholder={t.dosagePH}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t.frequency}</label>
              <select className="form-input" value={form.frequency} onChange={set('frequency')}>
                <option value="">{lang==='sw'?'Chagua mara ngapi…':'Select frequency…'}</option>
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.startDate}</label>
              <input type="date" className="form-input" value={form.start_date} onChange={set('start_date')}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t.notes}</label>
            <input className="form-input" value={form.notes} onChange={set('notes')} placeholder={t.medNotesPH}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving}>
              {saving ? `${t.save}…` : <><I c="fa-plus" style={{marginRight:4}}/>{t.save}</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      {!meds.length ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#6b7280'}}>
          <I c="fa-capsules" style={{fontSize:'3rem',marginBottom:12,display:'block',color:'#d1d5db'}}/>
          <p>{t.noMedications}</p>
          <div style={{marginTop:8,fontSize:'0.78rem',color:'#9ca3af'}}>{lang==='sw'?'Ongeza dawa zako na virutubisho kuangalia mwingiliano.':'Add your current medications and supplements to check for interactions.'}</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
          {meds.map(m => (
            <div key={m.id} className="card" style={{padding:'0.9rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div style={{fontWeight:700,fontSize:'0.875rem',flex:1}}>
                  <I c="fa-capsules" style={{color:'#16a34a',marginRight:6}}/>{m.drug_name}
                </div>
                <button onClick={()=>handleDelete(m.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:4,borderRadius:4}}>
                  <I c="fa-xmark" style={{fontSize:'0.8rem'}}/>
                </button>
              </div>
              {m.dosage && <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:2}}><I c="fa-scale-balanced" style={{marginRight:4}}/>{m.dosage}</div>}
              {m.frequency && <div style={{fontSize:'0.78rem',color:'#6b7280',marginBottom:2}}><I c="fa-clock" style={{marginRight:4}}/>{m.frequency}</div>}
              {m.start_date && <div style={{fontSize:'0.72rem',color:'#9ca3af',marginTop:4}}><I c="fa-calendar" style={{marginRight:4}}/>{lang==='sw'?'Ilianza':'Started'} {m.start_date}</div>}
              {m.notes && <div style={{fontSize:'0.72rem',color:'#6b7280',marginTop:4,fontStyle:'italic'}}>{m.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:'1rem',padding:'0.75rem',background:darkMode?'#1c1200':'#fffbeb',borderRadius:10,border:`1px solid ${darkMode?'#854d0e':'#fcd34d'}`,fontSize:'0.78rem',color:darkMode?'#fde68a':'#92400e'}}>
        <I c="fa-triangle-exclamation" style={{marginRight:6,color:'#d97706'}}/>
        <strong>{lang==='sw'?'Muhimu':'Important'}:</strong> {lang==='sw'?'Daima mwambie daktari wako dawa zote na virutubisho. Kikaguzi cha mwingiliano ni chombo cha kumbukumbu tu.':'Always inform your doctor of all medications and supplements. The interaction checker is a reference tool only.'}
      </div>
    </div>
  );
}

// ── Health Trends ─────────────────────────────────────────────────────────────
function HealthTrends({ t }) {
  const { lang, darkMode } = useUI();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/trends')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'3rem'}}><span className="spinner" style={{margin:'0 auto',display:'block'}}/></div>;
  if (!data) return <div className="alert alert-warning">{lang==='sw'?'Imeshindwa kupakia mwelekeo. Je, mfumo unafanya kazi?':'Could not load trends. Is the backend running?'}</div>;

  const maxCount = Math.max(...(data.daily.map(d => d.count) || [1]), 1);

  return (
    <div>
      <h3 style={{fontSize:'1rem',fontFamily:'Outfit,sans-serif',fontWeight:700,marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8}}>
        <I c="fa-chart-line" style={{color:'#16a34a'}}/>{t.trends}
      </h3>

      {/* Summary stats */}
      <div className="grid-3" style={{marginBottom:'1.25rem'}}>
        {[
          { label:t.total, value:data.daily.reduce((s,d)=>s+d.count,0), color:'#16a34a', icon:'fa-stethoscope' },
          { label:lang==='sw'?'Siku Amilifu':'Days Active', value:data.daily.length, color:'#0891b2', icon:'fa-calendar-check' },
          { label:lang==='sw'?'Hali Zinazofuatiliwa':'Conditions Tracked', value:data.top_deficiencies.length, color:'#7c3aed', icon:'fa-brain' },
        ].map(s => (
          <div key={s.label} className="card" style={{textAlign:'center',padding:'1rem',border:`1px solid ${s.color}20`}}>
            <I c={s.icon} style={{fontSize:'1.4rem',color:s.color,marginBottom:6,display:'block'}}/>
            <div style={{fontSize:'1.8rem',fontWeight:800,fontFamily:'Fraunces,serif',color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:'0.72rem',color:'#6b7280',marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily activity bar chart */}
      <div className="card" style={{marginBottom:'1rem'}}>
        <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem'}}>{t.last30Days}</h4>
        {data.daily.length === 0 ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#9ca3af',fontSize:'0.875rem'}}>
            {lang==='sw'?'Hakuna shughuli katika siku 30 zilizopita.':'No activity in the last 30 days. Use AI Chat to get started!'}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <div style={{display:'flex',gap:6,alignItems:'flex-end',minHeight:160,padding:'16px 0 40px',minWidth:`${Math.max(data.daily.length*38,300)}px`}}>
              {data.daily.map(d => (
                <div key={d.day} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,flex:'1 0 30px',minWidth:30,maxWidth:56}}>
                  <div style={{fontSize:'0.68rem',color:'#6b7280',fontWeight:700,marginBottom:4,whiteSpace:'nowrap'}}>{d.count}</div>
                  <div
                    title={`${new Date(d.day).toLocaleDateString('en-KE',{month:'short',day:'numeric'})}: ${d.count} ${lang==='sw'?'uchambuzi':'analyses'}`}
                    style={{
                      width:'80%', minWidth:18,
                      height:`${Math.max(Math.round((d.count/maxCount)*110), 10)}px`,
                      background:'linear-gradient(to top,#16a34a,#4ade80)',
                      borderRadius:'5px 5px 0 0',
                      transition:'height 0.4s ease',
                      cursor:'default',
                      boxShadow:'0 2px 6px rgba(22,163,74,0.2)',
                    }}/>
                  <div style={{
                    fontSize:'0.58rem',color:'#9ca3af',whiteSpace:'nowrap',
                    transform:'rotate(-45deg)',transformOrigin:'50% 0',
                    marginTop:8,lineHeight:1,
                  }}>
                    {new Date(d.day).toLocaleDateString('en-KE',{month:'short',day:'numeric'})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top deficiencies */}
      {data.top_deficiencies.length > 0 && (
        <div className="card">
          <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'1rem'}}>{t.topConditions}</h4>
          {data.top_deficiencies.map((d, i) => (
            <div key={d.name} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:i<data.top_deficiencies.length-1?`1px solid ${darkMode?'#334155':'#f3f4f6'}`:'none'}}>
              <span style={{fontSize:'0.75rem',fontWeight:800,color:'#9ca3af',width:20,textAlign:'center'}}>#{i+1}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.85rem',fontWeight:600,marginBottom:2}}>{swName(d.name, lang)}</div>
                <div style={{height:6,background:darkMode?'#334155':'#f3f4f6',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(to right,#16a34a,#4ade80)',width:`${(d.count/data.top_deficiencies[0].count)*100}%`,borderRadius:3}}/>
                </div>
              </div>
              <span style={{fontSize:'0.8rem',fontWeight:700,color:'#16a34a',minWidth:28,textAlign:'right'}}>{d.count}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile({ t }) {
  const { user, login, token, logout } = useAuth();
  const { lang, setLang, darkMode, setDarkMode } = useUI();
  const [form, setForm] = useState({
    name: user?.name||'', age: user?.age||'', blood_group: user?.blood_group||'',
    allergies: user?.allergies||'', chronic_conditions: user?.chronic_conditions||'',
    emergency_contact: user?.emergency_contact||'', emergency_phone: user?.emergency_phone||'',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const set = k => e => setForm({...form,[k]:e.target.value});

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const res = await api.put('/api/profile', { ...form, dark_mode: darkMode, language: lang });
      login(res.data, token);
      setMsg(t.profileUpdated);
    } catch { setMsg(t.profileError); }
    setSaving(false);
  };

  // Section card wrapper
  const Section = ({ icon, label, color='#16a34a', children }) => (
    <div className="card" style={{marginBottom:'1rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1rem',paddingBottom:'0.6rem',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}`}}>
        <div style={{width:32,height:32,borderRadius:10,background:`${color}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <I c={icon} style={{color,fontSize:'0.95rem'}}/>
        </div>
        <span style={{fontWeight:700,fontSize:'0.82rem',textTransform:'uppercase',letterSpacing:'0.05em',color}}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{maxWidth:680,margin:'0 auto'}}>

      {/* Avatar + name banner */}
      <div className="card" style={{marginBottom:'1rem',background:'linear-gradient(135deg,#052e16,#16a34a)',border:'none',padding:'1.5rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'3px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontSize:'1.8rem',fontWeight:700,color:'white'}}>{(user?.name||'U')[0].toUpperCase()}</span>
          </div>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:'1.1rem'}}>{user?.name}</div>
            <div style={{color:'#86efac',fontSize:'0.8rem',marginTop:2}}>{user?.email}</div>
            <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
              {user?.blood_group && (
                <span style={{background:'rgba(255,255,255,0.15)',color:'white',borderRadius:6,padding:'2px 10px',fontSize:'0.72rem',fontWeight:700}}>
                  <I c="fa-droplet" style={{marginRight:4}}/>{user.blood_group}
                </span>
              )}
              <span style={{background:'rgba(255,255,255,0.12)',color:'#86efac',borderRadius:6,padding:'2px 10px',fontSize:'0.72rem'}}>
                <I c="fa-user-check" style={{marginRight:4}}/>{t.profile}
              </span>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className={`alert ${msg===t.profileUpdated?'alert-success':'alert-error'}`} style={{marginBottom:'1rem'}}>{msg}</div>}

      <form onSubmit={handleSave}>

        {/* ── Preferences ── */}
        <Section icon="fa-sliders" label={t.preferences} color="#7c3aed">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${darkMode?'#334155':'#f3f4f6'}`}}>
            <span style={{fontSize:'0.875rem',display:'flex',alignItems:'center',gap:8}}>
              <I c="fa-moon" style={{color:'#7c3aed',width:16}}/>{t.darkMode}
            </span>
            <button type="button" onClick={()=>setDarkMode(!darkMode)} style={{width:46,height:26,borderRadius:13,background:darkMode?'#16a34a':'#d1d5db',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
              <span style={{position:'absolute',top:3,left:darkMode?23:3,width:20,height:20,background:'white',borderRadius:'50%',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.25)'}}/>
            </button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0'}}>
            <span style={{fontSize:'0.875rem',display:'flex',alignItems:'center',gap:8}}>
              <I c="fa-language" style={{color:'#0891b2',width:16}}/>{t.language}
            </span>
            <div style={{display:'flex',gap:4}}>
              {['en','sw'].map(l => (
                <button type="button" key={l} onClick={()=>setLang(l)}
                  style={{padding:'5px 14px',borderRadius:8,border:'1.5px solid',borderColor:lang===l?'#16a34a':(darkMode?'#334155':'#e5e7eb'),background:lang===l?'#16a34a':'transparent',color:lang===l?'white':(darkMode?'#94a3b8':undefined),cursor:'pointer',fontSize:'0.8rem',fontWeight:600,transition:'all 0.15s'}}>
                  {l==='en'?'English':'Kiswahili'}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Personal Details ── */}
        <Section icon="fa-id-card" label={t.identity} color="#0891b2">
          <div className="grid-2 mh-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group" style={{gridColumn:'1/-1'}}>
              <label className="form-label"><I c="fa-user" style={{marginRight:5,color:'#6b7280'}}/>{t.fullName}</label>
              <input className="form-input" value={form.name} onChange={set('name')} required/>
            </div>
            <div className="form-group">
              <label className="form-label"><I c="fa-cake-candles" style={{marginRight:5,color:'#6b7280'}}/>{t.age}</label>
              <input type="number" className="form-input" value={form.age} onChange={set('age')} min="1" max="120" placeholder="e.g. 28"/>
            </div>
            <div className="form-group">
              <label className="form-label"><I c="fa-droplet" style={{marginRight:5,color:'#dc2626'}}/>{t.bloodGroup}</label>
              <select className="form-input" value={form.blood_group} onChange={set('blood_group')}>
                <option value="">{t.unknown}</option>
                {BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Health Information ── */}
        <Section icon="fa-notes-medical" label={t.healthInfo} color="#d97706">
          <div className="form-group">
            <label className="form-label">
              <I c="fa-triangle-exclamation" style={{marginRight:5,color:'#d97706'}}/>{t.knownAllergies}
            </label>
            <input className="form-input" value={form.allergies} onChange={set('allergies')} placeholder={t.allergiesPH}/>
            <div style={{fontSize:'0.68rem',color:'#d97706',marginTop:3,display:'flex',alignItems:'center',gap:4}}>
              <I c="fa-shield-halved"/>{t.allergyNote}
            </div>
          </div>
          <div className="form-group" style={{marginTop:10}}>
            <label className="form-label">
              <I c="fa-heart-pulse" style={{marginRight:5,color:'#dc2626'}}/>{t.chronicConditions}
            </label>
            <input className="form-input" value={form.chronic_conditions} onChange={set('chronic_conditions')} placeholder={t.chronicPH}/>
          </div>
        </Section>

        {/* ── Emergency Contact ── */}
        <Section icon="fa-phone-flip" label={t.emergencyContact} color="#dc2626">
          <div className="grid-2 mh-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group">
              <label className="form-label">{t.contactName}</label>
              <input className="form-input" value={form.emergency_contact} onChange={set('emergency_contact')} placeholder={t.contactNamePH}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t.contactPhone}</label>
              <input className="form-input" value={form.emergency_phone} onChange={set('emergency_phone')} placeholder={t.contactPhonePH}/>
            </div>
          </div>
          <div style={{fontSize:'0.72rem',color:'#6b7280',marginTop:4}}>
            <I c="fa-circle-info" style={{marginRight:4,color:'#0891b2'}}/>{lang==='sw'?'Wasiliani hutumiwa kutuma arifa za SOS zinapoanzishwa.':'This contact receives SOS alerts when triggered.'}
          </div>
        </Section>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{width:'100%',justifyContent:'center',padding:'0.8rem',marginBottom:'1rem',fontSize:'1rem'}}>
          {saving ? <><span className="spinner" style={{width:16,height:16}}/> {t.save}…</> : <><I c="fa-floppy-disk" style={{marginRight:8}}/>{t.saveProfile}</>}
        </button>
      </form>

      {/* ── Danger Zone ── */}
      <div className="card" style={{border:'1.5px solid #fca5a5'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1rem',paddingBottom:'0.6rem',borderBottom:`1px solid ${darkMode?'#2d1515':'#fef2f2'}`}}>
          <div style={{width:32,height:32,borderRadius:10,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <I c="fa-skull-crossbones" style={{color:'#dc2626',fontSize:'0.9rem'}}/>
          </div>
          <span style={{fontWeight:700,fontSize:'0.82rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'#dc2626'}}>{t.dangerZone}</span>
        </div>
        <DangerAction
          label={t.deleteHistory}
          desc={t.deleteHistoryDesc}
          btnLabel={t.deleteHistoryBtn}
          confirmText={lang==='sw'?'FUTA HISTORIA':'DELETE HISTORY'}
          icon="fa-trash-can"
          onConfirm={async () => { await api.delete('/api/history'); setMsg(lang==='sw'?'Historia yote imefutwa.':'All history deleted.'); }}
          t={t}
        />
        <hr style={{border:'none',borderTop:'1px solid #fef2f2',margin:'0.75rem 0'}}/>
        <DangerAction
          label={t.deleteAccount}
          desc={t.deleteAccountDesc}
          btnLabel={t.deleteAccountBtn}
          confirmText={lang==='sw'?'FUTA AKAUNTI':'DELETE MY ACCOUNT'}
          icon="fa-user-slash"
          requirePassword
          onConfirm={async (pwd) => { await api.delete('/api/account', { data: { password: pwd } }); logout(); }}
          t={t}
        />
      </div>
    </div>
  );
}

// ── Danger Action helper ───────────────────────────────────────────────────────
function DangerAction({ label, desc, btnLabel, icon, onConfirm, confirmText, requirePassword, t }) {
  const { darkMode } = useUI();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pwd, setPwd]   = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const doIt = async () => {
    setBusy(true); setErr('');
    try { await onConfirm(pwd); setOpen(false); }
    catch (e) { setErr(e.response?.data?.error || (t?.operationFailed||'Operation failed.')); }
    setBusy(false);
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:'0.875rem'}}>{label}</div>
          <div style={{fontSize:'0.75rem',color:'#6b7280',marginTop:2}}>{desc}</div>
        </div>
        <button type="button" onClick={()=>{setOpen(!open);setTyped('');setPwd('');setErr('');}}
          className="btn btn-sm" style={{background:darkMode?'#1c0808':'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5',flexShrink:0,whiteSpace:'nowrap'}}>
          <I c={icon} style={{marginRight:5}}/>{btnLabel}
        </button>
      </div>
      {open && (
        <div style={{marginTop:10,background:darkMode?'#1a0808':'#fff5f5',border:'1px solid #fca5a5',borderRadius:8,padding:'0.75rem'}}>
          <div style={{fontSize:'0.78rem',color:'#dc2626',marginBottom:6}}>
            {t?.typeToConfirm||'Type to confirm:'} <strong>{confirmText}</strong>
          </div>
          <input className="form-input" value={typed} onChange={e=>setTyped(e.target.value)}
            placeholder={confirmText} style={{marginBottom:6,borderColor:'#fca5a5'}}/>
          {requirePassword && (
            <input type="password" className="form-input" value={pwd} onChange={e=>setPwd(e.target.value)}
              placeholder={t?.passwordConfirm||'Enter your password to confirm'} style={{marginBottom:6,borderColor:'#fca5a5'}}/>
          )}
          {err && <div style={{fontSize:'0.75rem',color:'#dc2626',marginBottom:6}}>{err}</div>}
          <div style={{display:'flex',gap:6}}>
            <button type="button" onClick={doIt}
              disabled={typed !== confirmText || busy || (requirePassword && !pwd)}
              className="btn btn-sm" style={{background:'#dc2626',color:'white',border:'none',opacity:typed!==confirmText?0.5:1}}>
              {busy ? <span className="spinner" style={{width:13,height:13}}/> : <><I c={icon} style={{marginRight:4}}/>{btnLabel}</>}
            </button>
            <button type="button" onClick={()=>setOpen(false)} className="btn btn-ghost btn-sm">{t?.cancel||'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SOS Modal ─────────────────────────────────────────────────────────────────
function SOSModal({ onClose, user }) {
  const { lang, darkMode } = useUI();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const sw = lang === 'sw';
  const modalBg = darkMode ? '#1e293b' : 'white';
  const modalTx = darkMode ? '#f1f5f9' : '#111827';
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);
  const [loc, setLoc]         = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const sendSOS = async () => {
    setSending(true);
    try {
      const res = await api.post('/api/sos', loc || {});
      setResult(res.data);
    } catch { setResult({ error: sw?'SOS imeshindwa. Piga 999 moja kwa moja.':'SOS failed. Please call 999 directly.' }); }
    setSending(false);
  };

  const EMERG_NUMBERS = [
    [sw?'Polisi / Ambulensi':'Police / Ambulance', '999'],
    [sw?'Ambulensi (mbadala)':'Ambulance (alt)', '1199'],
    ['Red Cross', '0800 720 990'],
    [sw?'Afya bila malipo':'Toll-Free Health', '0800 723 253'],
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:modalBg,borderRadius:16,padding:'1.5rem',maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.4)',color:modalTx,border:darkMode?'1px solid #334155':'none'}}>
        <div style={{textAlign:'center',marginBottom:'1.25rem'}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:darkMode?'#1c0808':'#fef2f2',border:'3px solid #dc2626',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
            <I c="fa-circle-exclamation" style={{fontSize:'1.8rem',color:'#dc2626'}}/>
          </div>
          <h2 style={{fontFamily:'Fraunces,serif',color:'#dc2626',fontSize:'1.4rem',marginBottom:4}}>{t.emergency} SOS</h2>
          <p style={{fontSize:'0.875rem',color:darkMode?'#94a3b8':'#6b7280'}}>{t.sosConfirm}</p>
        </div>

        <div style={{background:darkMode?'#1c0808':'#fef2f2',border:`1px solid ${darkMode?'#7f1d1d':'#fecaca'}`,borderRadius:10,padding:'0.75rem',marginBottom:'1rem'}}>
          <div style={{fontWeight:700,fontSize:'0.8rem',color:'#dc2626',marginBottom:6}}>
            {sw?'Nambari za Dharura — Piga Sasa':'Emergency Numbers — Call Now'}
          </div>
          {EMERG_NUMBERS.map(([label, num]) => (
            <div key={num} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${darkMode?'#7f1d1d':'#fca5a5'}`}}>
              <span style={{fontSize:'0.82rem',color:darkMode?'#fca5a5':'#374151'}}>{label}</span>
              <a href={`tel:${num.replace(/\s/g,'')}`} style={{fontWeight:800,fontSize:'0.95rem',color:'#f87171',textDecoration:'none'}}>{num}</a>
            </div>
          ))}
        </div>

        {loc && <div style={{fontSize:'0.78rem',color:'#16a34a',marginBottom:'0.75rem',textAlign:'center',background:darkMode?'#052e16':'#f0fdf4',borderRadius:8,padding:'6px 10px'}}><I c="fa-location-dot" style={{marginRight:4}}/>{sw?'Eneo limegunduliwa — litajumuishwa katika arifa':'Location detected — will be included in alert'}</div>}

        {result ? (
          result.error ? (
            <div className="alert alert-error">{result.error}</div>
          ) : (
            <div>
              <div className="alert alert-success"><I c="fa-circle-check" style={{marginRight:6}}/>{t.sosSent}</div>
              {result.nearby_hospitals?.length > 0 && (
                <div style={{marginTop:'0.75rem'}}>
                  <div style={{fontWeight:700,fontSize:'0.8rem',marginBottom:6,color:modalTx}}>{sw?'Hospitali za Dharura Zilizo Karibu:':'Nearest Emergency Hospitals:'}</div>
                  {result.nearby_hospitals.map(h => (
                    <div key={h.name} style={{padding:'6px 10px',background:darkMode?'#052e16':'#f0fdf4',border:`1px solid ${darkMode?'#166534':'#bbf7d0'}`,borderRadius:8,marginBottom:6,fontSize:'0.82rem'}}>
                      <div style={{fontWeight:700,color:'#16a34a'}}>{h.name}</div>
                      <div style={{color:darkMode?'#94a3b8':'#374151'}}>{h.distance_km} km · <a href={`tel:${h.phone}`} style={{color:'#dc2626',fontWeight:700}}>{h.phone}</a></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-danger" style={{flex:2,justifyContent:'center'}} onClick={sendSOS} disabled={sending}>
              {sending ? <><span className="spinner" style={{width:16,height:16}}/> {sw?'Inatuma…':'Sending…'}</> : <><I c="fa-bell" style={{marginRight:6}}/>{t.sendSOS}</>}
            </button>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={onClose}>{t.close}</button>
          </div>
        )}
        {result && <button className="btn btn-ghost" style={{width:'100%',justifyContent:'center',marginTop:8}} onClick={onClose}>{t.close}</button>}
      </div>
    </div>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
const TABS = [
  { key:'chat',         icon:'fa-stethoscope',       labelKey:'aiChat'       },
  { key:'history',      icon:'fa-clock-rotate-left',  labelKey:'history'      },
  { key:'appointments', icon:'fa-calendar-check',     labelKey:'appointments' },
  { key:'medications',  icon:'fa-capsules',           labelKey:'medications'  },
  { key:'trends',       icon:'fa-chart-line',          labelKey:'trends'       },
  { key:'hospitals',    icon:'fa-hospital',            labelKey:'hospitals'    },
  { key:'profile',      icon:'fa-user',               labelKey:'profile'      },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { lang, setLang, darkMode, setDarkMode } = useUI();
  const [tab, setTab] = useState('chat');
  const [showSOS, setShowSOS] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <div style={{minHeight:'100vh',transition:'background 0.2s'}}>
      <style>{DARK_STYLE}</style>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'1rem 1rem'}}>

        {/* Header */}
        <div className="mh-header-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#052e16,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <MediLogo size={24}/>
            </div>
            <div>
              <h2 style={{fontSize:'1.1rem',marginBottom:1,display:'flex',alignItems:'center',gap:6}}>
                {t.hello}, <strong>{user?.name?.split(' ')[0]}</strong>
              </h2>
              <p style={{fontSize:'0.72rem',color:'#6b7280',margin:0}}>{t.dashboard}</p>
            </div>
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
            {user?.blood_group && (
              <span style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:8,padding:'4px 8px',fontSize:'0.72rem',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
                <I c="fa-droplet"/>{user.blood_group}
              </span>
            )}
            <button onClick={()=>setDarkMode(!darkMode)} title={t.darkMode}
              style={{background:darkMode?'#374151':'#f3f4f6',border:`1px solid ${darkMode?'#4b5563':'#e5e7eb'}`,borderRadius:8,padding:'6px 9px',cursor:'pointer',color:darkMode?'#f9fafb':'#374151',fontSize:'0.85rem'}}>
              <I c={darkMode?'fa-sun':'fa-moon'}/>
            </button>
            <button onClick={()=>setLang(lang==='en'?'sw':'en')} title={t.language}
              style={{background:darkMode?'#374151':'#f3f4f6',border:`1px solid ${darkMode?'#4b5563':'#e5e7eb'}`,borderRadius:8,padding:'5px 9px',cursor:'pointer',color:darkMode?'#f9fafb':'#374151',fontSize:'0.72rem',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
              <I c="fa-language"/>{lang.toUpperCase()}
            </button>
            <button onClick={()=>setShowSOS(true)} className="btn btn-sm"
              style={{background:'#dc2626',color:'white',border:'none',animation:'sosPulse 2s ease-in-out infinite',padding:'6px 10px'}}>
              <I c="fa-circle-exclamation" style={{marginRight:4}}/>SOS
            </button>
          </div>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="tabs mh-tabs-wrap" style={{overflowX:'auto',WebkitOverflowScrolling:'touch',marginBottom:'1rem'}}>
          {TABS.map(tab_info => (
            <button key={tab_info.key} className={`tab ${tab===tab_info.key?'active':''}`} onClick={()=>setTab(tab_info.key)}
              title={t[tab_info.labelKey]}>
              <I c={tab_info.icon} style={{marginRight:4}}/><span className="mh-tab-label-long">{t[tab_info.labelKey]}</span>
            </button>
          ))}
        </div>

        {tab==='chat'         && <Chatbot user={user} lang={lang}/>}
        {tab==='history'      && <History t={t} lang={lang}/>}
        {tab==='appointments' && <AppointmentsTab t={t}/>}
        {tab==='medications'  && <MedicationsTab t={t}/>}
        {tab==='trends'       && <HealthTrends t={t}/>}
        {tab==='hospitals'    && <HospitalMap/>}
        {tab==='profile'      && <Profile t={t}/>}

        {showSOS && <SOSModal onClose={()=>setShowSOS(false)} user={user}/>}
      </div>
      <style>{`
        @keyframes sosPulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
      `}</style>
    </div>
  );
}