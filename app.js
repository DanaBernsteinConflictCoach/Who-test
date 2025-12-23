const MAIN_SITE = "https://MyWHOthoughts.com";
const STORAGE_KEY = "who_assessment_v2_dana";

const DEFAULTS = {
  // VALUES discovery
  proudMoment: "",
  proudWhy: "",
  upsetMoment: "",
  upsetWhy: "",

  // Candidate lists
  valueCandidates: [],
  valuesFinal: [],

  // PILLARS discovery
  happiestMoment: "",
  pillarCandidates: [],
  pillarsFinal: [],
  movedToValuesFromPillars: [],

  // Ideal Emotion
  idealEmotion: "",
  emotionWhy: "",
  emotionLevel: 8,

  // Trigger
  triggerStatement: "",
  triggerPlan: "",
};

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient","Empathy","Ethics",
  "Excellence","Fairness","Gratitude","Honesty","Impact","Independence","Inclusivity","Integrity","Justice","Kind",
  "Loyalty","Open Mind","Perseverance","Reliability","Resilience","Respect","Self Reliance","Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection","Connector",
  "Considerate","Creative","Earthy","Explorer","Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor","Introspective","Impact",
  "Kind","Laughter","Limitless","Listener","Love","Nerdy","Open Mind","Optimist","Passion","Patient","Peace","Playful",
  "Present","Problem Solver","Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful",
  "Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart","Valued","Wanted"
];

let state = loadState();
let stepIndex = 0;

const elApp = document.getElementById("app");
const elResults = document.getElementById("results");
const stepHost = document.getElementById("stepHost");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const backBtn  = document.getElementById("backBtn");
const nextBtn  = document.getElementById("nextBtn");

const editBtn  = document.getElementById("editBtn");
const copyBtn  = document.getElementById("copyBtn");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const resultsBody  = document.getElementById("resultsBody");

startBtn?.addEventListener("click", () => {
  elApp.hidden = false;
  elResults.hidden = true;
  document.getElementById("app").scrollIntoView({ behavior: "smooth", block: "start" });
  render();
});

resetBtn?.addEventListener("click", () => {
  state = structuredClone(DEFAULTS);
  stepIndex = 0;
  saveState();
  elResults.hidden = true;
  elApp.hidden = false;
  render();
});

backBtn?.addEventListener("click", () => {
  if (stepIndex > 0) stepIndex--;
  render();
});

nextBtn?.addEventListener("click", () => {
  if (!validateCurrentStep()) return;

  if (stepIndex < steps().length - 1) {
    stepIndex++;
    render();
  } else {
    showResults();
  }
});

editBtn?.addEventListener("click", () => {
  elResults.hidden = true;
  elApp.hidden = false;
  render();
  document.getElementById("app").scrollIntoView({ behavior: "smooth", block: "start" });
});

copyBtn?.addEventListener("click", async () => {
  const text = buildSummaryText();
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy summary"), 1200);
  } catch {
    alert("Couldn’t copy automatically. Here it is:\n\n" + text);
  }
});

function steps(){
  return [
    renderValuesPromptsStep,
    renderValuesRoadTestStep,
    renderPillarsStep,
    renderIdealEmotionStep,
    renderTriggerStep
  ];
}

function render(){
  elApp.hidden = false;
  elResults.hidden = true;

  const total = steps().length;
  const current = stepIndex + 1;

  progressFill.style.width = `${(current / total) * 100}%`;
  progressText.textContent = `Step ${current} of ${total}`;

  backBtn.disabled = stepIndex === 0;
  nextBtn.textContent = (stepIndex === total - 1) ? "Finish" : "Next";

  stepHost.innerHTML = "";
  steps()[stepIndex]();
}

