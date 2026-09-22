import { Complex } from './complex.js';
import { determinant2, isUnitary2, matrixDistance2, scale2 } from './matrix.js';
import { composeZYZ } from './quantum.js';

export const DEFAULT_TOLERANCE = 1e-8;
const SINGULAR_EPS = 1e-10;

export function normalizeAngle(angle) {
  let value = (angle + Math.PI) % (2 * Math.PI);
  if (value < 0) value += 2 * Math.PI;
  value -= Math.PI;
  return Math.abs(value) < 1e-14 ? 0 : value;
}

export function decomposeZYZ(U, tolerance = DEFAULT_TOLERANCE) {
  if (!isUnitary2(U, tolerance)) {
    return { success: false, reason: 'not-unitary', message: '该矩阵不是合法的单量子比特酉变换。' };
  }

  const det = determinant2(U);
  const delta = det.arg() / 2;
  const V = scale2(Complex.expi(-delta), U);
  const c = Math.min(1, Math.max(0, V[0][0].abs()));
  const s = Math.min(1, Math.max(0, V[1][0].abs()));
  const beta = 2 * Math.atan2(s, c);
  let alpha, gamma, singularity = null;

  if (s < SINGULAR_EPS) {
    // beta = 0: only alpha + gamma is determined. Choose alpha = 0.
    alpha = 0;
    gamma = -2 * V[0][0].arg();
    singularity = 'beta-zero';
  } else if (c < SINGULAR_EPS) {
    // beta = pi: only alpha - gamma is determined. Choose gamma = 0.
    alpha = 2 * V[1][0].arg();
    gamma = 0;
    singularity = 'beta-pi';
  } else {
    const p = V[0][0].arg();
    const q = V[1][0].arg();
    alpha = q - p;
    gamma = -p - q;
  }

  const angles = {
    delta: normalizeAngle(delta),
    alpha: normalizeAngle(alpha),
    beta,
    gamma: normalizeAngle(gamma)
  };
  const reconstructed = composeZYZ(angles);
  const error = matrixDistance2(U, reconstructed);

  // δ and all three Euler angles have equivalent branches. If principal-angle
  // normalization introduced the SU(2) sign flip, compensate with δ + π.
  if (error > tolerance) {
    angles.delta = normalizeAngle(angles.delta + Math.PI);
  }
  const finalReconstructed = composeZYZ(angles);
  const finalError = matrixDistance2(U, finalReconstructed);

  return {
    success: true,
    ...angles,
    singularity,
    reconstructed: finalReconstructed,
    error: finalError,
    verified: finalError <= tolerance
  };
}
