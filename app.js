const MAIN_SITE = "HTTP://MyWHOthoughts.com";
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
  pillarCandidates: [],         // traits / characteristics
  pillarsFinal: [],             // after pillar road test YES (is pillar)
  movedToValuesFromPillars: [], // pillar road test anger YES -> value

  // Ideal Emotion
  idealEmotion: "",
  emotionWhy: "",
  emotionLevel: 8, // 1-10

  // Trigger
  triggerStatement: "", // "I'm not ____"
  triggerPlan: "",      // what to do when it shows up (Pause. Ponder why the Trigger was activated. Then pivot to your best self and select one of your Pillars as a jacket to manage the challenge.)
};

const VALUE_OPTIONS = [
  "Respect","Excellence","Justice","Transparency","Honesty","Empathy","Adventure","Curiosity",
  "Kind","Independence,"Integrity","Structure","Self Reliance","Resilience","Impact","Service",
  "Authenticity","Fairness","Accountability","Reliability","Loyalty","Inclusivity","Do-er", 
  "Considerate","Perseverance","Open Mind","Efficient","Gratitude","Ethics" 
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Joy","Present","Energized","Grateful","Content","Freedom","Playful",
  "Present","Clear","Connected","Inspired","Carefree"
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
    renderValuesPromptsStep,     // Step 1
    renderValuesRoadTestStep,    // Step 2
    renderPillarsStep,           // Step 3
    renderIdealEmotionStep,      // Step 4
    renderTriggerStep            // Step 5
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

//
// STEP 1 — VALUES PROMPTS (proud + upset)
//
function renderValuesPromptsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";

  wrap.innerHTML = `
    <h2>Values (Discover)</h2>
    <p>Values are your <b>non-negotiables</b>. We’ll discover candidates from real moments first, then road-test them.</p>

    <div class="block">
      <h3>Prompt A: Proud Moment</h3>
      <div class="field">
        <label>At any point in your life, when were you most proud of yourself?</label>
        <textarea id="proudMoment" placeholder="Example: a hard project, a personal change, standing up for someone...">${escapeHtml(state.proudMoment || "")}</textarea>
      </div>
      <div class="field">
        <label>Why were you proud?</label>
        <textarea id="proudWhy" placeholder="List the reasons. This is where your Values show up.">${escapeHtml(state.proudWhy || "")}</textarea>
      </div>
    </div>

    <div class="block">
      <h3>Prompt B: Upset / Anger / Frustrated Moment</h3>
      <div class="field">
        <label>When were you most angry, frustrated, or furious (person or situation)?</label>
        <textarea id="upsetMoment" placeholder="Example: disrespected, lied to, treated unfairly, ignored...">${escapeHtml(state.upsetMoment || "")}</textarea>
      </div>
      <div class="field">
        <label>What exactly bothered you? (Why did the behavior bother you?)</label>
        <textarea id="upsetWhy" placeholder="The 'why' reveals your Values when crossed.">${escapeHtml(state.upsetWhy || "")}</textarea>
      </div>
    </div>

    <div class="block">
      <h3>Build your candidate list (fast)</h3>
      <p class="muted">Pick a few from the list OR add custom ones. We’ll road-test next step.</p>
      <div class="pills" id="valuePills"></div>

      <div class="field">
        <label>Add a candidate Value (press Enter)</label>
        <input id="customValue" type="text" placeholder="Type a value and press Enter (e.g., Respect, Excellence, Honesty)" />
        <div class="help">Goal: 5–12 candidates.</div>
      </div>

      <div class="field">
        <label>Current candidates</label>
        <div id="candidateList" class="kv"></div>
      </div>
    </div>
  `;

  stepHost.appendChild(wrap);

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
    <p>Road test rule: <b>If someone crosses your Value, does it evoke anger / frustration / upset?</b></p>

    <div class="block">
      <h3>Instructions</h3>
      <div class="kv">
        • <b>YES</b> = it’s a Value (keep)<br/>
        • <b>NO</b> = it’s not a Value → move it to “Pillar candidates” (trait/strength)
      </div>
    </div>

    <div class="block">
      <h3>Road test each candidate</h3>
      <div id="roadList"></div>
      <div class="help">Tip: imagine someone close to you blatantly crossing your Value.</div>
    </div>

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
    <p>Pillars are your <b>core characteristics</b> when you’re the happiest and most “you.”</p>

    <div class="block">
      <h3>Prompt: Happiest / Best Self</h3>
      <div class="field">
        <label>When were you your happiest and most YOU? (Where / with who / doing what?)</label>
        <textarea id="happiestMoment" placeholder="Example: on vacation, with friends, reading, building something, outdoors...">${escapeHtml(state.happiestMoment || "")}</textarea>
      </div>
      <div class="help">Now list 3–6 characteristics that describe you in that state.</div>
    </div>

    <div class="block">
      <h3>Add Pillar candidates (traits)</h3>
      <div class="field">
        <label>Add a trait (press Enter)</label>
        <input id="customPillarTrait" type="text" placeholder="Example: Playful, Calm, Bold, Curious, Grounded..." />
      </div>

      <div class="field">
        <label>Current Pillar candidates</label>
        <div id="pillarList" class="kv"></div>
      </div>
    </div>

    <div class="block">
      <h3>Pillar Road Test</h3>
      <p class="muted">If someone crosses this chacteristic, do you get angry/frustrated/upset? If YES, it belongs in Values.</p>
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
    <p>Your Ideal Emotion is what you want to feel each day. When you’re not feeling it, revisit Values + Pillars.</p>

    <div class="grid">
      <div class="field">
        <label>Pick one (or your closest)</label>
        <select id="idealEmotion">
          <option value="">Select…</option>
          ${IDEAL_EMOTION_OPTIONS.map(x => `<option ${state.idealEmotion===x ? "selected":""} value="${x}">${x}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>How much do you want to feel it? (1–10)</label>
        <input id="emotionLevel" type="range" min="1" max="10" value="${Number(state.emotionLevel || 8)}" />
        <div class="help">Current: <b id="emotionLevelLabel">${Number(state.emotionLevel || 8)}</b></div>
      </div>
    </div>

    <div class="field">
      <label>Why that emotion?</label>
      <input id="emotionWhy" type="text" placeholder="Because when I feel ___, I show up as ___." value="${escapeHtml(state.emotionWhy || "")}" />
      <div class="help">One sentence is enough.</div>
    </div>

    <div class="block">
      <h3>Quick alignment check</h3>
      <div class="kv">
        When you’re not at your target level, ask:
        <br/>• Which <b>Value</b> did I compromise?
        <br/>• Which <b>Pillar</b> did I stop embodying?
      </div>
    </div>
  `;

  stepHost.appendChild(wrap);

  const sel = wrap.querySelector("#idealEmotion");
  sel.addEventListener("change", () => {
    state.idealEmotion = sel.value;
    saveState();
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
    <p>Your Trigger is the loud inner critic story: <b>“I’m not ___.”</b> Naming it gives you power to notice it and return to your WHO.</p>

    <div class="block">
      <div class="field">
        <label>My Trigger is… “I’m not ____”</label>
        <input id="triggerStatement" type="text" placeholder="Example: I’m not good enough / respected / liked / capable..." value="${escapeHtml(state.triggerStatement || "")}" />
      </div>

      <div class="field">
        <label>When it shows up, what will I do instead? (simple plan)</label>
        <textarea id="triggerPlan" placeholder="Example: Pause 10 seconds → pick 1 pillar → act for 2 minutes.">${escapeHtml(state.triggerPlan || "")}</textarea>
        <div class="help">Make it stupid-simple. You’re designing for your worst moment.</div>
      </div>
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

  return true;
}

function showResults(){
  elApp.hidden = true;
  elResults.hidden = false;

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
        <br/><span class="muted">If your Ideal Emotion dips, check what you compromised.</span>
      </div>
    </div>
  `;

  saveState();
  elResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
    }
    saveState();
    render();
  });

  return pill;
}

function toast(msg){
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "18px";
  t.style.transform = "translateX(-50%)";
  t.style.background = "rgba(0,0,0,.7)";
  t.style.border = "1px solid rgba(255,255,255,.18)";
  t.style.padding = "10px 12px";
  t.style.borderRadius = "14px";
  t.style.zIndex = "9999";
  t.style.backdropFilter = "blur(8px)";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
  return false;
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
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
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
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
