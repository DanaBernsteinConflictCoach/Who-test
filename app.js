const MAIN_SITE = "https://MyWHOthoughts.com";
const STORAGE_KEY = "who_assessment_v2_dana";

const DEFAULTS = {
  // VALUES discovery
  proudMoment: "",
  proudWhy: "",
  upsetMoment: "",
  upsetWhy: "",

  // Candidate lists
  valueCandidates: [],          // raw candidates (strings)
  valuesFinal: [],              // after road test YES
  movedToPillars: [],           // road test NO -> likely Pillar/trait

  // PILLARS discovery
  happiestMoment: "",
  pillarCandidates: [],          // raw candidates (strings)
  pillarsFinal: [],             // after pillar road test YES (is pillar)
  movedToValuesFromPillars: [], // pillar road test anger YES -> value

  // Ideal Emotion
  idealEmotion: "",
  emotionWhy: "",
  emotionLevel: 8, // 1-10

  // Trigger
  triggerStatement: "", // "I'm not ____"
  triggerPlan: "",      // what to do when it shows up -- Pause. Ponder. Pivot. (Pause and breathe. Ponder why the Trigger was activated. Then Pivot and wear your WHO words as a jacket to manage the challenge.)
const STORAGE_KEY = "who_assessment_v2";
const MAIN_SITE = "http://MyWHOthoughts.com";
const BOOK_LINK = "http://bit.ly/3PLIYG9";

const DEFAULTS = {
  meta: { name: "", email: "" },
  fontScale: 1,
  values: [],
  pillars: [],
  idealEmotion: "",
  triggers: [
    { trigger: "", response: "" },
    { trigger: "", response: "" },
    { trigger: "", response: "" },
  ],
  food: { favorite: "", hate: "" },
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

const EMOTION_OPTIONS = [
  "Calm","Confident","Focused","Free","Grateful","Grounded","Happy","Hopeful",
  "Loved","Motivated","Peaceful","Powerful","Present","Proud","Safe","Strong"
];

const TRIGGER_OPTIONS = [
  "Criticism","Rejection","Being ignored","Feeling rushed","Uncertainty","Conflict",
  "Feeling judged","Mess/chaos","Lack of control","Feeling disrespected"
];

let state = loadState();
let stepIndex = 0;

const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elSave = document.getElementById("saveBtn");
const elProgress = document.getElementById("progressBar");

const elSite = document.getElementById("siteLink");
const elBook = document.getElementById("bookLink");
elSite.href = MAIN_SITE;
elBook.href = BOOK_LINK;

// Font controls
const elFontDown = document.getElementById("fontDown");
const elFontUp = document.getElementById("fontUp");
const elFontSlider = document.getElementById("fontSlider");

function applyFontScale(scale){
  const clamped = Math.max(0.9, Math.min(1.3, Number(scale)));
  document.documentElement.style.setProperty("--fontScale", clamped);
  state.fontScale = clamped;
  elFontSlider.value = String(clamped);
  saveState();
}
elFontSlider.value = String(state.fontScale ?? 1);
applyFontScale(state.fontScale ?? 1);

elFontDown.addEventListener("click", () => applyFontScale((state.fontScale ?? 1) - 0.05));
elFontUp.addEventListener("click", () => applyFontScale((state.fontScale ?? 1) + 0.05));
elFontSlider.addEventListener("input", (e) => applyFontScale(e.target.value));

const steps = [
  {
    id: "meta",
    title: "Start",
    hint: "Add your name. Email is optional (only used if you choose to email yourself your results).",
    render: renderMeta,
    validate: validateMeta,
  },
  {
    id: "values",
    title: "Page 1 — Define your Values",
    hint: "Tap to select your values. Keep it simple: pick 5–10 that actually matter to you.",
    render: () => renderMultiSelect({
      key: "values",
      options: VALUE_OPTIONS,
      allowCustom: true,
      customLabel: "Add your own value",
      maxHint: "If you pick too many, the tool stops being useful.",
    }),
    validate: () => (state.values.length >= 3) || "Pick at least 3 values.",
  },
  {
    id: "pillars",
    title: "Page 2 — Define your Pillars",
    hint: "Pillars are the life buckets you lean on when you want to be your best self.",
    render: () => renderMultiSelect({
      key: "pillars",
      options: PILLAR_OPTIONS,
      allowCustom: true,
      customLabel: "List your pillars (your own words)",
      maxHint: "Pick 4–8 if you can.",
    }),
    validate: () => (state.pillars.length >= 2) || "Pick at least 2 pillars.",
  },
  {
    id: "emotion",
    title: "Page 3 — Define your Ideal Emotion",
    hint: "How do you want to feel most of the time? You can choose one from the bank or write your own.",
    render: renderIdealEmotion,
    validate: () => (String(state.idealEmotion || "").trim().length > 1) || "Choose or write your ideal emotion.",
  },
  {
    id: "triggers",
    title: "Page 4 — Triggers → Responses",
    hint: "List triggers that set you off — and the response you’d rather choose instead.",
    render: renderTriggers,
    validate: validateTriggers,
  },
  {
    id: "food",
    title: "Food Check",
    hint: "Quick metaphor check. This is optional, but it makes the framework stick.",
    render: renderFood,
    validate: () => true,
  },
  {
    id: "results",
    title: "Reference Guide",
    hint: "This is your WHO. Save it, copy it, or email it to yourself.",
    render: renderResults,
    validate: () => true,
  },
];

init();

function init(){
  elBack.addEventListener("click", () => go(-1));
  elNext.addEventListener("click", () => go(1));
  elSave.addEventListener("click", () => {
    saveState();
    toast("Saved on this device.");
  });

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
    renderValuesPromptsStep,     // Step 1
    renderValuesRoadTestStep,    // Step 2
    renderPillarsStep,           // Step 3
    renderIdealEmotionStep,      // Step 4
    renderTriggerStep            // Step 5
  ];
}
  renderStep();
}

