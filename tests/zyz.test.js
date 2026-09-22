import assert from 'node:assert/strict';
import { Complex, parseComplex } from '../js/complex.js';
import { determinant2, identity2, isUnitary2, matrixDistance2, multiply2, scale2 } from '../js/matrix.js';
import { PRESET_GATES, composeZYZ, rx, ry, rz } from '../js/quantum.js';
import { decomposeZYZ } from '../js/zyz.js';

const TOL = 1e-8;
let passed = 0;

assert.ok(parseComplex('i').equals(new Complex(0, 1)));
assert.ok(parseComplex('-i').equals(new Complex(0, -1)));
assert.ok(parseComplex('0.5+0.5i').equals(new Complex(.5, .5)));
assert.ok(parseComplex('0.70710678i').equals(new Complex(0, .70710678)));
assert.ok(Math.abs(parseComplex('1/sqrt(2)').re - 1 / Math.sqrt(2)) < 1e-12);
assert.ok(matrixDistance2(multiply2(PRESET_GATES.X, PRESET_GATES.X), identity2()) < TOL);
assert.ok(determinant2(PRESET_GATES.S).equals(new Complex(0, 1), TOL));

function verify(name, U) {
  assert.ok(isUnitary2(U, TOL), `${name} should be unitary`);
  const result = decomposeZYZ(U, TOL);
  assert.ok(result.success, `${name} decomposition should succeed`);
  assert.ok(result.verified, `${name} reconstruction should verify; error=${result.error}`);
  assert.ok(matrixDistance2(U, result.reconstructed) < TOL, `${name} error should be below tolerance`);
  passed += 1;
}

for (const [name, gate] of Object.entries(PRESET_GATES)) verify(name, gate);
verify('Rx(pi/3)', rx(Math.PI / 3));
verify('Ry(pi/4)', ry(Math.PI / 4));
verify('Rz(pi/5)', rz(Math.PI / 5));

verify('beta exactly 0', composeZYZ({ delta: 0.37, alpha: 1.2, beta: 0, gamma: -0.45 }));
verify('beta near 0', composeZYZ({ delta: -0.2, alpha: -2.4, beta: 1e-12, gamma: 0.7 }));
verify('beta exactly pi', composeZYZ({ delta: 0.9, alpha: 1.1, beta: Math.PI, gamma: -2.0 }));
verify('beta near pi', composeZYZ({ delta: -1.1, alpha: -0.4, beta: Math.PI - 1e-12, gamma: 2.2 }));

let seed = 0x5eed1234;
function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; }
for (let i = 0; i < 100; i += 1) {
  const angles = {
    delta: (random() * 2 - 1) * Math.PI,
    alpha: (random() * 2 - 1) * Math.PI,
    beta: random() * Math.PI,
    gamma: (random() * 2 - 1) * Math.PI
  };
  verify(`random U(2) ${i + 1}`, composeZYZ(angles));
}

const nonUnitary = scale2(new Complex(2, 0), PRESET_GATES.I);
assert.equal(decomposeZYZ(nonUnitary).success, false, 'non-unitary matrix must be rejected');

console.log(`✓ ${passed} unitary matrices decomposed and reconstructed within ${TOL}`);
