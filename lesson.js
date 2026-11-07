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

const sizeSlider = document.querySelector('#input-size');
if (sizeSlider) {
  const nOutput = document.querySelector('#n-output');
  const quantumBar = document.querySelector('#quantum-bar');
  const classicalBar = document.querySelector('#classical-bar');
  const quantumValue = document.querySelector('#quantum-value');
  const classicalValue = document.querySelector('#classical-value');

  function updateRace() {
    const n = Number(sizeSlider.value);
    const quantum = n;
    const classical = Math.ceil(2 ** (n / 2));
    const max = classical;
    nOutput.textContent = n;
    quantumValue.textContent = `≈ ${quantum}`;
    classicalValue.textContent = `≈ ${classical.toLocaleString()}`;
    quantumBar.style.width = `${Math.max(1.5, (quantum / max) * 100)}%`;
    classicalBar.style.width = '100%';
  }

  sizeSlider.addEventListener('input', updateRace);
  updateRace();
}

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