// ---------------- VALUES PROMPTS ----------------
function renderValuesPromptsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Values (Discover)</h2>
    <p>Discover your Values from proud moments and frustration moments.</p>

    <div class="block">
      <h3>Proud Moment</h3>
      <textarea id="proudMoment" placeholder="Example: achieving something...">${escapeHtml(state.proudMoment || "")}</textarea>
      <textarea id="proudWhy" placeholder="Why were you proud?">${escapeHtml(state.proudWhy || "")}</textarea>
    </div>

    <div class="block">
      <h3>Upset Moment</h3>
      <textarea id="upsetMoment" placeholder="Example: unfair treatment...">${escapeHtml(state.upsetMoment || "")}</textarea>
      <textarea id="upsetWhy" placeholder="Why did it bother you?">${escapeHtml(state.upsetWhy || "")}</textarea>
    </div>

    <div class="block">
      <h3>Candidate Values</h3>
      <div class="pills" id="valuePills"></div>
      <input id="customValue" type="text" placeholder="Add a value and press Enter" />
      <div id="candidateList" class="kv"></div>
    </div>
  `;

  stepHost.appendChild(wrap);

  const proudMoment = wrap.querySelector("#proudMoment");
  const proudWhy = wrap.querySelector("#proudWhy");
  const upsetMoment = wrap.querySelector("#upsetMoment");
  const upsetWhy = wrap.querySelector("#upsetWhy");

  [proudMoment, proudWhy, upsetMoment, upsetWhy].forEach(el => {
    el.addEventListener("input", () => {
      state.proudMoment = proudMoment.value;
      state.proudWhy = proudWhy.value;
      state.upsetMoment = upsetMoment.value;
      state.upsetWhy = upsetWhy.value;
      saveState();
    });
  });

  const pills = wrap.querySelector("#valuePills");
  VALUE_OPTIONS.forEach(v => pills.appendChild(makePill(v, state.valueCandidates, 18)));

  const custom = wrap.querySelector("#customValue");
  custom.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = custom.value.trim();
    if (!val) return;
    pushUnique(state.valueCandidates, val);
    custom.value = "";
    saveState();
    render();
  });

  wrap.querySelector("#candidateList").innerHTML =
    (state.valueCandidates.length
      ? state.valueCandidates.map(v => `• ${escapeHtml(v)}`).join("<br/>")
      : `<span class="muted">None yet. Add candidates.</span>`);
}

// ---------------- VALUES ROAD TEST ----------------
function renderValuesRoadTestStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";
  const candidates = (state.valueCandidates || []).slice();

  wrap.innerHTML = `
    <h2>Values (Road Test)</h2>
    <div id="roadList"></div>
    <h3>Confirmed Values</h3>
    <div id="valuesFinal" class="kv"></div>
  `;

  stepHost.appendChild(wrap);

  const roadList = wrap.querySelector("#roadList");
  if (!candidates.length){
    roadList.innerHTML = `<div class="muted">No candidates yet.</div>`;
    wrap.querySelector("#valuesFinal").innerHTML = `<span class="muted">None</span>`;
    return;
  }

  state.valuesFinal = Array.isArray(state.valuesFinal) ? state.valuesFinal : [];

  candidates.forEach((v) => {
    const row = document.createElement("div");
    row.style.marginBottom = "10px";
    const status = state.valuesFinal.includes(v) ? "yes" : "none";

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>${escapeHtml(v)}</div>
        <div>
          <button data-ans="yes">YES</button>
          <button data-ans="no">NO</button>
        </div>
      </div>
    `;

    row.querySelectorAll("button[data-ans]").forEach(btn => {
      btn.addEventListener("click", () => {
        removeIfExists(state.valuesFinal, v);
        if (btn.dataset.ans === "yes") pushUnique(state.valuesFinal, v);
        saveState();
        render();
      });
    });

    roadList.appendChild(row);
  });

  wrap.querySelector("#valuesFinal").innerHTML =
    (state.valuesFinal.length ? state.valuesFinal.map(v => `• ${escapeHtml(v)}`).join("<br/>") : `<span class="muted">None yet</span>`);
}