function go(delta){
  const step = steps[stepIndex];
  const res = step.validate?.();
  if (res !== true){
    toast(res || "Fix the step before continuing.");
    return;
  }

  stepIndex = Math.max(0, Math.min(steps.length - 1, stepIndex + delta));
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStep(){
  const step = steps[stepIndex];
  elTitle.textContent = step.title;
  elHint.textContent = step.hint || "";

  // progress
  const pct = Math.round(((stepIndex) / (steps.length - 1)) * 100);
  elProgress.style.width = `${pct}%`;

  // buttons
  elBack.style.visibility = stepIndex === 0 ? "hidden" : "visible";
  elNext.textContent = stepIndex === steps.length - 1 ? "Done" : "Next";

  // body
  elBody.innerHTML = "";
  step.render();
}

//
// STEP 1 — VALUES PROMPTS (proud + upset)
//
function renderValuesPromptsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Values (Discover)</h2>
    <p>
    There are two ways to uncover your Values (1) what is your proudest moment at any point in your life and (2) what makes you upset. We’ll discover candidates from your proudest moments first, then road-test them.</p>

    <div class="block">
      <h3>Prompt A: Proud Moment</h3>
      <div class="field">
        <label>At any point in your life, when were you most proud of yourself?</label>
        <textarea id="proudMoment" placeholder="Example: a hard project, a personal change, standing up for yourself or someone...">${escapeHtml(state.proudMoment || "")}</textarea>
      </div>
      <div class="field">
        <label>Why were you proud?</label>
        <textarea id="proudWhy" placeholder="Reflect on the reasons you felt pride. List the Values that allowed you to accomplish the goal / gave you pride.">${escapeHtml(state.proudWhy || "")}</textarea>
      </div>
    </div>

    <div class="block">
      <h3>Prompt B: Upset / Anger / Frustrated Moment</h3>
      <div class="field">
        <label>When were you most angry, frustrated, or furious (person or situation)?</label>
        <textarea id="upsetMoment" placeholder="Example: disrespected, lied to, treated unfairly, told what to do, ignored...">${escapeHtml(state.upsetMoment || "")}</textarea>
      </div>
      <div class="field">
        <label>What exactly bothered you / Why did the behavior bother you?</label>
        <textarea id="upsetWhy" placeholder="The 'why' reveals your Values when crossed.">${escapeHtml(state.upsetWhy || "")}</textarea>
      </div>
    </div>

    <div class="block">
      <h3>Build your candidate list (fast)</h3>
      <p class="muted">Pick a few from the list OR add custom ones. We’ll road-test on the next step.</p>
      <div class="pills" id="valuePills"></div>

      <div class="field">
        <label>Add a candidate Value (press Enter)</label>
        <input id="customValue" type="text" placeholder="Type a value and press Enter (e.g., Respect, Excellence, Honesty)" />
        <div class="help">Goal: 3–6 candidates. By identifying these candidates, you can more easily de-escalate your emotions.</div>
      </div>

      <div class="field">
        <label>Current candidates</label>
        <div id="candidateList" class="kv"></div>
      </div>
    </div>
  `;
function renderMeta(){
  const wrap = document.createElement("div");

  wrap.appendChild(field("Your name", "name", state.meta.name, "spellcheck", true));
  wrap.appendChild(field("Your email (optional)", "email", state.meta.email, "inputmode", "email"));

  const note = document.createElement("div");
  note.className = "notice";
  note.innerHTML = `
    <strong>No spam.</strong> Email is optional and only used if you press <em>Email my results</em>.
    We will not sign you up for newsletters.
  `;
  wrap.appendChild(note);

  // bind textareas
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

  // pills + custom
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
  elBody.appendChild(wrap);

  // wire
  wrap.querySelector('input[name="name"]').addEventListener("input", (e) => {
    state.meta.name = e.target.value;
    saveStateDebounced();
  });
  wrap.querySelector('input[name="email"]').addEventListener("input", (e) => {
    state.meta.email = e.target.value;
    saveStateDebounced();
  });

  // render list
  wrap.querySelector("#candidateList").innerHTML =
    (state.valueCandidates.length
      ? state.valueCandidates.map(v => `• ${escapeHtml(v)}`).join("<br/>")
      : `<span class="muted">None yet. Add 5–12 candidates.</span>`);
}

//
// STEP 2 — VALUES ROAD TEST
//
function renderValuesRoadTestStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  const candidates = (state.valueCandidates || []).slice();

  wrap.innerHTML = `
    <h2>Values (Road Test)</h2>
    <p>Road test rule: <b>In your personal or professinal life, crosses your Value, does it evoke anger / frustration / upset?</b></p>

    <div class="block">
      <h3>Instructions</h3>
      <div class="kv">
        • <b>YES</b> = it’s a Value (keep)<br/>
        • <b>NO</b> = it’s not a Value.
      </div>
    </div>

    <div class="block">
      <h3><b>Road test each candidate.</b> Values, when crossed, evoke an emotion. Example: you can have high integrity, but not get bothered if others do not have that quality. Integrity would not be considered a Value)</h3>
      <div id="roadList"></div>

    <div class="block">
      <h3>Live results</h3>
      <div class="grid">
        <div class="block">
          <h3>Confirmed Values</h3>
          <div id="valuesFinal" class="kv"></div>
        </div>
        <div class="block">
          <h3>Moved to Pillars</h3>
          <div id="movedToPillars" class="kv"></div>
        </div>
      </div>
    </div>
  `;

  stepHost.appendChild(wrap);

  const roadList = wrap.querySelector("#roadList");

  if (!candidates.length){
    roadList.innerHTML = `<div class="muted">No candidates yet. Go back and add some values first.</div>`;
    wrap.querySelector("#valuesFinal").innerHTML = `<span class="muted">None</span>`;
    wrap.querySelector("#movedToPillars").innerHTML = `<span class="muted">None</span>`;
    return;
  }

  // Ensure arrays exist
  state.valuesFinal = Array.isArray(state.valuesFinal) ? state.valuesFinal : [];
  state.movedToPillars = Array.isArray(state.movedToPillars) ? state.movedToPillars : [];

  // render road test rows
  candidates.forEach((v) => {
    const row = document.createElement("div");
    row.className = "block";
    row.style.marginBottom = "10px";

    const status = getRoadStatus(v);

    row.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:800;">${escapeHtml(v)}</div>
          <div class="muted" style="font-size:13px;">If someone violates this, do you get angry/upset?</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn ${status==="yes" ? "btn-primary": "btn-ghost"}" data-ans="yes">YES</button>
          <button class="btn ${status==="no" ? "btn-primary": "btn-ghost"}" data-ans="no">NO</button>
          <button class="btn btn-ghost" data-ans="clear">Clear</button>
        </div>
      </div>
    `;

    row.querySelectorAll("button[data-ans]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ans = btn.dataset.ans;
        setRoadStatus(v, ans);
        saveState();
        render(); // keep it simple + consistent
      });
    });

    roadList.appendChild(row);
  });

  // show live results
  wrap.querySelector("#valuesFinal").innerHTML =
    (state.valuesFinal.length
      ? state.valuesFinal.map(x => `• ${escapeHtml(x)}`).join("<br/>")
      : `<span class="muted">None yet</span>`);

  wrap.querySelector("#movedToPillars").innerHTML =
    (state.movedToPillars.length
      ? state.movedToPillars.map(x => `• ${escapeHtml(x)}`).join("<br/>")
      : `<span class="muted">None yet</span>`);
}

