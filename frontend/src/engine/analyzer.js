// MediHelp AI Engine (JavaScript)
// Kenya-focused Nutritional Deficiency Analysis
// Runs entirely in the browser - no backend required for core analysis

// ── Synonym / Alias Map ───────────────────────────────────────────────────────
const SYNONYMS = {
  // Fatigue / energy
  "tired": "fatigue", "tiredness": "fatigue", "exhausted": "fatigue",
  "exhaustion": "fatigue", "no energy": "fatigue", "low energy": "fatigue",
  "lethargic": "fatigue", "lethargy": "fatigue", "weak": "weakness",
  "always sleepy": "fatigue", "constantly tired": "fatigue",
  "feeling tired": "fatigue", "feel tired": "fatigue", "very tired": "fatigue",
  "always tired": "fatigue", "so tired": "fatigue",
  // Hair
  "hair falling": "hair loss", "hair is falling": "hair loss",
  "hair fall": "hair loss", "falling hair": "hair loss",
  "losing hair": "hair loss", "my hair falls": "hair loss",
  "hair is falling out": "hair loss", "hair falling out": "hair loss",
  "bald": "hair loss", "baldness": "hair loss",
  // Dizziness
  "dizzy": "dizzy", "dizziness": "dizzy", "lightheaded": "dizzy",
  "light headed": "dizzy", "spinning": "dizzy", "vertigo": "dizzy",
  "feel dizzy": "dizzy", "get dizzy": "dizzy", "getting dizzy": "dizzy",
  // Skin
  "dry skin": "dry skin", "rough skin": "rough skin", "itchy skin": "dry skin",
  "flaky skin": "dry skin", "skin is dry": "dry skin", "rough dry skin": "rough skin",
  // Pale
  "pale skin": "pale", "pallor": "pale", "looking pale": "pale",
  "i look pale": "pale", "skin pale": "pale", "yellow skin": "pale",
  "yellowish": "pale", "white skin": "pale",
  // Breathing
  "breathlessness": "breathless", "short of breath": "breathless",
  "shortness of breath": "breathless", "difficulty breathing": "breathless",
  "cant breathe": "breathless", "breathe easily": "breathless",
  "easily breathless": "breathless",
  // Pain - bones
  "aching bones": "bone pain", "bone ache": "bone pain", "bones hurt": "bone pain",
  "bone hurts": "bone pain", "my bones hurt": "bone pain",
  "joint pain": "bone pain", "aching joints": "bone pain",
  "back ache": "back pain", "backache": "back pain",
  "lower back pain": "back pain", "back hurts": "back pain",
  "my back hurts": "back pain", "back is sore": "back pain",
  // Muscle
  "muscle pain": "muscle weakness", "muscles weak": "muscle weakness",
  "muscles ache": "muscle weakness", "my muscles": "muscle weakness",
  "muscle cramp": "muscle cramps", "muscle cramping": "muscle cramps",
  "cramps": "muscle cramps", "leg cramps": "muscle cramps",
  "night cramps": "muscle cramps", "muscle spasm": "muscle spasms",
  // Nails
  "nails breaking": "brittle nails", "nails break": "brittle nails",
  "breaking nails": "brittle nails", "broken nails": "brittle nails",
  "nails are brittle": "brittle nails", "nails weak": "brittle nails",
  "peeling nails": "brittle nails", "nails brittle": "brittle nails",
  "white nails": "white spots nails", "spots on nails": "white spots nails",
  // Vision
  "cannot see at night": "night blindness", "cant see at night": "night blindness",
  "poor vision at night": "night blindness", "bad night vision": "night blindness",
  "can't see in dark": "night blindness", "night vision bad": "night blindness",
  "blurry vision": "poor night vision", "watery eyes": "dry eyes",
  "eyes dry": "dry eyes", "sore eyes": "dry eyes", "eyes are dry": "dry eyes",
  // Mood / mental
  "sad": "depression", "depressed": "depression", "low mood": "depression",
  "feel depressed": "depression", "feeling depressed": "depression",
  "mood swings": "mood changes", "anxious": "mood changes", "anxiety": "mood changes",
  "irritable": "irritability", "irritated": "irritability",
  "forgetful": "forgetful", "memory loss": "memory", "poor memory": "memory",
  "cannot concentrate": "brain fog", "cant concentrate": "brain fog",
  "brain fog": "brain fog", "foggy mind": "brain fog",
  // Immunity
  "frequent colds": "frequent colds", "always sick": "frequent colds",
  "getting sick often": "frequent colds", "keep getting sick": "frequent colds",
  "always getting sick": "frequent colds", "getting sick": "frequent colds",
  "sick often": "frequent colds", "catching colds": "frequent colds",
  "low immunity": "poor immunity", "weak immune": "poor immunity",
  "weak immunity": "poor immunity", "poor immunity": "poor immunity",
  "infections often": "frequent infections", "frequent infections": "frequent infections",
  "keep getting infections": "frequent infections",
  // Digestion
  "loose stool": "diarrhea", "running stomach": "diarrhea",
  "diarrhoea": "diarrhea", "stomach upset": "diarrhea",
  "watery stool": "diarrhea", "loose motions": "diarrhea",
  "constipated": "constipation", "cannot pass stool": "constipation",
  "no appetite": "poor appetite", "not eating": "poor appetite",
  "loss of appetite": "poor appetite", "no hunger": "poor appetite",
  "don't feel hungry": "poor appetite",
  // Swelling
  "swollen": "oedema", "swelling": "oedema", "puffy": "oedema",
  "bloated": "swollen belly", "bloating": "swollen belly", "pot belly": "swollen belly",
  "puffy face": "swollen face", "face swollen": "swollen face",
  "face is puffy": "swollen face",
  // Thyroid / neck
  "neck swelling": "goitre", "swollen neck": "goitre", "neck lump": "goitre",
  "neck is swelling": "goitre", "lump in neck": "goitre",
  "thyroid problem": "thyroid", "thyroid swelling": "goitre",
  // Heart
  "heart racing": "palpitations", "fast heartbeat": "palpitations",
  "heart pounding": "palpitations", "heart skipping": "palpitations",
  "racing heart": "palpitations",
  // Cold sensitivity
  "always cold": "cold sensitivity", "feel cold always": "cold sensitivity",
  "cold hands and feet": "cold hands",
  // Wound healing / bruising (Vitamin C)
  "bruise easily": "bruising easily", "easy bruising": "bruising easily",
  "bruising": "bruising easily", "bruises": "bruising easily",
  "wounds wont heal": "slow wound healing", "wounds dont heal": "slow wound healing",
  "wounds not healing": "slow wound healing", "cuts wont heal": "slow wound healing",
  "slow to heal": "slow wound healing", "healing slowly": "slow wound healing",
  "wound healing": "slow wound healing",
  "gums bleed": "bleeding gums", "gum bleeding": "bleeding gums",
  "bleeding gum": "bleeding gums", "gums are bleeding": "bleeding gums",
  // Growth / children
  "not growing": "stunted growth", "slow growth": "stunted growth",
  "underweight": "stunted growth", "child not growing": "stunted growth",
  "not gaining weight": "stunted growth",
  // Taste / smell
  "cannot taste": "loss of taste", "cant taste": "loss of taste",
  "no taste": "loss of taste", "cannot smell": "loss of smell",
  "cant smell": "loss of smell", "no smell": "loss of smell",
  // Headache
  "headaches": "headache", "head pain": "headache", "migraine": "headache",
  "head is aching": "headache",
  // Numbness / tingling
  "numb": "numbness", "hands numb": "numbness", "feet numb": "numbness",
  "my hands are numb": "numbness", "my feet are numb": "numbness",
  // Weight
  "gaining weight": "weight gain", "putting on weight": "weight gain",
  "weight increase": "weight gain", "getting fat": "weight gain",
  // Acne
  "pimples": "acne", "zits": "acne", "spots on face": "acne",
  // Wasting / muscle loss
  "muscle loss": "muscle wasting", "muscles wasting": "muscle wasting",
  "losing muscle": "muscle wasting", "thin arms": "muscle wasting",
  "thin legs": "muscle wasting",
  // Bone fractures
  "fracture": "bone fractures", "broken bone": "bone fractures",
  "tooth decay": "tooth decay", "teeth weak": "tooth decay",
  // Restless legs
  "restless legs": "restless legs", "legs restless at night": "restless legs",
  // Mouth
  "mouth ulcers": "mouth sores", "mouth ulcer": "mouth sores",
  "sore tongue": "sore tongue", "tongue pain": "sore tongue",
  "tongue sore": "sore tongue", "mouth sore": "mouth sores",
  // Stomach / liver
  "liver problem": "poor growth", "stomach pain": "poor appetite",
};

