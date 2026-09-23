const translations = {
  en: {
    pageTitle: 'Single-Qubit ZYZ Decomposition Visualizer', workbenchEyebrow: 'QUANTUM WORKBENCH · 01',
    headerTitle: 'Single-Qubit <span>ZYZ</span> Visualizer', workbenchAria: 'ZYZ decomposition workbench',
    matrixEditorAria: '2 by 2 complex matrix', presetGatesAria: 'Preset quantum gates', blochCanvasAria: 'Interactive Bloch sphere',
    pageDescription: 'Analyze any single-qubit unitary matrix and visualize its ZYZ decomposition.',
    matrixInput: 'Matrix input', inputHint: 'Enter complex numbers or expressions, such as <code>0.5+0.5i</code>, <code>-i</code>, <code>π/2</code>, or <code>1/√(2)</code>.',
    inputHelper: 'Math input helper', editing: 'Editing: {field}', backspace: 'Delete previous character', presetGates: 'PRESET GATES',
    rotationAngle: 'Rotation angle θ', axisX: 'Axis nₓ', axisY: 'Axis nᵧ', axisZ: 'Axis n_z', customAxisAngle: 'Custom-axis angle θ',
    customAxisTitle: 'CUSTOM AXIS ROTATION', axisNormalize: 'Axis vector is normalized automatically', generateRn: 'Generate R<sub>n</sub>',
    analyze: 'Analyze decomposition', decomposition: 'Decomposition', frobeniusError: 'FROBENIUS ERROR',
    inputMatrix: 'INPUT · U', reconstructedMatrix: 'RECONSTRUCTED · Ũ', quantumCircuit: 'Quantum circuit',
    circuitHint: 'Gates appear in the order applied to the state', blochSphere: 'Bloch sphere',
    canvasHelp: 'Drag to rotate · Scroll to zoom', rotationSequence: 'Rotation sequence', animationPath: 'ANIMATION PATH',
    zyzPath: 'ZYZ decomposition', customPath: 'Direct custom-axis rotation', initialState: 'INITIAL STATE', customState: 'Custom θ, φ',
    previousStep: 'Previous step', nextStep: 'Next step', play: 'Play animation', pause: 'Pause animation', reset: 'Reset',
    phaseNote: 'Global phase does not change the physical state on the Bloch sphere.',
    mathNotes: 'MATHEMATICAL NOTES', whyWorks: 'Why the decomposition works',
    unitarityTitle: 'Unitarity', unitarityText: 'Quantum evolution preserves inner products and total probability, so a single-qubit gate obeys U†U = I. These 2×2 complex matrices form U(2).',
    su2Title: 'U(2) → SU(2)', su2Text: 'Because det(U)=e<sup>i2δ</sup>, removing e<sup>iδ</sup> gives V=e<sup>−iδ</sup>U with determinant 1. The phase has multiple valid branches, checked by reconstruction.',
    eulerTitle: 'ZYZ Euler angles', eulerText: 'Every SU(2) matrix can be written as R<sub>z</sub>(α)R<sub>y</sub>(β)R<sub>z</sub>(γ). At β=0 or π the angles are not unique; the tool fixes one redundant angle.',
    orderTitle: 'Right to left', orderText: 'The rightmost matrix acts first, so the circuit runs R<sub>z</sub>(γ) → R<sub>y</sub>(β) → R<sub>z</sub>(α). Global phase changes neither probabilities nor Bloch vectors.',
    footerName: 'Single-Qubit ZYZ Decomposition Visualizer', footerTag: 'Pure mathematics · Pure frontend',
    waiting: 'Awaiting analysis', unitaryYes: 'Unitary: Yes', unitaryNo: 'Unitary: No', invalidInput: 'Invalid input',
    notVerified: 'Not verified', verified: 'Verification passed', failed: 'Verification failed', stopped: 'Decomposition stopped',
    betaZero: 'β≈0', betaPi: 'β≈π', noCircuit: 'Only unitary matrices can produce a quantum circuit.',
    globalPhase: 'GLOBAL PHASE', finalZ: 'FINAL Z ROTATION', yRotation: 'Y ROTATION', firstZ: 'FIRST Z ROTATION',
    initialOperation: 'Initial state', finalOperation: 'Final state', notUnitary: 'This matrix is not a valid single-qubit unitary transformation.',
    realRequired: '{field} must be a real number.', zeroAxis: 'The custom rotation axis cannot be the zero vector.',
    emptyExpression: 'Expression cannot be empty.', unrecognized: 'Cannot recognize “{detail}”.', nonFinite: 'The result is not a finite number.',
    missingRightParen: 'Missing closing parenthesis.', sqrtParen: 'sqrt requires parentheses.', expectedNumber: 'Expected a number at position {detail}.',
    divisionZero: 'Division by zero.', unknownError: 'Invalid expression.', languageAction: 'Switch interface to Chinese'
  },
  zh: {
    pageTitle: '单量子比特 ZYZ 分解可视化工具', workbenchEyebrow: '量子计算工作台 · 01',
    headerTitle: '单量子比特 <span>ZYZ</span> 可视化', workbenchAria: 'ZYZ 分解工作台',
    matrixEditorAria: '二阶复数矩阵', presetGatesAria: '预设量子门', blochCanvasAria: '交互式布洛赫球',
    pageDescription: '输入任意单量子比特酉矩阵，验证并可视化其 ZYZ 欧拉角分解。',
    matrixInput: '矩阵输入', inputHint: '输入复数或数学表达式，例如 <code>0.5+0.5i</code>、<code>-i</code>、<code>π/2</code> 或 <code>1/√(2)</code>。',
    inputHelper: '数学输入助手', editing: '当前：{field}', backspace: '删除前一个字符', presetGates: '预设量子门',
    rotationAngle: '旋转角 θ', axisX: '轴 nₓ', axisY: '轴 nᵧ', axisZ: '轴 n_z', customAxisAngle: '自定义轴角度 θ',
    customAxisTitle: '自定义轴旋转', axisNormalize: '轴向量会自动归一化', generateRn: '生成 R<sub>n</sub>',
    analyze: '分析分解结果', decomposition: '分解结果', frobeniusError: '重构误差 · F 范数',
    inputMatrix: '输入矩阵 · U', reconstructedMatrix: '重构矩阵 · Ũ', quantumCircuit: '量子线路',
    circuitHint: '量子门按实际作用顺序排列', blochSphere: '布洛赫球',
    canvasHelp: '拖动旋转 · 滚轮缩放', rotationSequence: '旋转序列', animationPath: '动画路径',
    zyzPath: 'ZYZ 分解路径', customPath: '直接绕自定义轴', initialState: '初始量子态', customState: '自定义 θ、φ',
    previousStep: '上一步', nextStep: '下一步', play: '播放动画', pause: '暂停动画', reset: '重置',
    phaseNote: '全局相位不会改变布洛赫球上的物理状态。',
    mathNotes: '数学说明', whyWorks: '分解为何成立',
    unitarityTitle: '酉性', unitarityText: '量子演化必须保持内积与总概率，因此单量子比特门满足 U†U = I。满足条件的 2×2 复矩阵构成 U(2)。',
    su2Title: 'U(2) → SU(2)', su2Text: 'det(U)=e<sup>i2δ</sup>。提取 e<sup>iδ</sup> 后，V=e<sup>−iδ</sup>U 的行列式为 1，属于 SU(2)。δ 有分支歧义，但可由重构验证。',
    eulerTitle: 'ZYZ 欧拉角', eulerText: '任意 SU(2) 元素都可写成 R<sub>z</sub>(α)R<sub>y</sub>(β)R<sub>z</sub>(γ)。在 β=0 或 π 时角度不唯一，工具会固定一个冗余角。',
    orderTitle: '从右向左', orderText: '矩阵最右侧先作用，所以线路顺序是 R<sub>z</sub>(γ) → R<sub>y</sub>(β) → R<sub>z</sub>(α)。全局相位不改变测量概率，也不旋转布洛赫向量。',
    footerName: '单量子比特 ZYZ 分解可视化工具', footerTag: '纯数学 · 纯前端',
    waiting: '等待分析', unitaryYes: '酉矩阵：是', unitaryNo: '酉矩阵：否', invalidInput: '输入无效',
    notVerified: '尚未验证', verified: '验证通过', failed: '验证失败', stopped: '分解已停止',
    betaZero: 'β≈0', betaPi: 'β≈π', noCircuit: '仅酉矩阵可以生成量子线路。',
    globalPhase: '全局相位', finalZ: '最后一次 Z 旋转', yRotation: 'Y 旋转', firstZ: '第一次 Z 旋转',
    initialOperation: '初始状态', finalOperation: '最终状态', notUnitary: '该矩阵不是合法的单量子比特酉变换。',
    realRequired: '{field}必须是实数。', zeroAxis: '自定义旋转轴不能为零向量。',
    emptyExpression: '表达式不能为空。', unrecognized: '无法识别“{detail}”。', nonFinite: '结果不是有限数值。',
    missingRightParen: '缺少右括号。', sqrtParen: 'sqrt 后需要括号。', expectedNumber: '第 {detail} 位应为数字。',
    divisionZero: '不能除以零。', unknownError: '表达式无效。', languageAction: '切换界面为英文'
  }
};