// ---------------- PILLARS ----------------
function renderPillarsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Pillars (Discover)</h2>
    <textarea id="happiestMoment" placeholder="Your happiest/best self moments">${escapeHtml(state.happiestMoment || "")}</textarea>
    <input id="customPillarTrait" placeholder="Add a pillar trait and press Enter" />
    <div id="pillarList" class="kv"></div>
    <div id="pillarRoad"></div>
    <div id="pillarsFinal" class="kv"></div>
  `;

  stepHost.appendChild(wrap);

  const happiestMoment = wrap.querySelector("#happiestMoment");
  happiestMoment.addEventListener("input", () => {
    state.happiestMoment = happiestMoment.value;
    saveState();
  });

  const custom = wrap.querySelector("#customPillarTrait");
  custom.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = custom.value.trim();
    if (!val) return;
    pushUnique(state.pillarCandidates, val);
    custom.value = "";
    saveState();
    render();
  });

  wrap.querySelector("#pillarList").innerHTML =
    (state.pillarCandidates.length ? state.pillarCandidates.map(x => `• ${escapeHtml(x)}`).join("<br/>") : `<span class="muted">None yet</span>`);

  state.pillarsFinal = Array.isArray(state.pillarsFinal) ? state.pillarsFinal : [];
  wrap.querySelector("#pillarsFinal").innerHTML =
    (state.pillarsFinal.length ? state.pillarsFinal.map(x => `• ${escapeHtml(x)}`).join("<br/>") : `<span class="muted">None yet</span>`);
}

// ---------------- IDEAL EMOTION ----------------
function renderIdealEmotionStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Ideal Emotion</h2>
    <select id="idealEmotion">
      <option value="">Select…</option>
      ${IDEAL_EMOTION_OPTIONS.map(x => `<option ${state.idealEmotion===x ? "selected":""} value="${x}">${x}</option>`).join("")}
    </select>
    <input id="emotionWhy" placeholder="Why" value="${escapeHtml(state.emotionWhy || "")}" />
  `;

  stepHost.appendChild(wrap);

  const sel = wrap.querySelector("#idealEmotion");
  sel.addEventListener("change", () => {
    state.idealEmotion = sel.value;
    saveState();
  });

  const why = wrap.querySelector("#emotionWhy");
  why.addEventListener("input", () => {
    state.emotionWhy = why.value;
    saveState();
  });
}

// ---------------- TRIGGER ----------------
function renderTriggerStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Trigger</h2>
    <input id="triggerStatement" placeholder="I’m not ..." value="${escapeHtml(state.triggerStatement || "")}" />
    <textarea id="triggerPlan" placeholder="Plan">${escapeHtml(state.triggerPlan || "")}</textarea>
  `;

  stepHost.appendChild(wrap);

  wrap.querySelector("#triggerStatement").addEventListener("input", (e) => { state.triggerStatement = e.target.value; saveState(); });
  wrap.querySelector("#triggerPlan").addEventListener("input", (e) => { state.triggerPlan = e.target.value; saveState(); });
}

// ---------------- UTILITIES ----------------
function makePill(label, arr, maxCount){
  const pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = label;
  pill.dataset.on = arr.includes(label) ? "true" : "false";

  pill.addEventListener("click", () => {
    const on = arr.includes(label);
    if (on) arr.splice(arr.indexOf(label), 1);
    else if (arr.length < maxCount) arr.push(label);
    saveState();
    render();
  });
  return pill;
}

function pushUnique(arr, val){ const clean = (val||"").trim(); if(clean && !arr.includes(clean)) arr.push(clean); }
function removeIfExists(arr, val){ const i = arr.indexOf(val); if(i>=0) arr.splice(i,1); }
function escapeHtml(str){ return String(str||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? {...structuredClone(DEFAULTS), ...JSON.parse(raw)} : structuredClone(DEFAULTS); }catch{return structuredClone(DEFAULTS);} }
function validateCurrentStep(){ return true; }
function buildSummaryText(){ return "WHO Snapshot\nValues: "+(state.valuesFinal||[]).join(", ")+"\nPillars: "+(state.pillarsFinal||[]).join(", ")+"\nIdeal Emotion: "+state.idealEmotion+"\nTrigger: "+state.triggerStatement; }

if(state.valueCandidates.length || state.valuesFinal.length || state.pillarCandidates.length || state.pillarsFinal.length || state.idealEmotion || state.triggerStatement){
  elApp.hidden = false;
  render();
}