// ── Deficiency Knowledge Base ────────────────────────────────────────────────
const DEFICIENCIES = {
  iron: {
    id: "iron", name: "Iron Deficiency Anaemia", icon: "🩸",
    color: "#dc2626", bg: "#fef2f2",
    icd: "D50", severity: "Moderate",
    kenya_stat: "Affects ~35% of women of reproductive age in Kenya (KNBS 2022)",
    symptoms: [
      "fatigue","tiredness","weakness","pale","pallor","breathless","dizzy","dizziness",
      "cold hands","cold feet","brittle nails","hair loss","headache","palpitations",
      "tongue sore","difficulty swallowing","restless legs","spoon nails","anaemia","anemia"
    ],
    foods_recommended: [
      "Liver & offal (highest iron)", "Omena/dagaa (small dried fish)",
      "Dark green vegetables (sukuma wiki, spinach)", "Lentils & beans (dengu, njahi)",
      "Millet & sorghum ugali", "Pumpkin leaves (mrenda)", "Amaranth (terere)"
    ],
    foods_avoid: ["Tea/coffee within 1hr of meals", "Calcium-rich foods with iron meals"],
    tips: ["Take with citrus juice - Vitamin C triples absorption", "Cook in cast iron pot"],
    supplement: "Ferrous sulphate 200mg daily - consult a doctor or pharmacist first",
    risk_groups: ["Pregnant women", "Young children", "Women of reproductive age", "Vegans"],
    when_to_see_doctor: "If symptoms persist beyond 2 weeks or are severe"
  },
  vitamin_a: {
    id: "vitamin_a", name: "Vitamin A Deficiency", icon: "👁️",
    color: "#d97706", bg: "#fffbeb",
    icd: "E50", severity: "Moderate",
    kenya_stat: "Subclinical deficiency affects ~35% of children under 5 in Kenya",
    symptoms: [
      "night blindness","poor night vision","dry eyes","frequent infections","poor immunity",
      "dry skin","rough skin","delayed wound healing","stunted growth","xerophthalmia"
    ],
    foods_recommended: [
      "Orange-fleshed sweet potato (viazi vitamu)", "Carrots", "Pumpkin (maboga)",
      "Mango", "Papaya (pawpaw)", "Egg yolk", "Liver", "Dark leafy greens"
    ],
    foods_avoid: ["Excessive alcohol (depletes Vitamin A stores)"],
    tips: ["Eat with fat/oil - Vitamin A is fat-soluble", "Orange vegetables daily"],
    supplement: "Vitamin A 10,000 IU - only under medical supervision (toxic in excess)",
    risk_groups: ["Children under 5", "Pregnant women", "Breastfeeding mothers"],
    when_to_see_doctor: "Any vision changes - seek immediate attention"
  },
  vitamin_d: {
    id: "vitamin_d", name: "Vitamin D Deficiency", icon: "☀️",
    color: "#f59e0b", bg: "#fefce8",
    icd: "E55", severity: "Mild-Moderate",
    kenya_stat: "Paradoxically common despite equatorial sunshine due to indoor lifestyles",
    symptoms: [
      "bone pain","back pain","muscle weakness","fatigue","depression","mood changes",
      "frequent illness","hair loss","poor wound healing","sweating","rickets","osteoporosis"
    ],
    foods_recommended: [
      "Sardines & omena (small fish)", "Eggs (especially yolk)", "Fortified uji (porridge)",
      "Liver", "Mushrooms (sun-exposed)", "Fortified milk"
    ],
    foods_avoid: ["No specific avoidance needed"],
    tips: ["20 minutes of morning sunlight (7–10am) daily", "Sunlight is the best source"],
    supplement: "Vitamin D3 1000–2000 IU daily - confirm deficiency with blood test first",
    risk_groups: ["Office workers", "People with darker skin indoors", "Elderly", "Veiled women"],
    when_to_see_doctor: "Bone pain or muscle weakness lasting over 2 weeks"
  },
  vitamin_b12: {
    id: "vitamin_b12", name: "Vitamin B12 Deficiency", icon: "🧠",
    color: "#0891b2", bg: "#ecfeff",
    icd: "E53.8", severity: "Moderate-Severe",
    kenya_stat: "Rising due to increased vegetarianism; common in low-income diets lacking meat",
    symptoms: [
      "numbness","tingling","pins and needles","memory","forgetful","fatigue","weakness",
      "mouth sores","sore tongue","balance problems","mood changes","depression","pale"
    ],
    foods_recommended: [
      "Beef/goat liver", "Omena & sardines", "Eggs", "Milk & fermented milk (mursik)",
      "Beef & goat meat", "Fortified cereals"
    ],
    foods_avoid: ["Alcohol (interferes with absorption)"],
    tips: ["Only found in animal products - vegetarians must supplement", "Cooking slightly reduces B12"],
    supplement: "Methylcobalamin 500–1000mcg daily or B12 injection (doctor's prescription)",
    risk_groups: ["Strict vegetarians/vegans", "Elderly", "People on metformin"],
    when_to_see_doctor: "Neurological symptoms (numbness, balance) - urgent"
  },
  folate: {
    id: "folate", name: "Folate (Vitamin B9) Deficiency", icon: "🍃",
    color: "#16a34a", bg: "#f0fdf4",
    icd: "E53.8", severity: "Moderate",
    kenya_stat: "Critical for pregnant women; neural tube defects preventable with adequate folate",
    symptoms: [
      "fatigue","weakness","mouth sores","sore tongue","pale","megaloblastic anaemia",
      "irritability","diarrhea","poor growth","birth defects","neural tube"
    ],
    foods_recommended: [
      "Dark leafy greens (spinach, kale/sukuma wiki)", "Lentils (dengu)", "Beans (maharagwe)",
      "Avocado", "Broccoli", "Fortified uji", "Bananas"
    ],
    foods_avoid: ["Overcooking destroys folate - eat greens lightly cooked"],
    tips: ["Crucial before and during pregnancy", "Steam rather than boil vegetables"],
    supplement: "Folic acid 400–800mcg daily (5mg if pregnant, prescribed)",
    risk_groups: ["Pregnant women", "Women planning pregnancy", "Alcohol users"],
    when_to_see_doctor: "Pregnant women should see doctor immediately for prescription"
  },
  iodine: {
    id: "iodine", name: "Iodine Deficiency", icon: "🦋",
    color: "#7c3aed", bg: "#f5f3ff",
    icd: "E00", severity: "Moderate",
    kenya_stat: "Affects inland and highland areas; goitre belt runs through Rift Valley",
    symptoms: [
      "goitre","swollen neck","thyroid","weight gain","fatigue","cold sensitivity","slow heart",
      "constipation","dry skin","hair thinning","brain fog","memory","depression","swollen face"
    ],
    foods_recommended: [
      "Iodized salt (always use)", "Seafood (tilapia, omena)", "Eggs",
      "Dairy milk", "Ocean fish when available"
    ],
    foods_avoid: ["Raw cabbage, kale, cassava in large amounts (goitrogens)"],
    tips: ["Always use iodized table salt", "Add salt after cooking to preserve iodine"],
    supplement: "Only under doctor supervision - excess iodine is harmful",
    risk_groups: ["Inland/highland residents", "Pregnant women", "People avoiding salt"],
    when_to_see_doctor: "Any neck swelling - see a doctor"
  },
  zinc: {
    id: "zinc", name: "Zinc Deficiency", icon: "🛡️",
    color: "#0f766e", bg: "#f0fdfa",
    icd: "E60", severity: "Mild-Moderate",
    kenya_stat: "Common in children; contributes to stunting affecting 26% of under-5s in Kenya",
    symptoms: [
      "frequent colds","poor immunity","delayed wound healing","loss of taste","loss of smell",
      "diarrhea","poor appetite","slow growth","acne","hair loss","white spots nails"
    ],
    foods_recommended: [
      "Beef & goat meat (best source)", "Pumpkin seeds (mbegu za maboga)",
      "Beans & lentils", "Cashew nuts", "Eggs", "Whole grains"
    ],
    foods_avoid: ["Phytate-rich foods without preparation (soak beans overnight)"],
    tips: ["Soak legumes overnight to reduce phytates", "Ferment grains when possible"],
    supplement: "Zinc gluconate 15–25mg daily - short courses only",
    risk_groups: ["Young children", "Pregnant women", "People with diarrhea illness"],
    when_to_see_doctor: "Children with growth concerns or recurrent infections"
  },
  calcium: {
    id: "calcium", name: "Calcium Deficiency", icon: "🦴",
    color: "#64748b", bg: "#f8fafc",
    icd: "E58", severity: "Mild",
    kenya_stat: "Common due to low dairy consumption in many Kenyan communities",
    symptoms: [
      "muscle cramps","muscle spasms","tingling","numbness","brittle bones","weak bones",
      "tooth decay","poor teeth","rickets","osteoporosis","bone fractures","back pain"
    ],
    foods_recommended: [
      "Milk & fermented milk (mursik, yogurt)", "Omena/dagaa (eat the bones!)",
      "Dark green vegetables (kale, amaranth)", "Sesame seeds (simsim)",
      "Calcium-fortified uji", "Soybean products"
    ],
    foods_avoid: ["Excess caffeine & salt leach calcium", "High oxalate foods with meals"],
    tips: ["Needs Vitamin D for absorption", "Weight-bearing exercise strengthens bones"],
    supplement: "Calcium carbonate 500–1000mg daily with food",
    risk_groups: ["Women post-menopause", "Elderly", "People avoiding dairy"],
    when_to_see_doctor: "Any bone fracture from minor injury"
  },
  vitamin_c: {
    id: "vitamin_c", name: "Vitamin C Deficiency (Scurvy)", icon: "🍊",
    color: "#ea580c", bg: "#fff7ed",
    icd: "E54", severity: "Mild",
    kenya_stat: "Uncommon but seen in households with low fruit/vegetable intake",
    symptoms: [
      "bleeding gums","swollen gums","bruising easily","slow wound healing","joint pain",
      "fatigue","rough skin","corkscrew hair","dry skin","frequent infections"
    ],
    foods_recommended: [
      "Guava (highest Vitamin C)", "Oranges & lemons",
      "Tomatoes", "Mango", "Papaya", "Fresh greens (raw or lightly cooked)"
    ],
    foods_avoid: ["Overcooking destroys Vitamin C completely"],
    tips: ["Eat fruit raw or drink fresh juice", "Local guava has more Vitamin C than oranges"],
    supplement: "Vitamin C 500mg daily - safe and inexpensive",
    risk_groups: ["Smokers", "People with limited fruit access", "Alcoholics"],
    when_to_see_doctor: "Bleeding gums or spontaneous bruising - see a doctor"
  },
  protein: {
    id: "protein", name: "Protein Deficiency (Kwashiorkor)", icon: "💪",
    color: "#b45309", bg: "#fefce8",
    icd: "E46", severity: "Moderate-Severe",
    kenya_stat: "Affects ~11% of children under 5; major cause of stunting in Kenya",
    symptoms: [
      "swollen belly","oedema","swelling","muscle wasting","thin hair","hair discoloration",
      "poor growth","fatigue","slow recovery","poor wound healing","skin peeling","irritability"
    ],
    foods_recommended: [
      "Beans & lentils (maharagwe, dengu)", "Eggs", "Milk",
      "Groundnuts (karanga)", "Soybean flour added to ugali",
      "Omena/sardines", "Meat when affordable"
    ],
    foods_avoid: ["Low-protein staple-only diets (ugali alone)"],
    tips: ["Mix legumes with grains for complete protein", "Add groundnut paste to porridge"],
    supplement: "Food-first approach - supplements only with medical supervision for severe cases",
    risk_groups: ["Young children", "Weaning babies", "Elderly with poor appetite"],
    when_to_see_doctor: "Any child with swollen belly, oedema, or visible wasting - urgent"
  }
};

