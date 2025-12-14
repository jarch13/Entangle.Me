// Resonance demo logic.
// This is a teaching demo: we infer a hidden "linked" partner via correlations.
// Correlation is reduced by "noise" (decoherence), modeled as random flips.

const el = (id) => document.getElementById(id);

const trials = el("trials");
const trialsVal = el("trialsVal");
const candidates = el("candidates");
const candidatesVal = el("candidatesVal");
const noise = el("noise");
const noiseVal = el("noiseVal");

const runBtn = el("runBtn");
const rerollBtn = el("rerollBtn");

const statusPill = el("statusPill");
const topMatch = el("topMatch");
const topCorr = el("topCorr");
const decoherenceLabel = el("decoherenceLabel");
const rankingTableBody = el("rankingTable").querySelector("tbody");

function fmt(x, digits=3){
  return (Math.round(x * (10**digits)) / (10**digits)).toFixed(digits);
}

function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

function interpretCorrelation(c){
  // c in [-1, 1]
  const abs = Math.abs(c);
  if (abs >= 0.70) return {label:"Strong correlation", cls:"good"};
  if (abs >= 0.35) return {label:"Moderate correlation", cls:"warn"};
  return {label:"Baseline (chance-like)", cls:"bad"};
}

function decoherenceText(noiseVal){
  // Map noise [0,1] to an intuitive label
  if (noiseVal <= 0.10) return "Low (coherent)";
  if (noiseVal <= 0.30) return "Medium (partially coherent)";
  if (noiseVal <= 0.55) return "High (fragile)";
  return "Severe (decohered)";
}

// Random ±1
function randPM(){
  return Math.random() < 0.5 ? -1 : 1;
}

// Compute correlation average(A * B)
function correlationAB(A, B){
  let s = 0;
  for (let i=0;i<A.length;i++) s += A[i] * B[i];
  return s / A.length;
}

let hiddenSoulmateIndex = 0;

function rerollSoulmate(){
  hiddenSoulmateIndex = Math.floor(Math.random() * parseInt(candidates.value, 10));
  statusPill.textContent = "Ready (hidden soulmate re-selected)";
}

function syncLabels(){
  trialsVal.textContent = trials.value;
  candidatesVal.textContent = candidates.value;
  noiseVal.textContent = fmt(parseFloat(noise.value), 2);
  decoherenceLabel.textContent = decoherenceText(parseFloat(noise.value));
}

trials.addEventListener("input", syncLabels);
candidates.addEventListener("input", () => {
  syncLabels();
  rerollSoulmate(); // keep it consistent with new pool size
});
noise.addEventListener("input", syncLabels);

rerollBtn.addEventListener("click", rerollSoulmate);

runBtn.addEventListener("click", () => {
  statusPill.textContent = "Probing correlations…";
  runProbe();
});

function runProbe(){
  const T = parseInt(trials.value, 10);
  const N = parseInt(candidates.value, 10);
  const pNoise = parseFloat(noise.value);

  // Generate your outcomes A: random ±1 (looks random locally)
  const A = Array.from({length: T}, randPM);

  // Build candidates B_i
  const results = [];

  for (let i=0; i<N; i++){
    let B = new Array(T);

    if (i === hiddenSoulmateIndex){
      // Linked partner: B matches A but flips with probability pNoise (decoherence)
      for (let t=0; t<T; t++){
        const flip = Math.random() < pNoise;
        B[t] = flip ? -A[t] : A[t];
      }
    } else {
      // Baseline: independent random
      for (let t=0; t<T; t++) B[t] = randPM();
    }

    const corr = correlationAB(A, B);
    results.push({idx:i, corr});
  }

  // Rank by absolute correlation (strong correlation in either direction stands out)
  results.sort((a,b) => Math.abs(b.corr) - Math.abs(a.corr));

  // Fill UI
  const top = results[0];
  const topName = `Candidate ${String(top.idx + 1).padStart(2,"0")}`;
  topMatch.textContent = topName;
  topCorr.textContent = `${fmt(top.corr, 3)} (abs ${fmt(Math.abs(top.corr), 3)})`;
  decoherenceLabel.textContent = decoherenceText(pNoise);

  // Status pill color hint based on expected corr for linked partner ~ 1 - 2p
  const expected = clamp(1 - 2*pNoise, -1, 1);
  const expAbs = Math.abs(expected);

  // A simple qualitative status
  let status = "Done";
  if (expAbs >= 0.70) status += " — correlations should be obvious";
  else if (expAbs >= 0.35) status += " — correlations may need more trials";
  else status += " — high noise can mask correlations";

  statusPill.textContent = status;

  // Render table
  rankingTableBody.innerHTML = "";
  results.forEach((r, k) => {
    const name = `Candidate ${String(r.idx + 1).padStart(2,"0")}`;
    const interp = interpretCorrelation(r.corr);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k+1}</td>
      <td>
        <span class="badge">
          <span class="dot ${interp.cls}"></span>
          ${name}
        </span>
      </td>
      <td>${fmt(r.corr, 3)}</td>
      <td>${interp.label}</td>
    `;
    rankingTableBody.appendChild(tr);
  });

  // Optional: subtly hint if the top match is the hidden soulmate (for the presenter)
  // We avoid revealing it outright by default; uncomment for debugging:
  // console.log("Hidden soulmate:", hiddenSoulmateIndex + 1);
}

syncLabels();
rerollSoulmate();
