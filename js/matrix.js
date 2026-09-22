import { Complex } from './complex.js';

const z = value => Complex.from(value);

export function matrix2(a, b, c, d) { return [[z(a), z(b)], [z(c), z(d)]]; }
export const identity2 = () => matrix2(1, 0, 0, 1);

export function multiply2(A, B) {
  return matrix2(
    A[0][0].mul(B[0][0]).add(A[0][1].mul(B[1][0])),
    A[0][0].mul(B[0][1]).add(A[0][1].mul(B[1][1])),
    A[1][0].mul(B[0][0]).add(A[1][1].mul(B[1][0])),
    A[1][0].mul(B[0][1]).add(A[1][1].mul(B[1][1]))
  );
}

export function dagger2(A) { return matrix2(A[0][0].conj(), A[1][0].conj(), A[0][1].conj(), A[1][1].conj()); }
export function determinant2(A) { return A[0][0].mul(A[1][1]).sub(A[0][1].mul(A[1][0])); }
export function subtract2(A, B) { return A.map((row, i) => row.map((value, j) => value.sub(B[i][j]))); }
export function scale2(scalar, A) { const s = z(scalar); return A.map(row => row.map(value => value.mul(s))); }
export function frobeniusNorm2(A) { return Math.sqrt(A.flat().reduce((sum, value) => sum + value.abs() ** 2, 0)); }
export function matrixDistance2(A, B) { return frobeniusNorm2(subtract2(A, B)); }
export function isUnitary2(U, tolerance = 1e-8) { return matrixDistance2(multiply2(dagger2(U), U), identity2()) <= tolerance; }
