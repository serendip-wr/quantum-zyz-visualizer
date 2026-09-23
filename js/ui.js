import { formatComplex, parseComplex } from './complex.js';
import { matrix2 } from './matrix.js';
import { PRESET_GATES, blochVectorFromAngles, rotationAroundAxis, rx, ry, rz } from './quantum.js';
import { decomposeZYZ } from './zyz.js';
import { BlochRenderer, RotationAnimator } from './bloch.js';
import { applyLanguage, getLanguage, localizeError, setLanguage, t } from './i18n.js';

const $ = selector => document.querySelector(selector);
const matrixIds = ['u00', 'u01', 'u10', 'u11'];

function parseReal(source, name = 'rotationAngle') {
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
    ? [parseReal($('#state-theta').value, 'stateTheta'), parseReal($('#state-phi').value, 'statePhi')]
    : presets[key];
  return blochVectorFromAngles(...angles);
}

let rawInputError = null;
function clearError() { rawInputError = null; $('#input-error').hidden = true; }
function updateAnimatorState(animator) {
  try { animator.setInitial(initialVector()); clearError(); }
  catch (error) { showError(error.message); }
}

function showError(message) {
  rawInputError = message;
  const element = $('#input-error'); element.textContent = localizeError(message); element.hidden = false;
}

function setStatus(element, text, kind) { element.textContent = text; element.className = `status-pill ${kind}`; }

function fillMatrix(matrix) {
  matrix.flat().forEach((value, index) => { document.getElementById(matrixIds[index]).value = formatComplex(value, 10); });
}