function getRoadStatus(value){
  if (state.valuesFinal.includes(value)) return "yes";
  if (state.movedToPillars.includes(value)) return "no";
  return "none";
}

function setRoadStatus(value, ans){
  removeIfExists(state.valuesFinal, value);
  removeIfExists(state.movedToPillars, value);

  if (ans === "yes") pushUnique(state.valuesFinal, value);
  if (ans === "no") pushUnique(state.movedToPillars, value);

  // Optional: keep candidates list stable (do nothing)
}

//
// STEP 3 — PILLARS (traits) + road test for "should be a value?"
// Pillars are characteristics when you're happiest/best self, when all your defenses are down. 
//
function renderPillarsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  // pre-fill pillar candidates with movedToPillars (helpful)
  state.pillarCandidates = Array.isArray(state.pillarCandidates) ? state.pillarCandidates : [];
  (state.movedToPillars || []).forEach(x => pushUnique(state.pillarCandidates, x));

  wrap.innerHTML = `
    <h2>Pillars (Discover)</h2>
    <p>
    Are positive core characteristics that describe you as your best (they are not tied to accomplishment or how you think you "should be"). 
    </br> 
    You can find them by recalling any time in your life when you just felt so "you," when time melted away, and you felt freedom from judgment (self or others).</br>
    </p>
    
    <div class="block">
      <h3>Prompt: Happiest / Best Self</h3>
      <div class="field">
        <label>When were you your happiest and most YOU? (Where / with who / doing what?)</label>
        <textarea id="happiestMoment" placeholder="Example: on vacation, with friends, reading, building something, outdoors...">${escapeHtml(state.happiestMoment || "")}</textarea>
      </div>
        
      <div class="help">Now list 3–6 characteristics that describe you in that "best moment" state.</div>
    </div>

    <div class="block">
      <h3>Add Pillar candidates (add a trait, then press enter)</h3>
      <div class="field">
        <input id="customPillarTrait" type="text" placeholder="Example: Community, Passion, Problem Solver, Service, Connected, Builder, Optimist, Creative, Present, Earthy, Playful, Calm, Bold, Curious, Grounded..." />
      </div>

      <div class="field">
        <label>Current Pillar candidates</label>
        <div id="pillarList" class="kv"></div>
      </div>
    </div>

    <div class="block">
      <h3>Pillar Road Test</h3>
      <p class="muted">If someone crosses this characteristic, do you get angry/frustrated/upset? If YES, it belongs in Values.</p>
      <div id="pillarRoad"></div>
    </div>

    <div class="block">
      <h3>Live results</h3>
      <div class="grid">
        <div class="block">
          <h3>Confirmed Pillars</h3>
          <div id="pillarsFinal" class="kv"></div>
        </div>
        <div class="block">
          <h3>Moved to Values</h3>
          <div id="movedToValues" class="kv"></div>
        </div>
      </div>
    </div>
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

  // Render pillar list
  wrap.querySelector("#pillarList").innerHTML =
    (state.pillarCandidates.length
      ? state.pillarCandidates.map(x => `• ${escapeHtml(x)}`).join("<br/>")
      : `<span class="muted">None yet. Add 3–6 characteristics.</span>`);

  // Road test each pillar candidate
  state.pillarsFinal = Array.isArray(state.pillarsFinal) ? state.pillarsFinal : [];
  state.movedToValuesFromPillars = Array.isArray(state.movedToValuesFromPillars) ? state.movedToValuesFromPillars : [];

  const road = wrap.querySelector("#pillarRoad");
  const list = (state.pillarCandidates || []).slice();

  if (!list.length){
    road.innerHTML = `<div class="muted">Add pillar candidates above.</div>`;
  } else {
    list.forEach(trait => {
      const row = document.createElement("div");
      row.className = "block";
      row.style.marginBottom = "10px";

      const status = getPillarRoadStatus(trait);

      row.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;">${escapeHtml(trait)}</div>
            <div class="muted" style="font-size:13px;">If someone crosses this, do you get angry/upset?</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn ${status==="pillar" ? "btn-primary": "btn-ghost"}" data-ans="pillar">NO (Pillar)</button>
            <button class="btn ${status==="value" ? "btn-primary": "btn-ghost"}" data-ans="value">YES (Value)</button>
            <button class="btn btn-ghost" data-ans="clear">Clear</button>
          </div>
        </div>
      `;

      row.querySelectorAll("button[data-ans]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ans = btn.dataset.ans;
          setPillarRoadStatus(trait, ans);
          saveState();
          render();
        });
      });

      road.appendChild(row);
    });
  }

  wrap.querySelector("#pillarsFinal").innerHTML =
    (state.pillarsFinal.length
      ? state.pillarsFinal.map(x => `• ${escapeHtml(x)}`).join("<br/>")
      : `<span class="muted">None yet</span>`);

  wrap.querySelector("#movedToValues").innerHTML =
    (state.movedToValuesFromPillars.length
      ? state.movedToValuesFromPillars.map(x => `• ${escapeHtml(x)}`).join("<br/>")
      : `<span class="muted">None</span>`);

  // Also ensure moved-to-values get into valuesFinal (helpful)
  state.movedToValuesFromPillars.forEach(x => pushUnique(state.valuesFinal, x));
}