// ── Core analysis function ────────────────────────────────────────────────────
function normalizeText(text) {
  let lower = text.toLowerCase();
  // Sort longest-first so multi-word phrases match before single words
  const sorted = Object.entries(SYNONYMS).sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, canonical] of sorted) {
    // Use word-boundary regex to avoid partial word replacement (e.g. numb -> numbnessness)
    try {
      const escaped = phrase.replace(/[.*+?^=!:${}()|[\]\\\/]/g, "\\$&");
      const re = new RegExp("\\b" + escaped + "\\b", "g");
      lower = lower.replace(re, canonical);
    } catch {
      // Fallback for phrases that can't be converted to regex
      lower = lower.split(phrase).join(canonical);
    }
  }
  return lower;
}

export function analyzeSymptoms(text) {
  if (!text || text.trim().length < 3) return [];

  const normalized = normalizeText(text);
  const textLower = text.toLowerCase();
  // Word set from normalized text
  const words = new Set(normalized.match(/\b\w+\b/g) || []);

  const results = [];

  for (const [defId, deficiency] of Object.entries(DEFICIENCIES)) {
    const matched = [];

    for (const symptom of deficiency.symptoms) {
      const symptomLower = symptom.toLowerCase();
      const isMultiWord = symptomLower.includes(' ');
      let found = false;

      if (isMultiWord) {
        // Multi-word: substring match in normalized or original
        if (normalized.includes(symptomLower) || textLower.includes(symptomLower)) {
          found = true;
        }
      } else {
        // Single word: exact word boundary match in normalized or original
        if (words.has(symptomLower) || textLower.includes(symptomLower)) {
          found = true;
        }
      }

      if (found) matched.push(symptom);
    }

    if (matched.length > 0) {
      const raw = matched.length / deficiency.symptoms.length;
      const confidence = Math.min(Math.round(raw * 100 * 3.5 + 20), 95);
      results.push({
        ...deficiency,
        confidence,
        matched_symptoms: matched,
      });
    }
  }

  // Sort by confidence, return top 3
  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

export default DEFICIENCIES;

// ── Live API loader ─────────────────────────────────────────────────────────
// When admin edits the knowledge base, this fetches updated deficiencies
let _liveDeficiencies = null;

export async function loadLiveDeficiencies() {
  try {
    const res = await fetch('http://localhost:5000/api/deficiencies');
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        _liveDeficiencies = data.filter(d => d.active);
      }
    }
  } catch {
    // Backend not running - fall back to built-in knowledge base
    _liveDeficiencies = null;
  }
}

