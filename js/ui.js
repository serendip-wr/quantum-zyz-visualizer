import { formatComplex, parseComplex } from './complex.js';
import { matrix2 } from './matrix.js';
import { PRESET_GATES, blochVectorFromAngles, rx, ry, rz } from './quantum.js';
import { decomposeZYZ } from './zyz.js';
import { BlochRenderer, RotationAnimator } from './bloch.js';

const $ = selector => document.querySelector(selector);
const matrixIds = ['u00', 'u01', 'u10', 'u11'];

function parseReal(source, name = '角度') {
  const value = parseComplex(source);
  if (Math.abs(value.im) > 1e-12) throw new Error(`${name}必须是实数`);
  return value.re;
}

function angleText(value) {
  const degrees = value * 180 / Math.PI;
  return { radians: value.toFixed(6), degrees: `${Number(degrees.toFixed(3))}°` };
}

function matrixMarkup(matrix) { return matrix.flat().map(value => `<span>${formatComplex(value)}</span>`).join(''); }

function initialVector() {
  const presets = {
    zero: [0, 0], one: [Math.PI, 0], plus: [Math.PI / 2, 0], minus: [Math.PI / 2, Math.PI],
    'plus-i': [Math.PI / 2, Math.PI / 2], 'minus-i': [Math.PI / 2, -Math.PI / 2]
  };
  const key = $('#initial-state').value;
  const angles = key === 'custom'
    ? [parseReal($('#state-theta').value, 'θ'), parseReal($('#state-phi').value, 'φ')]
    : presets[key];
  return blochVectorFromAngles(...angles);
}

function updateAnimatorState(animator) {
  try { animator.setInitial(initialVector()); $('#input-error').hidden = true; }
  catch (error) { showError(error.message); }
}

function showError(message) {
  const element = $('#input-error'); element.textContent = message; element.hidden = false;
}

function setStatus(element, text, kind) { element.textContent = text; element.className = `status-pill ${kind}`; }

function fillMatrix(matrix) {
  matrix.flat().forEach((value, index) => { document.getElementById(matrixIds[index]).value = formatComplex(value, 10); });
}

function renderAngles(result) {
  const specs = [
    ['δ', 'GLOBAL PHASE', result.delta], ['α', 'FINAL Z ROTATION', result.alpha],
    ['β', 'Y ROTATION', result.beta], ['γ', 'FIRST Z ROTATION', result.gamma]
  ];
  $('#angle-list').innerHTML = specs.map(([symbol, name, value]) => {
    const formatted = angleText(value);
    return `<div class="angle-row"><div class="angle-symbol">${symbol}</div><div class="angle-name">${name}</div><div class="angle-value"><b>${formatted.radians} rad</b><span>${formatted.degrees}</span></div></div>`;
  }).join('');
}

function renderCircuit(result) {
  const operations = [['z', 'γ', result.gamma], ['y', 'β', result.beta], ['z', 'α', result.alpha]];
  $('#circuit').innerHTML = `<span class="wire-label">|ψ⟩</span><span class="wire"></span>${operations.map(([axis, symbol, angle]) => `<div class="gate"><b>R<sub>${axis}</sub>(${symbol})</b><span>${angleText(angle).degrees}</span></div><span class="wire"></span>`).join('')}`;
}

function renderSequence(result) {
  const operations = [['Rz(γ)', result.gamma], ['Ry(β)', result.beta], ['Rz(α)', result.alpha]];
  $('#sequence-list').innerHTML = operations.map(([label, angle]) => `<li><b>${label}</b><span>${angleText(angle).degrees}</span></li>`).join('');
}

function updateAnimationUI(state) {
  const items = [...document.querySelectorAll('#sequence-list li')];
  items.forEach((item, index) => {
    item.classList.toggle('done', index < state.step);
    item.classList.toggle('active', index === state.step && state.step < items.length);
  });
  $('#current-operation').textContent = state.active ? `${state.active.label} · ${angleText(state.active.angle * state.progress).degrees}` : 'Final state';
  $('#play-pause').textContent = state.playing ? '❚❚' : '▶';
  $('#play-pause').setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
  const { x, y, z } = state.vector;
  $('#vector-readout').textContent = `x ${x.toFixed(3)}   y ${y.toFixed(3)}   z ${z.toFixed(3)}`;
}