function getPillarRoadStatus(trait){
  if (state.pillarsFinal.includes(trait)) return "pillar";
  if (state.movedToValuesFromPillars.includes(trait)) return "value";
  return "none";
}

function setPillarRoadStatus(trait, ans){
  removeIfExists(state.pillarsFinal, trait);
  removeIfExists(state.movedToValuesFromPillars, trait);

  if (ans === "pillar") pushUnique(state.pillarsFinal, trait);
  if (ans === "value") pushUnique(state.movedToValuesFromPillars, trait);

  // Keep pillarCandidates stable
}

//
// STEP 4 — IDEAL EMOTION + 1–10
//
function renderIdealEmotionStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Ideal Emotion</h2>
    <p>Your Ideal Emotion is what you want to feel each day (yes, it is ok to have 2 Ideal Emotions). When you’re not feeling that emotion, revisit your Values and Pillars to see where your are not aligned with the WHO words that you selected.</p>

    <div class="grid">
      <div class="field">
        <label>Pick one (or your closest)</label>
        <select id="idealEmotion">
          <option value="">Select…</option>
          ${IDEAL_EMOTION_OPTIONS.map(x => `<option ${state.idealEmotion===x ? "selected":""} value="${x}">${x}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>How much do you want to feel your Ideal Emotion (be realistic)? (1–10)</label>
        <input id="emotionLevel" type="range" min="1" max="10" value="${Number(state.emotionLevel || 8)}" />
        <div class="help">Current: <b id="emotionLevelLabel">${Number(state.emotionLevel || 8)}</b></div>
function validateMeta(){
  const name = String(state.meta.name || "").trim();
  if (name.length < 2) return "Add your name to continue.";
  return true;
}

function renderMultiSelect({ key, options, allowCustom, customLabel, maxHint }){
  const selected = new Set(state[key] || []);

  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Word bank (tap to add/remove)";
  elBody.appendChild(sectionTitle);

  const pills = document.createElement("div");
  pills.className = "pills";
  options.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    if (selected.has(opt)) p.classList.add("selected");

    p.addEventListener("click", () => {
      if (selected.has(opt)) selected.delete(opt);
      else selected.add(opt);

      state[key] = Array.from(selected);
      saveStateDebounced();
      renderStep(); // re-render to refresh selected UI + list
    });

    pills.appendChild(p);
  });
  elBody.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  elBody.appendChild(hr);

  const listTitle = document.createElement("div");
  listTitle.className = "section-title";
  listTitle.textContent = "Selected";
  elBody.appendChild(listTitle);

  const box = document.createElement("div");
  box.className = "result-box";
  box.textContent = (state[key] && state[key].length) ? state[key].join(", ") : "Nothing selected yet.";
  elBody.appendChild(box);

  if (maxHint){
    const small = document.createElement("div");
    small.className = "small";
    small.style.marginTop = "8px";
    small.textContent = maxHint;
    elBody.appendChild(small);
  }

  if (allowCustom){
    const custom = document.createElement("div");
    custom.className = "field";
    custom.innerHTML = `
      <div class="label">${customLabel}</div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <input class="input" name="custom_${key}" placeholder="Type and press Add" spellcheck="true" />
        <button class="btn" id="addCustomBtn">Add</button>
      </div>
      <div class="small">Tip: keep words short. One idea per word.</div>
    `;
    elBody.appendChild(custom);

    const input = custom.querySelector(`input[name="custom_${key}"]`);
    const btn = custom.querySelector("#addCustomBtn");

    const add = () => {
      const val = String(input.value || "").trim();
      if (!val) return;
      if (!selected.has(val)) selected.add(val);
      state[key] = Array.from(selected);
      input.value = "";
      saveStateDebounced();
      renderStep();
    };

    <div class="field">
      <label>If you have two Ideal Emotions list the second one.</label>
      <input id="emotionWhy" type="text" placeholder="Example: Joy and Calm." value="${escapeHtml(state.emotionWhy || "")}" />
      <div class="help">Reflect</div>
    </div>

    <div class="block">
      <h3>Quick alignment check</h3>
      <div class="kv">
        When you are living your Values and being your Pillars, you automatically feel your Ideal Emotion. So, when you’re not at your target level, ask:
        <br/>• Which <b>Value</b> did I compromise? How do I realign with my Values?
        <br/>• Which <b>Pillar</b> am I not embodying to my norm? What action can I do (self-care or do something for someone) to feed my Pillars? 
      </div>
    </div>
  `;

  stepHost.appendChild(wrap);
    btn.addEventListener("click", add);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter"){
        e.preventDefault();
        add();
      }
    });
  }
}

