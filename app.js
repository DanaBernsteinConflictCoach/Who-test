const MAIN_SITE = "http://MyWHOthoughts.com";

const STORAGE_KEY = "who_assessment_v1";

const DEFAULTS = {
  values: [],
  pillars: [],
  idealEmotion: "",
  emotionWhy: "",
  triggers: [
    { trigger: "", response: "" },
    { trigger: "", response: "" },
    { trigger: "", response: "" },
  ],
};

const VALUE_OPTIONS = [
  "Health","Freedom","Growth","Family","Friendship","Love","Discipline","Adventure","Curiosity",
  "Creativity","Faith","Integrity","Mastery","Stability","Wealth","Impact","Service","Leadership",
  "Peace","Joy","Authenticity","Courage","Excellence","Humor"
];

const PILLAR_OPTIONS = [
  "Body","Mind","Relationships","Work/Craft","Money","Faith/Spirit","Home/Environment","Fun/Play",
  "Learning","Community","Routine","Adventure"
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

startBtn.addEventListener("click", () => {
  elApp.hidden = false;
  elResults.hidden = true;
  document.getElementById("app").scrollIntoView({ behavior: "smooth", block: "start" });
  render();
});

resetBtn.addEventListener("click", () => {
  state = structuredClone(DEFAULTS);
  stepIndex = 0;
  saveState();
  elResults.hidden = true;
  elApp.hidden = false;
  render();
});

backBtn.addEventListener("click", () => {
  if (stepIndex > 0) stepIndex--;
  render();
});

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  if (stepIndex < steps().length - 1) {
    stepIndex++;
    render();
  } else {
    showResults();
  }
});

editBtn.addEventListener("click", () => {
  elResults.hidden = true;
  elApp.hidden = false;
  render();
  document.getElementById("app").scrollIntoView({ behavior: "smooth", block: "start" });
});

copyBtn.addEventListener("click", async () => {
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
    renderValuesStep,
    renderPillarsStep,
    renderIdealEmotionStep,
    renderTriggersStep
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

function renderValuesStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";
  wrap.innerHTML = `
    <h2>Values</h2>
    <p>Pick your <b>top 5–8</b> values. These are non-negotiables—what you refuse to violate.</p>
    <div class="pills" id="valuesPills"></div>
    <div class="field">
      <label>Custom value (optional)</label>
      <input id="customValue" type="text" placeholder="Type a value and press Enter" />
      <div class="help">Example: “Simplicity”, “Winning”, “Nature”, “Boldness”.</div>
    </div>
  `;

  stepHost.appendChild(wrap);

  const pills = wrap.querySelector("#valuesPills");
  VALUE_OPTIONS.forEach(v => pills.appendChild(makePill(v, state.values, 10)));

  const custom = wrap.querySelector("#customValue");
  custom.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = custom.value.trim();
    if (!val) return;
    if (!state.values.includes(val)) state.values.push(val);
    custom.value = "";
    saveState();
    render();
  });
}

function renderPillarsStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";
  wrap.innerHTML = `
    <h2>Pillars</h2>
    <p>Pick <b>3–5</b> pillars. These are the few areas that keep your life stable and aligned.</p>
    <div class="pills" id="pillarsPills"></div>
    <div class="field">
      <label>Custom pillar (optional)</label>
      <input id="customPillar" type="text" placeholder="Type a pillar and press Enter" />
      <div class="help">Example: “Sleep”, “Sobriety”, “Music”, “Prayer”, “Coding”.</div>
    </div>
  `;
  stepHost.appendChild(wrap);

  const pills = wrap.querySelector("#pillarsPills");
  PILLAR_OPTIONS.forEach(p => pills.appendChild(makePill(p, state.pillars, 7)));

  const custom = wrap.querySelector("#customPillar");
  custom.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = custom.value.trim();
    if (!val) return;
    if (!state.pillars.includes(val)) state.pillars.push(val);
    custom.value = "";
    saveState();
    render();
  });
}

function renderIdealEmotionStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";
  wrap.innerHTML = `
    <h2>Ideal Emotion</h2>
    <p>How do you want to feel most days? (Not the peak highs—your <b>default</b>.)</p>

    <div class="grid">
      <div class="field">
        <label>Pick one</label>
        <select id="idealEmotion">
          <option value="">Select…</option>
          ${["Calm","Confident","Present","Energized","Grateful","Grounded","Focused","Free","Playful","Powerful","Clear","Unbothered"]
            .map(x => `<option ${state.idealEmotion===x ? "selected":""} value="${x}">${x}</option>`).join("")}
        </select>
        <div class="help">You can change this later.</div>
      </div>

      <div class="field">
        <label>Why that emotion?</label>
        <input id="emotionWhy" type="text" placeholder="Because when I feel ___, I show up as ___." value="${escapeHtml(state.emotionWhy || "")}" />
        <div class="help">Short is fine. One sentence.</div>
      </div>
    </div>

    <div class="field">
      <label>Optional: define it</label>
      <textarea id="emotionDefine" placeholder="When I feel this, I… (behaviors, habits, energy, mindset)"></textarea>
      <div class="help">This does not show in results yet—easy future add.</div>
    </div>
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

function renderTriggersStep(){
  const wrap = document.createElement("div");
  wrap.className = "step";
  wrap.innerHTML = `
    <h2>Triggers</h2>
    <p>Identify what knocks you off-track—and write a default response you can use when it happens.</p>

    <div id="triggersList"></div>

    <div class="field">
      <button id="addTrigger" class="btn btn-ghost" type="button">+ Add another trigger</button>
      <div class="help">Keep it simple: trigger → response.</div>
    </div>
  `;
  stepHost.appendChild(wrap);

  const list = wrap.querySelector("#triggersList");
  state.triggers.forEach((t, idx) => {
    const block = document.createElement("div");
    block.className = "block";
    block.innerHTML = `
      <div class="grid">
        <div class="field">
          <label>Trigger #${idx + 1}</label>
          <input data-k="trigger" data-i="${idx}" type="text" placeholder="Example: Lack of sleep, doomscrolling, feeling judged…" value="${escapeHtml(t.trigger || "")}" />
        </div>
        <div class="field">
          <label>Default response</label>
          <input data-k="response" data-i="${idx}" type="text" placeholder="Example: 10-min walk + water + restart task…" value="${escapeHtml(t.response || "")}" />
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:10px;">
        <button class="btn btn-ghost" data-del="${idx}" type="button">Remove</button>
      </div>
    `;
    list.appendChild(block);
  });

  list.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", () => {
      const i = Number(inp.dataset.i);
      const k = inp.dataset.k;
      state.triggers[i][k] = inp.value;
      saveState();
    });
  });

  list.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.del);
      state.triggers.splice(i, 1);
      if (state.triggers.length === 0) state.triggers.push({trigger:"", response:""});
      saveState();
      render();
    });
  });

  wrap.querySelector("#addTrigger").addEventListener("click", () => {
    state.triggers.push({ trigger: "", response: "" });
    saveState();
    render();
  });
}

function validateCurrentStep(){
  if (stepIndex === 0) {
    if (state.values.length < 3) return toast("Pick at least 3 values.");
  }
  if (stepIndex === 1) {
    if (state.pillars.length < 2) return toast("Pick at least 2 pillars.");
  }
  if (stepIndex === 2) {
    if (!state.idealEmotion) return toast("Select an ideal emotion.");
  }
  if (stepIndex === 3) {
    const any = state.triggers.some(t => (t.trigger || "").trim() && (t.response || "").trim());
    if (!any) return toast("Add at least one trigger + response (even a rough one).");
  }
  return true;
}

function showResults(){
  elApp.hidden = true;
  elResults.hidden = false;

  const triggersClean = state.triggers
    .map(t => ({ trigger: (t.trigger || "").trim(), response: (t.response || "").trim() }))
    .filter(t => t.trigger || t.response);

  resultsBody.innerHTML = `
    <div class="block">
      <h3>Values</h3>
      <div class="kv">${(state.values || []).map(v => `• ${escapeHtml(v)}`).join("<br/>") || "<span class='muted'>None</span>"}</div>
      <div class="tagline">Rule: when in doubt, choose what aligns with these.</div>
    </div>

    <div class="block">
      <h3>Pillars</h3>
      <div class="kv">${(state.pillars || []).map(p => `• ${escapeHtml(p)}`).join("<br/>") || "<span class='muted'>None</span>"}</div>
      <div class="tagline">These are the few areas that keep you stable.</div>
    </div>

    <div class="block">
      <h3>Ideal Emotion</h3>
      <div class="kv">
        <div><b>${escapeHtml(state.idealEmotion || "—")}</b></div>
        ${state.emotionWhy ? `<div class="muted">${escapeHtml(state.emotionWhy)}</div>` : `<div class="muted">No “why” added.</div>`}
      </div>
    </div>

    <div class="block">
      <h3>Triggers → Responses</h3>
      <div class="kv">
        ${triggersClean.length
          ? triggersClean.map((t, i) =>
              `<div><b>${i+1}.</b> ${escapeHtml(t.trigger || "—")} <span class="muted">→</span> ${escapeHtml(t.response || "—")}</div>`
            ).join("<br/>")
          : `<span class="muted">None</span>`
        }
      </div>
    </div>

    <div class="block">
      <h3>Next step (simple)</h3>
      <div class="kv">
        Pick <b>one pillar</b> to strengthen this week and choose a <b>single habit</b> that supports it.
        <br/><span class="muted">Future feature: weekly check-in + streak.</span>
      </div>
    </div>
  `;

  saveState();
  elResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
      triggers: Array.isArray(parsed.triggers) && parsed.triggers.length ? parsed.triggers : structuredClone(DEFAULTS.triggers),
      values: Array.isArray(parsed.values) ? parsed.values : [],
      pillars: Array.isArray(parsed.pillars) ? parsed.pillars : [],
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function buildSummaryText(){
  const triggersClean = state.triggers
    .map(t => ({ trigger: (t.trigger || "").trim(), response: (t.response || "").trim() }))
    .filter(t => t.trigger || t.response);

  return [
    "WHO Snapshot",
    "",
    "VALUES:",
    ...(state.values || []).map(v => `- ${v}`),
    "",
    "PILLARS:",
    ...(state.pillars || []).map(p => `- ${p}`),
    "",
    "IDEAL EMOTION:",
    `- ${state.idealEmotion || ""}`,
    state.emotionWhy ? `- Why: ${state.emotionWhy}` : "",
    "",
    "TRIGGERS → RESPONSES:",
    ...(triggersClean.length
      ? triggersClean.map((t, i) => `${i+1}. ${t.trigger} -> ${t.response}`)
      : ["- (none)"]),
    "",
    `Main site: ${MAIN_SITE}`
  ].filter(Boolean).join("\n");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Auto-show app if user already has progress
if (state && (state.values.length || state.pillars.length || state.idealEmotion || (state.triggers||[]).some(t => t.trigger || t.response))) {
  elApp.hidden = false;
  render();
}
