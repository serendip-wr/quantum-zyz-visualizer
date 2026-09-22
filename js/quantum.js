import { Complex } from './complex.js';
import { matrix2, multiply2, scale2 } from './matrix.js';

export function rz(theta) {
  return matrix2(Complex.expi(-theta / 2), 0, 0, Complex.expi(theta / 2));
}

export function ry(theta) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return matrix2(c, -s, s, c);
}

export function rx(theta) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return matrix2(c, new Complex(0, -s), new Complex(0, -s), c);
}

export function composeZYZ({ delta, alpha, beta, gamma }) {
  const special = multiply2(rz(alpha), multiply2(ry(beta), rz(gamma)));
  return scale2(Complex.expi(delta), special);
}

const h = 1 / Math.sqrt(2);
export const PRESET_GATES = {
  I: matrix2(1, 0, 0, 1),
  X: matrix2(0, 1, 1, 0),
  Y: matrix2(0, new Complex(0, -1), new Complex(0, 1), 0),
  Z: matrix2(1, 0, 0, -1),
  H: matrix2(h, h, h, -h),
  S: matrix2(1, 0, 0, new Complex(0, 1)),
  T: matrix2(1, 0, 0, Complex.expi(Math.PI / 4))
};

export function blochVectorFromAngles(theta, phi) {
  return { x: Math.sin(theta) * Math.cos(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(theta) };
}

export function rotateVector(vector, axis, angle) {
  const { x, y, z } = vector, c = Math.cos(angle), s = Math.sin(angle);
  if (axis === 'z') return { x: c * x - s * y, y: s * x + c * y, z };
  if (axis === 'y') return { x: c * x + s * z, y, z: -s * x + c * z };
  if (axis === 'x') return { x, y: c * y - s * z, z: s * y + c * z };
  throw new Error(`Unknown rotation axis: ${axis}`);
}