function renderIdealEmotion(){
  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Emotion bank (tap to set)";
  elBody.appendChild(sectionTitle);

  const pills = document.createElement("div");
  pills.className = "pills";

  EMOTION_OPTIONS.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    if (state.idealEmotion === opt) p.classList.add("selected");

    p.addEventListener("click", () => {
      state.idealEmotion = opt;
      saveStateDebounced();
      renderStep();
    });

    pills.appendChild(p);
  });

  const range = wrap.querySelector("#emotionLevel");
  const label = wrap.querySelector("#emotionLevelLabel");
  range.addEventListener("input", () => {
    state.emotionLevel = Number(range.value);
    label.textContent = String(state.emotionLevel);
    saveState();
  });

  const why = wrap.querySelector("#emotionWhy");
  why.addEventListener("input", () => {
    state.emotionWhy = why.value;
    saveState();
  });
}

//
// STEP 5 — TRIGGER (single "I'm not ___") + plan
//
function renderTriggerStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Trigger (Anti-WHO)</h2>
    <p>Your Trigger is the loud inner critic story that makes you feel demoralized: <b>“I’m not ___.”</b> Naming it gives you power to notice it and choose to feed the positive WHO thoughts.</p>

    <div class="block">
      <div class="field">
        <label>My Trigger is… “I’m not ____”</label>
        <input id="triggerStatement" type="text" placeholder="Example: I’m not good enough / respected / liked / capable..." value="${escapeHtml(state.triggerStatement || "")}" />
      </div>

      <div class="field">
        <label>When the Trigger thought shows up, what will I do to shift my mindset to focus on the Pillar words? (simple plan)</label>
        <textarea id="triggerPlan" placeholder="Example: Pause 10 seconds → pick 1 pillar → act for 2 minutes.">${escapeHtml(state.triggerPlan || "")}</textarea>
       </div>

    <div class="block">
      <h3>Optional: One-line reset script</h3>
      <div class="kv">
        “That’s my Trigger talking. I’m choosing <b>[Pillar]</b> + honoring <b>[Value]</b> right now.”
      </div>
    </div>
  `;

  stepHost.appendChild(wrap);

  const ts = wrap.querySelector("#triggerStatement");
  const tp = wrap.querySelector("#triggerPlan");

  ts.addEventListener("input", () => {
    state.triggerStatement = ts.value;
    saveState();
  });

  tp.addEventListener("input", () => {
    state.triggerPlan = tp.value;
    saveState();
  });
}

function validateCurrentStep(){
  // Step 1: require some candidates OR enough prompt text
  if (stepIndex === 0) {
    const hasPrompt = (state.proudMoment || "").trim().length > 10 || (state.upsetMoment || "").trim().length > 10;
    if (!hasPrompt && (state.valueCandidates || []).length < 3) return toast("Add at least 3 value candidates OR write one of the prompts.");
  }

  // Step 2: require at least 2 valuesFinal (or some road decisions)
  if (stepIndex === 1) {
    const decided = (state.valuesFinal.length + state.movedToPillars.length);
    if ((state.valueCandidates || []).length && decided < 2) return toast("Road-test at least 2 candidates.");
  }

  // Step 3: require at least 2 pillarsFinal OR at least 2 pillar candidates
  if (stepIndex === 2) {
    if ((state.pillarsFinal || []).length < 2) return toast("Confirm at least 2 Pillars (NO = Pillar).");
  }

  // Step 4: ideal emotion required
  if (stepIndex === 3) {
    if (!state.idealEmotion) return toast("Select an ideal emotion.");
  }

  // Step 5: trigger statement required
  if (stepIndex === 4) {
    if (!(state.triggerStatement || "").trim()) return toast("Enter your “I’m not ____” Trigger.");
  }

  elBody.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  elBody.appendChild(hr);

  const f = document.createElement("div");
  f.className = "field";
  f.innerHTML = `
    <div class="label">Or write your own (recommended if none fit)</div>
    <input class="input" name="idealEmotion" placeholder="Example: ‘Steady’ or ‘Locked-in’" spellcheck="true" />
    <div class="small">Whatever you write here becomes your Ideal Emotion.</div>
  `;
  elBody.appendChild(f);

  const input = f.querySelector('input[name="idealEmotion"]');
  input.value = state.idealEmotion || "";

  input.addEventListener("input", (e) => {
    state.idealEmotion = e.target.value;
    saveStateDebounced();
  });
}

function renderTriggers(){
  const wrap = document.createElement("div");

  // Trigger bank helper
  const bankTitle = document.createElement("div");
  bankTitle.className = "section-title";
  bankTitle.textContent = "Trigger word bank (tap to copy into the next empty trigger)";
  wrap.appendChild(bankTitle);

  const pills = document.createElement("div");
  pills.className = "pills";
  TRIGGER_OPTIONS.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    p.addEventListener("click", () => {
      const idx = state.triggers.findIndex(t => !String(t.trigger || "").trim());
      const target = idx === -1 ? 0 : idx;
      state.triggers[target].trigger = opt;
      saveStateDebounced();
      renderStep();
    });
    pills.appendChild(p);
  });
  wrap.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  wrap.appendChild(hr);

  state.triggers.forEach((t, i) => {
    const block = document.createElement("div");
    block.className = "result-box";
    block.style.marginBottom = "10px";

    block.innerHTML = `
      <div class="field" style="margin:0;">
        <div class="label">Trigger ${i+1}</div>
        <input class="input" name="trigger_${i}" placeholder="What sets you off?" spellcheck="true" value="${escapeHtml(t.trigger)}" />
      </div>

      <div class="field">
        <div class="label">Preferred response</div>
        <textarea name="response_${i}" placeholder="What do you want to do instead?" spellcheck="true">${escapeHtml(t.response)}</textarea>
      </div>
    `;

    wrap.appendChild(block);
  });

  const small = document.createElement("div");
  small.className = "small";
  small.textContent = "Spellcheck is enabled — you’ll see red underlines for typos.";
  wrap.appendChild(small);

  elBody.appendChild(wrap);

  // wire inputs
  state.triggers.forEach((_, i) => {
    const trig = elBody.querySelector(`input[name="trigger_${i}"]`);
    const resp = elBody.querySelector(`textarea[name="response_${i}"]`);

    trig.addEventListener("input", (e) => {
      state.triggers[i].trigger = e.target.value;
      saveStateDebounced();
    });

    resp.addEventListener("input", (e) => {
      state.triggers[i].response = e.target.value;
      saveStateDebounced();
    });
  });
}

function validateTriggers(){
  const anyFilled = state.triggers.some(t => String(t.trigger || "").trim() || String(t.response || "").trim());
  if (!anyFilled) return "Add at least 1 trigger + response (even a rough one).";
  return true;
}

function renderFood(){
  const wrap = document.createElement("div");

  const fav = document.createElement("div");
  fav.className = "field";
  fav.innerHTML = `
    <div class="label">My favorite food / meal is:</div>
    <input class="input" name="food_fav" placeholder="Example: sushi" spellcheck="true" />
  `;

  // Final rollups
  const values = uniqueClean([
    ...(state.valuesFinal || []),
    ...(state.movedToValuesFromPillars || [])
  ]);

  const pillars = uniqueClean(state.pillarsFinal || []);

  resultsBody.innerHTML = `
    <div class="block">
      <h3>Values</h3>
      <div class="kv">${values.length ? values.map(v => `• ${escapeHtml(v)}`).join("<br/>") : "<span class='muted'>None</span>"}</div>
      <div class="tagline">Non-negotiables. When crossed, they evoke emotion.</div>
    </div>

    <div class="block">
      <h3>Pillars</h3>
      <div class="kv">${pillars.length ? pillars.map(p => `• ${escapeHtml(p)}`).join("<br/>") : "<span class='muted'>None</span>"}</div>
      <div class="tagline">Core characteristics when you’re happiest and most “you.”</div>
    </div>

    <div class="block">
      <h3>Ideal Emotion</h3>
      <div class="kv">
        <div><b>${escapeHtml(state.idealEmotion || "—")}</b> <span class="muted">(target: ${Number(state.emotionLevel || 8)}/10)</span></div>
        ${state.emotionWhy ? `<div class="muted">${escapeHtml(state.emotionWhy)}</div>` : `<div class="muted">No “why” added.</div>`}
      </div>
    </div>

    <div class="block">
      <h3>Trigger (Anti-WHO)</h3>
      <div class="kv">
        <div><b>${escapeHtml(state.triggerStatement || "—")}</b></div>
        ${state.triggerPlan ? `<div class="muted">${escapeHtml(state.triggerPlan)}</div>` : `<div class="muted">No plan added.</div>`}
      </div>
    </div>

    <div class="block">
      <h3>Next step</h3>
      <div class="kv">
        Pick <b>one Value</b> and <b>one Pillar</b> to lead with this week.
        <br/><span class="muted">If your Ideal Emotion dips, check what WHO words you compromised.</span>
      </div>
  const hate = document.createElement("div");
  hate.className = "field";
  hate.innerHTML = `
    <div class="label">I cannot stomach this food / consistency / beverage:</div>
    <input class="input" name="food_hate" placeholder="Example: cottage cheese" spellcheck="true" />
  `;

  const quote = document.createElement("div");
  quote.className = "result-box";
  quote.innerHTML = `
    <em>
      The food you fill your stomach with is no different than the thoughts you fill your head with.
      When your Trigger is loud, it is akin to eating your least favorite food, on purpose!
    </em>
    <div style="height:10px"></div>
    <strong>Thought choice:</strong> When something happens that causes upset—will you lean into your
    <strong>Pillars</strong> to respond, or choose the <strong>Trigger</strong> and react?
  `;

  wrap.appendChild(fav);
  wrap.appendChild(hate);
  wrap.appendChild(quote);

  elBody.appendChild(wrap);

  const favInput = elBody.querySelector('input[name="food_fav"]');
  const hateInput = elBody.querySelector('input[name="food_hate"]');
  favInput.value = state.food.favorite || "";
  hateInput.value = state.food.hate || "";

  favInput.addEventListener("input", (e) => {
    state.food.favorite = e.target.value;
    saveStateDebounced();
  });
  hateInput.addEventListener("input", (e) => {
    state.food.hate = e.target.value;
    saveStateDebounced();
  });
}