let language = 'en';
try { if (localStorage.getItem('zyz-language') === 'zh') language = 'zh'; } catch { /* Storage may be unavailable. */ }

export function getLanguage() { return language; }
export function t(key, values = {}) {
  const template = translations[language][key] ?? translations.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
export function setLanguage(value) {
  language = value === 'zh' ? 'zh' : 'en';
  try { localStorage.setItem('zyz-language', language); } catch { /* Keep current-page preference. */ }
  applyLanguage();
}
export function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]').content = t('pageDescription');
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(element => { element.innerHTML = t(element.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
  document.querySelectorAll('[data-input-label-key]').forEach(element => { element.dataset.inputLabel = t(element.dataset.inputLabelKey); });
  const toggle = document.querySelector('#language-toggle');
  toggle.textContent = language === 'en' ? '中文' : 'English';
  toggle.setAttribute('aria-label', t('languageAction'));
}

export function localizeError(message) {
  const raw = String(message ?? '');
  if (/不是合法的单量子比特酉变换/.test(raw)) return t('notUnitary');
  if (/自定义旋转轴不能为零向量/.test(raw)) return t('zeroAxis');
  if (/表达式不能为空/.test(raw)) return t('emptyExpression');
  if (/结果不是有限数值/.test(raw)) return t('nonFinite');
  if (/Division by zero/.test(raw)) return t('divisionZero');
  if (/缺少右括号/.test(raw)) return t('missingRightParen');
  if (/sqrt 后需要括号/.test(raw)) return t('sqrtParen');
  const tail = raw.match(/^无法识别“(.+)”$/);
  if (tail) return t('unrecognized', { detail: tail[1] });
  const expected = raw.match(/^应为数字，位置 (\d+)$/);
  if (expected) return t('expectedNumber', { detail: expected[1] });
  const real = raw.match(/^(.+)必须是实数$/);
  if (real) return t('realRequired', { field: t(real[1]) });
  return raw || t('unknownError');
}