export function analyzeSymptomsFull(text) {
  if (!text || text.trim().length < 3) return [];
  const defs = _liveDeficiencies;
  if (!defs) return analyzeSymptoms(text); // fallback to built-in

  const normalized = normalizeText(text);
  const textLower = text.toLowerCase();
  const words = new Set(normalized.match(/\b\w+\b/g) || []);
  const results = [];
  for (const deficiency of defs) {
    const symptoms = Array.isArray(deficiency.symptoms) ? deficiency.symptoms : [];
    const matched = [];
    for (const symptom of symptoms) {
      const sl = symptom.toLowerCase();
      const isMultiWord = sl.includes(' ');
      if (isMultiWord ? (normalized.includes(sl) || textLower.includes(sl))
                      : (words.has(sl) || textLower.includes(sl))) {
        matched.push(symptom);
      }
    }
    if (matched.length > 0) {
      const confidence = Math.min(Math.round(matched.length / Math.max(symptoms.length, 1) * 100 * 3.5 + 20), 95);
      results.push({
        id: deficiency.id, name: deficiency.name, icon: deficiency.icon,
        color: deficiency.color, bg: deficiency.bg || '#f9fafb',
        icd: deficiency.icd, severity: deficiency.severity,
        confidence, matched_symptoms: matched,
        kenya_stat: deficiency.kenya_stat,
        foods_recommended: Array.isArray(deficiency.foods_recommended) ? deficiency.foods_recommended : [],
        foods_avoid: Array.isArray(deficiency.foods_avoid) ? deficiency.foods_avoid : [],
        tips: Array.isArray(deficiency.tips) ? deficiency.tips : [],
        supplement: deficiency.supplement,
        risk_groups: Array.isArray(deficiency.risk_groups) ? deficiency.risk_groups : [],
        when_to_see_doctor: deficiency.when_to_see_doctor,
      });
    }
  }
  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