function renderResults(){
  const wrap = document.createElement("div");

  const name = String(state.meta.name || "").trim();

  const box = document.createElement("div");
  box.className = "result-box";
  box.innerHTML = `
    <div class="kv">
      <div class="k">Name</div>
      <div class="v">${escapeHtml(name)}</div>
    </div>

    <div class="kv">
      <div class="k">Values</div>
      <div class="v">${escapeHtml((state.values || []).join(", ") || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Pillars</div>
      <div class="v">${escapeHtml((state.pillars || []).join(", ") || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Ideal Emotion</div>
      <div class="v">${escapeHtml(state.idealEmotion || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Triggers → Responses</div>
      <div class="v">${escapeHtml(formatTriggersPlain(state.triggers))}</div>
    </div>

    <div class="kv">
      <div class="k">Food Check</div>
      <div class="v">Favorite: ${escapeHtml(state.food.favorite || "—")}<br/>Hate: ${escapeHtml(state.food.hate || "—")}</div>
    </div>
  `;

  wrap.appendChild(box);

  const hr = document.createElement("div");
  hr.className = "hr";
  wrap.appendChild(hr);

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.flexWrap = "wrap";

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.textContent = "Copy results";
  copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(buildEmailBody());
      toast("Copied.");
    }catch{
      toast("Copy failed (browser blocked).");
    }
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "btn";
  downloadBtn.textContent = "Download .txt";
  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([buildEmailBody()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WHO_${(state.meta.name || "results").replace(/\s+/g,"_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

function buildSummaryText(){
  const values = uniqueClean([...(state.valuesFinal || []), ...(state.movedToValuesFromPillars || [])]);
  const pillars = uniqueClean(state.pillarsFinal || []);

  return [
    "WHO Snapshot",
    "",
    "VALUES:",
    ...(values.length ? values.map(v => `- ${v}`) : ["- (none)"]),
    "",
    "PILLARS:",
    ...(pillars.length ? pillars.map(p => `- ${p}`) : ["- (none)"]),
    "",
    "IDEAL EMOTION:",
    `- ${state.idealEmotion || "(none)"}`,
    `- Target level: ${Number(state.emotionLevel || 8)}/10`,
    state.emotionWhy ? `- Why: ${state.emotionWhy}` : "",
    "",
    "TRIGGER (Anti-WHO):",
    `- ${state.triggerStatement || "(none)"}`,
    state.triggerPlan ? `- Plan: ${state.triggerPlan}` : "",
    "",
    `Main site: ${MAIN_SITE}`
  ].filter(Boolean).join("\n");
}

// ---------- utilities ----------
function makePill(label, arr, maxCount){
  const pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = label;
  pill.dataset.on = arr.includes(label) ? "true" : "false";

  pill.addEventListener("click", () => {
    const on = arr.includes(label);
    if (on) {
      arr.splice(arr.indexOf(label), 1);
    } else {
      if (arr.length >= maxCount) return toast(`Max ${maxCount}. Remove one first.`);
      arr.push(label);
  const emailBtn = document.createElement("button");
  emailBtn.className = "btn primary";
  emailBtn.textContent = "Email my results";
  emailBtn.addEventListener("click", () => {
    const email = String(state.meta.email || "").trim();
    if (!email){
      toast("Add your email on the Start page first (optional, but required to email).");
      stepIndex = 0;
      renderStep();
      return;
    }
    const subject = encodeURIComponent(`My WHO Results — ${state.meta.name || ""}`.trim());
    const body = encodeURIComponent(buildEmailBody());
    // Opens their mail app. No backend needed.
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  });

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn ghost";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset everything on this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState(true);
    stepIndex = 0;
    applyFontScale(state.fontScale ?? 1);
    renderStep();
  });

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(downloadBtn);
  btnRow.appendChild(emailBtn);
  btnRow.appendChild(resetBtn);

  wrap.appendChild(btnRow);

  const note = document.createElement("div");
  note.className = "small";
  note.style.marginTop = "10px";
  note.textContent = "Note: Email uses your device’s mail app (mailto). For true auto-send email, we’d need a simple backend service.";
  wrap.appendChild(note);

  elBody.appendChild(wrap);
}

function field(labelText, name, value, attr, attrVal){
  const d = document.createElement("div");
  d.className = "field";
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = labelText;

  const input = document.createElement("input");
  input.className = "input";
  input.name = name;
  input.value = value || "";
  input.spellcheck = true;
  if (attr) input.setAttribute(attr, attrVal);

  d.appendChild(label);
  d.appendChild(input);
  return d;
}

function buildEmailBody(){
  const lines = [];
  lines.push(`WHO RESULTS`);
  lines.push(`Name: ${state.meta.name || ""}`);
  lines.push(``);
  lines.push(`VALUES:`);
  lines.push(`- ${(state.values || []).join(", ")}`);
  lines.push(``);
  lines.push(`PILLARS:`);
  lines.push(`- ${(state.pillars || []).join(", ")}`);
  lines.push(``);
  lines.push(`IDEAL EMOTION:`);
  lines.push(`- ${state.idealEmotion || ""}`);
  lines.push(``);
  lines.push(`TRIGGERS → RESPONSES:`);
  (state.triggers || []).forEach((t, i) => {
    const trig = String(t.trigger || "").trim();
    const resp = String(t.response || "").trim();
    if (!trig && !resp) return;
    lines.push(`${i+1}) Trigger: ${trig}`);
    lines.push(`   Response: ${resp}`);
  });
  lines.push(``);
  lines.push(`FOOD CHECK:`);
  lines.push(`Favorite: ${state.food.favorite || ""}`);
  lines.push(`Hate: ${state.food.hate || ""}`);
  lines.push(``);
  lines.push(`—`);
  lines.push(`Generated via ${MAIN_SITE}`);
  return lines.join("\n");
}

function formatTriggersPlain(trigs){
  const parts = [];
  (trigs || []).forEach((t, i) => {
    const trig = String(t.trigger || "").trim();
    const resp = String(t.response || "").trim();
    if (!trig && !resp) return;
    parts.push(`${i+1}) ${trig || "—"} → ${resp || "—"}`);
  });
  return parts.length ? parts.join("\n") : "—";
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    console.warn("Save failed", e);
  }
}

let saveTimer = null;
function saveStateDebounced(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 250);
}

function loadState(reset = false){
  if (reset) return structuredClone(DEFAULTS);
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      valueCandidates: Array.isArray(parsed.valueCandidates) ? parsed.valueCandidates : [],
      valuesFinal: Array.isArray(parsed.valuesFinal) ? parsed.valuesFinal : [],
      movedToPillars: Array.isArray(parsed.movedToPillars) ? parsed.movedToPillars : [],
      pillarCandidates: Array.isArray(parsed.pillarCandidates) ? parsed.pillarCandidates : [],
      pillarsFinal: Array.isArray(parsed.pillarsFinal) ? parsed.pillarsFinal : [],
      movedToValuesFromPillars: Array.isArray(parsed.movedToValuesFromPillars) ? parsed.movedToValuesFromPillars : [],
      meta: { ...DEFAULTS.meta, ...(parsed.meta || {}) },
      food: { ...DEFAULTS.food, ...(parsed.food || {}) },
      triggers: Array.isArray(parsed.triggers) ? parsed.triggers : structuredClone(DEFAULTS.triggers),
    };
  }catch{
    return structuredClone(DEFAULTS);
  }
}

function toast(msg){
  // simple no-library toast
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "20px";
  t.style.transform = "translateX(-50%)";
  t.style.background = "rgba(10,30,20,.92)";
  t.style.color = "white";
  t.style.padding = "10px 14px";
  t.style.borderRadius = "12px";
  t.style.fontWeight = "800";
  t.style.zIndex = "9999";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function pushUnique(arr, val){
  const clean = (val || "").trim();
  if (!clean) return;
  if (!arr.includes(clean)) arr.push(clean);
}

function removeIfExists(arr, val){
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1);
}

function uniqueClean(arr){
  const out = [];
  (arr || []).forEach(x => {
    const clean = (x || "").trim();
    if (clean && !out.includes(clean)) out.push(clean);
  });
  return out;
}

// Auto-show app if user already has progress
const hasProgress =
  (state.valueCandidates || []).length ||
  (state.valuesFinal || []).length ||
  (state.pillarCandidates || []).length ||
  (state.pillarsFinal || []).length ||
  state.idealEmotion ||
  state.triggerStatement;

if (hasProgress) {
  elApp.hidden = false;
  render();
}