function renderAngles(result) {
  const specs = [
    ['δ', t('globalPhase'), result.delta], ['α', t('finalZ'), result.alpha],
    ['β', t('yRotation'), result.beta], ['γ', t('firstZ'), result.gamma]
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

function renderCustomSequence(rotation) {
  $('#sequence-list').innerHTML = `<li><b>R<sub>n</sub>(θ)</b><span>${angleText(rotation.angle).degrees}</span></li>`;
}

let lastAnimationState = null;
function updateAnimationUI(state) {
  lastAnimationState = state;
  const items = [...document.querySelectorAll('#sequence-list li')];
  items.forEach((item, index) => {
    item.classList.toggle('done', index < state.step);
    item.classList.toggle('active', index === state.step && state.step < items.length);
  });
  $('#current-operation').textContent = state.active ? `${state.active.label} · ${angleText(state.active.angle * state.progress).degrees}` : t('finalOperation');
  $('#play-pause').textContent = state.playing ? '❚❚' : '▶';
  $('#play-pause').setAttribute('aria-label', t(state.playing ? 'pause' : 'play'));
  const { x, y, z } = state.vector;
  $('#vector-readout').textContent = `x ${x.toFixed(3)}   y ${y.toFixed(3)}   z ${z.toFixed(3)}`;
}

export function initializeUI() {
  applyLanguage();
  const renderer = new BlochRenderer($('#bloch-canvas'));
  const animator = new RotationAnimator(renderer, updateAnimationUI);
  let lastResult = null;
  let customRotation = null;
  let analysisState = 'waiting';

  function renderAnalysisStatus() {
    const unitaryStatus = $('#unitary-status');
    const verificationStatus = $('#verification-status');
    if (analysisState === 'invalid') {
      setStatus(unitaryStatus, t('invalidInput'), 'error');
      setStatus(verificationStatus, t('notVerified'), 'neutral');
    } else if (analysisState === 'nonunitary') {
      setStatus(unitaryStatus, t('unitaryNo'), 'error');
      setStatus(verificationStatus, t('stopped'), 'error');
    } else if (analysisState === 'unitary' && lastResult) {
      const suffix = lastResult.singularity === 'beta-zero' ? ` · ${t('betaZero')}` : lastResult.singularity === 'beta-pi' ? ` · ${t('betaPi')}` : '';
      setStatus(unitaryStatus, t('unitaryYes'), 'success');
      setStatus(verificationStatus, `${t(lastResult.verified ? 'verified' : 'failed')}${suffix}`, lastResult.verified ? 'success' : 'error');
    } else {
      setStatus(unitaryStatus, t('waiting'), 'neutral');
      setStatus(verificationStatus, t('notVerified'), 'neutral');
    }
  }

  function refreshLanguage() {
    applyLanguage();
    renderAnalysisStatus();
    if (lastResult) renderAngles(lastResult);
    if (analysisState === 'nonunitary') $('#circuit').innerHTML = `<span class="hint">${t('noCircuit')}</span>`;
    if (rawInputError) $('#input-error').textContent = localizeError(rawInputError);
    if (activeExpressionInput) $('#assistant-target').textContent = t('editing', { field: activeExpressionInput.dataset.inputLabel || activeExpressionInput.id });
    if (lastAnimationState) updateAnimationUI(lastAnimationState);
    else $('#current-operation').textContent = t('initialOperation');
  }

  $('#language-toggle').addEventListener('click', () => {
    setLanguage(getLanguage() === 'en' ? 'zh' : 'en');
    refreshLanguage();
  });

  function applyAnimationPath() {
    if (!lastResult) return;
    if ($('#animation-mode').value === 'custom' && customRotation) {
      animator.setSteps([{ axis: customRotation.axis, angle: customRotation.angle, label: 'Rn(θ)' }]);
      renderCustomSequence(customRotation);
    } else {
      animator.setAngles(lastResult);
      renderSequence(lastResult);
    }
    updateAnimatorState(animator);
  }

  function clearCustomAnimation() {
    const wasCustom = customRotation !== null;
    customRotation = null;
    $('#animation-mode').value = 'zyz';
    $('#animation-mode-group').hidden = true;
    if (wasCustom && lastResult) {
      animator.setAngles(lastResult);
      renderSequence(lastResult);
      updateAnimatorState(animator);
    }
  }

  let activeExpressionInput = $('#u00');
  document.querySelectorAll('.expression-input').forEach(input => input.addEventListener('focus', () => {
    activeExpressionInput = input;
    $('#assistant-target').textContent = t('editing', { field: input.dataset.inputLabel || input.id });
  }));
  document.querySelectorAll('.assistant-keys button').forEach(button => button.addEventListener('click', () => {
    const input = activeExpressionInput;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const selected = input.value.slice(start, end);
    let insertion = button.dataset.insert ?? '';
    let cursor = start + insertion.length;
    if (button.dataset.template === 'sqrt') {
      insertion = `√(${selected})`;
      cursor = selected ? start + insertion.length : start + 2;
    } else if (button.dataset.action === 'backspace') {
      const removeFrom = start === end ? Math.max(0, start - 1) : start;
      input.value = input.value.slice(0, removeFrom) + input.value.slice(end);
      input.focus(); input.setSelectionRange(removeFrom, removeFrom);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    input.value = input.value.slice(0, start) + insertion + input.value.slice(end);
    input.focus(); input.setSelectionRange(cursor, cursor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }));

  const presets = $('#preset-gates');
  Object.keys(PRESET_GATES).forEach(name => {
    const button = document.createElement('button'); button.className = 'preset-button'; button.textContent = name;
    button.addEventListener('click', () => { clearCustomAnimation(); fillMatrix(PRESET_GATES[name]); document.querySelectorAll('.preset-button').forEach(b => b.classList.toggle('active', b === button)); analyze(); });
    presets.append(button);
  });

  document.querySelectorAll('[data-rotation]').forEach(button => button.addEventListener('click', () => {
    try {
      const angle = parseReal($('#rotation-angle').value, 'rotationAngle');
      const gates = { Rx: rx, Ry: ry, Rz: rz };
      clearCustomAnimation();
      fillMatrix(gates[button.dataset.rotation](angle));
      document.querySelectorAll('.preset-button').forEach(b => b.classList.remove('active'));
      analyze();
    } catch (error) { showError(error.message); }
  }));

  $('#custom-axis-button').addEventListener('click', () => {
    try {
      const rawAxis = {
        x: parseReal($('#axis-x').value, 'axisX'),
        y: parseReal($('#axis-y').value, 'axisY'),
        z: parseReal($('#axis-z').value, 'axisZ')
      };
      const angle = parseReal($('#axis-angle').value, 'customAxisAngle');
      const length = Math.hypot(rawAxis.x, rawAxis.y, rawAxis.z);
      const gate = rotationAroundAxis(rawAxis.x, rawAxis.y, rawAxis.z, angle);
      customRotation = { axis: { x: rawAxis.x / length, y: rawAxis.y / length, z: rawAxis.z / length }, angle };
      fillMatrix(gate);
      document.querySelectorAll('.preset-button').forEach(b => b.classList.remove('active'));
      $('#animation-mode-group').hidden = false;
      $('#animation-mode').value = 'custom';
      analyze();
    } catch (error) { showError(error.message); }
  });

  function analyze(source = 'ui') {
    try {
      const values = matrixIds.map(id => parseComplex(document.getElementById(id).value));
      const U = matrix2(...values);
      const result = decomposeZYZ(U);
      $('#matrix-original').innerHTML = matrixMarkup(U);
      if (!result.success) {
        lastResult = null;
        analysisState = 'nonunitary';
        renderAnalysisStatus();
        showError(result.message);
        $('#angle-list').innerHTML = '';
        $('#matrix-reconstructed').textContent = '—';
        $('#reconstruction-error').textContent = '—';
        $('#circuit').innerHTML = `<span class="hint">${t('noCircuit')}</span>`;
        return result;
      }
      clearError();
      analysisState = 'unitary';
      lastResult = result;
      renderAnalysisStatus();
      renderAngles(result);
      $('#matrix-reconstructed').innerHTML = matrixMarkup(result.reconstructed);
      $('#reconstruction-error').textContent = result.error.toExponential(2).replace('e', ' × 10^');
      renderCircuit(result);
      applyAnimationPath();
      return result;
    } catch (error) {
      analysisState = 'invalid';
      renderAnalysisStatus();
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
        clearCustomAnimation();
        matrixIds.forEach(id => { document.getElementById(id).value = input[id]; });
        const result = analyze('tool');
        if (!result.success) return { unitary: false, message: result.message };
        return { unitary: true, verified: result.verified, delta: result.delta, alpha: result.alpha, beta: result.beta, gamma: result.gamma, error: result.error };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
  }

  $('#analyze-button').addEventListener('click', () => analyze());
  matrixIds.forEach(id => {
    document.getElementById(id).addEventListener('input', clearCustomAnimation);
    document.getElementById(id).addEventListener('keydown', event => { if (event.key === 'Enter') analyze(); });
  });
  ['axis-x', 'axis-y', 'axis-z', 'axis-angle'].forEach(id => document.getElementById(id).addEventListener('input', clearCustomAnimation));
  $('#animation-mode').addEventListener('change', applyAnimationPath);
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
