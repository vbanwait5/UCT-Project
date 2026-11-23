const progressFill = document.querySelector('.progress-fill');

function updateReadingProgress() {
  if (!progressFill) return;
  const doc = document.documentElement;
  const available = doc.scrollHeight - doc.clientHeight;
  const progress = available > 0 ? (doc.scrollTop / available) * 100 : 0;
  progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
updateReadingProgress();

const stateLab = document.querySelector('#state-lab');
if (stateLab) {
  let alpha = 1;
  let beta = 0;
  const ket = document.querySelector('#ket-state');
  const p0 = document.querySelector('#p0');
  const p1 = document.querySelector('#p1');
  const p0Bar = document.querySelector('#p0-bar');
  const p1Bar = document.querySelector('#p1-bar');
  const message = document.querySelector('#measurement-message');

  const clean = value => Math.abs(value) < 1e-10 ? 0 : value;
  const format = value => {
    const v = clean(value);
    if (v === 0 || v === 1 || v === -1) return String(v);
    return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  };

  function renderState(note = '') {
    alpha = clean(alpha);
    beta = clean(beta);
    const prob0 = alpha ** 2;
    const prob1 = beta ** 2;
    const sign = beta < 0 ? '−' : '+';
    ket.textContent = `${format(alpha)}|0⟩ ${sign} ${format(Math.abs(beta))}|1⟩`;
    p0.textContent = `${Math.round(prob0 * 100)}%`;
    p1.textContent = `${Math.round(prob1 * 100)}%`;
    p0Bar.style.width = `${prob0 * 100}%`;
    p1Bar.style.width = `${prob1 * 100}%`;
    message.textContent = note;
  }

  stateLab.addEventListener('click', event => {
    const gate = event.target.closest('button')?.dataset.gate;
    if (!gate) return;
    message.textContent = '';
    if (gate === 'zero') [alpha, beta] = [1, 0];
    if (gate === 'one') [alpha, beta] = [0, 1];
    if (gate === 'plus') [alpha, beta] = [Math.SQRT1_2, Math.SQRT1_2];
    if (gate === 'x') [alpha, beta] = [beta, alpha];
    if (gate === 'h') [alpha, beta] = [(alpha + beta) * Math.SQRT1_2, (alpha - beta) * Math.SQRT1_2];
    if (gate === 'measure') {
      const observed = Math.random() < alpha ** 2 ? 0 : 1;
      [alpha, beta] = observed === 0 ? [1, 0] : [0, 1];
      renderState(`Measured ${observed}. The state has collapsed to |${observed}⟩.`);
      return;
    }
    renderState();
  });
  renderState('Try H twice: the second interference step returns |0⟩.');
}

document.querySelectorAll('[data-reveal]').forEach(button => {
  button.addEventListener('click', () => {
    const answer = document.querySelector(`#${button.dataset.reveal}`);
    if (!answer) return;
    answer.classList.toggle('visible');
    button.textContent = answer.classList.contains('visible') ? 'Hide answer' : 'Reveal answer';
  });
});

const reversibleOracleLab = document.querySelector('#reversible-oracle-lab');
if (reversibleOracleLab) {
  const xInput = document.querySelector('#oracle-x');
  const yInput = document.querySelector('#oracle-y');
  const fxOutput = document.querySelector('#oracle-fx');
  const mappingOutput = document.querySelector('#oracle-mapping');

  function updateOracleMapping() {
    const x = xInput.value;
    const y = Number(yInput.value);
    const fx = [...x].reduce((parity, bit) => parity ^ Number(bit), 0);
    const target = y ^ fx;
    fxOutput.textContent = String(fx);
    mappingOutput.textContent = `|${x}⟩|${y}⟩  ↦  |${x}⟩|${target}⟩`;
  }

  xInput.addEventListener('change', updateOracleMapping);
  yInput.addEventListener('change', updateOracleMapping);
  updateOracleMapping();
}

const promiseLab = document.querySelector('#promise-lab');
if (promiseLab) {
  const secretInput = document.querySelector('#promise-secret');
  const pairOutput = document.querySelector('#promise-pairs');
  const secretEcho = document.querySelector('#promise-secret-echo');
  const colors = ['#8e1616', '#245a73', '#8b6a24', '#5d4777'];

  function bits(value, width = 3) {
    return value.toString(2).padStart(width, '0');
  }

  function renderPromisePairs() {
    const secret = parseInt(secretInput.value, 2);
    const seen = new Set();
    const pairs = [];
    for (let x = 0; x < 8; x += 1) {
      if (seen.has(x)) continue;
      const partner = x ^ secret;
      seen.add(x);
      seen.add(partner);
      pairs.push([x, partner]);
    }
    secretEcho.textContent = bits(secret);
    pairOutput.innerHTML = pairs.map((pair, index) => (
      `<div class="pair-card" style="--pair-color:${colors[index]}"><strong>output ${String.fromCharCode(65 + index)}</strong><span class="binary">f(${bits(pair[0])}) = f(${bits(pair[1])})</span></div>`
    )).join('');
  }

  secretInput.addEventListener('change', renderPromisePairs);
  renderPromisePairs();
}

const rankLab = document.querySelector('#rank-lab');
if (rankLab) {
  const rowsOutput = document.querySelector('#rank-rows');
  const rankOutput = document.querySelector('#rank-value');
  const rankBar = document.querySelector('#rank-bar');
  const candidateOutput = document.querySelector('#rank-candidate');
  const sampleButton = document.querySelector('#sample-equation');
  const resetButton = document.querySelector('#reset-equations');
  const n = 4;
  const secret = 0b1011;
  let rows = [];

  const parity = value => {
    let result = 0;
    let v = value;
    while (v) { result ^= (v & 1); v >>= 1; }
    return result;
  };
  const bitString = value => value.toString(2).padStart(n, '0');

  function gf2Rank(values) {
    const basis = Array(n).fill(0);
    let rank = 0;
    values.forEach(original => {
      let value = original;
      for (let bit = n - 1; bit >= 0; bit -= 1) {
        if (((value >> bit) & 1) === 0) continue;
        if (basis[bit]) value ^= basis[bit];
        else { basis[bit] = value; rank += 1; break; }
      }
    });
    return rank;
  }

  function candidates() {
    const result = [];
    for (let value = 1; value < 2 ** n; value += 1) {
      if (rows.every(row => parity(row.value & value) === 0)) result.push(value);
    }
    return result;
  }

  function renderRankLab() {
    const rank = gf2Rank(rows.map(row => row.value));
    rowsOutput.innerHTML = rows.length ? rows.map((row, index) => (
      `<div class="equation-row${row.independent ? '' : ' dependent'}"><span>${bitString(row.value)} · s = 0</span><span>${row.independent ? `independent ${index + 1}` : 'dependent'}</span></div>`
    )).join('') : '<p class="interactive-caption">No samples yet. Draw equations from the subspace s⊥.</p>';
    rankOutput.textContent = `${rank} / ${n - 1}`;
    rankBar.style.width = `${(rank / (n - 1)) * 100}%`;
    const possible = candidates();
    candidateOutput.textContent = rank === n - 1
      ? `Unique nonzero solution: s = ${bitString(possible[0])}`
      : `${possible.length} nonzero candidates remain.`;
  }

  sampleButton.addEventListener('click', () => {
    const valid = [];
    for (let z = 0; z < 2 ** n; z += 1) if (parity(z & secret) === 0) valid.push(z);
    const value = valid[Math.floor(Math.random() * valid.length)];
    const before = gf2Rank(rows.map(row => row.value));
    const after = gf2Rank([...rows.map(row => row.value), value]);
    rows.push({ value, independent: after > before });
    renderRankLab();
  });
  resetButton.addEventListener('click', () => { rows = []; renderRankLab(); });
  renderRankLab();
}

const interferenceProofLab = document.querySelector('#interference-proof-lab');
if (interferenceProofLab) {
  const sInput = document.querySelector('#proof-s');
  const zInput = document.querySelector('#proof-z');
  const dotOutput = document.querySelector('#proof-dot');
  const contributionsOutput = document.querySelector('#proof-contributions');
  const verdictOutput = document.querySelector('#proof-verdict');
  const x0 = 0b011;
  const parity = value => {
    let p = 0;
    let v = value;
    while (v) { p ^= (v & 1); v >>= 1; }
    return p;
  };

  function renderInterferenceProof() {
    const s = parseInt(sInput.value, 2);
    const z = parseInt(zInput.value, 2);
    const dot = parity(s & z);
    const first = parity(x0 & z) ? -1 : 1;
    const second = parity((x0 ^ s) & z) ? -1 : 1;
    const sum = first + second;
    dotOutput.textContent = String(dot);
    contributionsOutput.textContent = `${first} + ${second} = ${sum}`;
    verdictOutput.textContent = sum === 0
      ? 'Destructive interference: this z has amplitude 0 and cannot be measured.'
      : 'Constructive interference: this z survives, with probability 1/4 for n = 3.';
  }

  sInput.addEventListener('change', renderInterferenceProof);
  zInput.addEventListener('change', renderInterferenceProof);
  renderInterferenceProof();
}

const birthdayLab = document.querySelector('#birthday-lab');
if (birthdayLab) {
  const nInput = document.querySelector('#birthday-n');
  const qInput = document.querySelector('#birthday-q');
  const nValue = document.querySelector('#birthday-n-value');
  const qValue = document.querySelector('#birthday-q-value');
  const exactBar = document.querySelector('#birthday-exact-bar');
  const empiricalBar = document.querySelector('#birthday-empirical-bar');
  const boundBar = document.querySelector('#birthday-bound-bar');
  const exactValue = document.querySelector('#birthday-exact-value');
  const empiricalValue = document.querySelector('#birthday-empirical-value');
  const boundValue = document.querySelector('#birthday-bound-value');
  const runButton = document.querySelector('#run-birthday');

  const logChoose = (n, k) => {
    if (k < 0 || k > n) return -Infinity;
    let total = 0;
    const r = Math.min(k, n - k);
    for (let i = 1; i <= r; i += 1) total += Math.log(n - r + i) - Math.log(i);
    return total;
  };

  function exactCollisionProbability(n, q) {
    const size = 2 ** n;
    if (q > size / 2) return 1;
    const logNoCollision = logChoose(size / 2, q) + q * Math.log(2) - logChoose(size, q);
    return 1 - Math.exp(logNoCollision);
  }

  function simulate(n, q, trials = 500) {
    const size = 2 ** n;
    let collisions = 0;
    for (let trial = 0; trial < trials; trial += 1) {
      const secret = 1 + Math.floor(Math.random() * (size - 1));
      const chosen = new Set();
      let collided = false;
      while (chosen.size < q && !collided) {
        const x = Math.floor(Math.random() * size);
        if (chosen.has(x)) continue;
        if (chosen.has(x ^ secret)) collided = true;
        chosen.add(x);
      }
      if (collided) collisions += 1;
    }
    return collisions / trials;
  }

  function renderBirthdayLab(runSimulation = false) {
    const n = Number(nInput.value);
    const size = 2 ** n;
    qInput.max = String(Math.min(256, size / 2));
    if (Number(qInput.value) > Number(qInput.max)) qInput.value = qInput.max;
    const q = Number(qInput.value);
    const exact = exactCollisionProbability(n, q);
    const bound = Math.min(1, (q * (q - 1)) / (2 * (size - 1)));
    const empirical = runSimulation ? simulate(n, q) : exact;
    nValue.textContent = n;
    qValue.textContent = q;
    exactBar.style.width = `${exact * 100}%`;
    empiricalBar.style.width = `${empirical * 100}%`;
    boundBar.style.width = `${bound * 100}%`;
    exactValue.textContent = `${(exact * 100).toFixed(1)}%`;
    empiricalValue.textContent = `${(empirical * 100).toFixed(1)}%`;
    boundValue.textContent = `${(bound * 100).toFixed(1)}%`;
  }

  nInput.addEventListener('input', () => renderBirthdayLab(false));
  qInput.addEventListener('input', () => renderBirthdayLab(false));
  runButton.addEventListener('click', () => renderBirthdayLab(true));
  renderBirthdayLab(false);
}

document.querySelectorAll('.claim-card button').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.claim-card');
    card.classList.toggle('revealed');
    button.textContent = card.classList.contains('revealed') ? 'Hide analysis' : 'Check claim';
  });
});
