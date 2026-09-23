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

function normalizedAxis(axis) {
  const source = Array.isArray(axis) ? { x: axis[0], y: axis[1], z: axis[2] } : axis;
  const x = Number(source?.x), y = Number(source?.y), z = Number(source?.z);
  const length = Math.hypot(x, y, z);
  if (![x, y, z, length].every(Number.isFinite) || length < 1e-14) throw new Error('自定义旋转轴不能为零向量');
  return { x: x / length, y: y / length, z: z / length };
}

export function rotationAroundAxis(nx, ny, nz, theta) {
  const axis = normalizedAxis({ x: nx, y: ny, z: nz });
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  return matrix2(
    new Complex(c, -axis.z * s),
    new Complex(-axis.y * s, -axis.x * s),
    new Complex(axis.y * s, -axis.x * s),
    new Complex(c, axis.z * s)
  );
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
  const basis = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 }
  };
  if (typeof axis === 'string' && !basis[axis]) throw new Error(`Unknown rotation axis: ${axis}`);
  const n = normalizedAxis(typeof axis === 'string' ? basis[axis] : axis);
  const { x, y, z } = vector, c = Math.cos(angle), s = Math.sin(angle);
  const dot = n.x * x + n.y * y + n.z * z;
  const cross = {
    x: n.y * z - n.z * y,
    y: n.z * x - n.x * z,
    z: n.x * y - n.y * x
  };
  return {
    x: x * c + cross.x * s + n.x * dot * (1 - c),
    y: y * c + cross.y * s + n.y * dot * (1 - c),
    z: z * c + cross.z * s + n.z * dot * (1 - c)
  };
}