export function initializeUI() {
  const renderer = new BlochRenderer($('#bloch-canvas'));
  const animator = new RotationAnimator(renderer, updateAnimationUI);

  const presets = $('#preset-gates');
  Object.keys(PRESET_GATES).forEach(name => {
    const button = document.createElement('button'); button.className = 'preset-button'; button.textContent = name;
    button.addEventListener('click', () => { fillMatrix(PRESET_GATES[name]); document.querySelectorAll('.preset-button').forEach(b => b.classList.toggle('active', b === button)); analyze(); });
    presets.append(button);
  });

  document.querySelectorAll('[data-rotation]').forEach(button => button.addEventListener('click', () => {
    try {
      const angle = parseReal($('#rotation-angle').value, '旋转角');
      const gates = { Rx: rx, Ry: ry, Rz: rz };
      fillMatrix(gates[button.dataset.rotation](angle));
      document.querySelectorAll('.preset-button').forEach(b => b.classList.remove('active'));
      analyze();
    } catch (error) { showError(error.message); }
  }));

  function analyze(source = 'ui') {
    try {
      const values = matrixIds.map(id => parseComplex(document.getElementById(id).value));
      const U = matrix2(...values);
      const result = decomposeZYZ(U);
      $('#matrix-original').innerHTML = matrixMarkup(U);
      if (!result.success) {
        setStatus($('#unitary-status'), 'Unitary: No', 'error');
        setStatus($('#verification-status'), '分解已停止', 'error');
        showError(result.message);
        $('#angle-list').innerHTML = '';
        $('#matrix-reconstructed').textContent = '—';
        $('#reconstruction-error').textContent = '—';
        $('#circuit').innerHTML = '<span class="hint">仅酉矩阵可以生成量子线路。</span>';
        return result;
      }
      $('#input-error').hidden = true;
      setStatus($('#unitary-status'), 'Unitary: Yes', 'success');
      const suffix = result.singularity === 'beta-zero' ? ' · β≈0' : result.singularity === 'beta-pi' ? ' · β≈π' : '';
      setStatus($('#verification-status'), `${result.verified ? '验证通过' : '验证失败'}${suffix}`, result.verified ? 'success' : 'error');
      renderAngles(result);
      $('#matrix-reconstructed').innerHTML = matrixMarkup(result.reconstructed);
      $('#reconstruction-error').textContent = result.error.toExponential(2).replace('e', ' × 10^');
      renderCircuit(result); renderSequence(result);
      animator.setAngles(result); updateAnimatorState(animator);
      return result;
    } catch (error) {
      setStatus($('#unitary-status'), '输入无效', 'error');
      setStatus($('#verification-status'), '尚未验证', 'neutral');
      showError(error.message);
      if (source === 'tool') throw error;
    }
  }

  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    Promise.resolve(context.registerTool({
      name: 'analyze_unitary_matrix',
      title: 'Analyze unitary matrix',
      description: 'Fill the visible 2×2 complex matrix editor, test unitarity, compute its ZYZ decomposition, and update every visualization.',
      inputSchema: {
        type: 'object',
        properties: {
          u00: { type: 'string' }, u01: { type: 'string' },
          u10: { type: 'string' }, u11: { type: 'string' }
        },
        required: ['u00', 'u01', 'u10', 'u11'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || matrixIds.some(id => typeof input[id] !== 'string')) throw new Error('All four matrix entries must be strings.');
        matrixIds.forEach(id => { document.getElementById(id).value = input[id]; });
        const result = analyze('tool');
        if (!result.success) return { unitary: false, message: result.message };
        return { unitary: true, verified: result.verified, delta: result.delta, alpha: result.alpha, beta: result.beta, gamma: result.gamma, error: result.error };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
  }

  $('#analyze-button').addEventListener('click', analyze);
  matrixIds.forEach(id => document.getElementById(id).addEventListener('keydown', event => { if (event.key === 'Enter') analyze(); }));
  $('#initial-state').addEventListener('change', () => {
    $('#custom-state').hidden = $('#initial-state').value !== 'custom'; updateAnimatorState(animator);
  });
  ['#state-theta', '#state-phi'].forEach(selector => $(selector).addEventListener('change', () => updateAnimatorState(animator)));
  $('#play-pause').addEventListener('click', () => animator.toggle());
  $('#previous-step').addEventListener('click', () => animator.previous());
  $('#next-step').addEventListener('click', () => animator.next());
  $('#reset-animation').addEventListener('click', () => animator.reset());

  analyze();
  return { analyze, animator };
}
