import { rotateVector } from './quantum.js';

const COLORS = { x: '#ff7b88', y: '#43dfd0', z: '#b7f34b' };

export class BlochRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.yaw = -0.65;
    this.pitch = 0.36;
    this.zoom = 1;
    this.vector = { x: 0, y: 0, z: 1 };
    this.trajectory = [];
    this.activeAxis = null;
    this.drag = null;
    this.bindInteractions();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
    this.draw();
  }

  bindInteractions() {
    this.canvas.addEventListener('pointerdown', event => {
      this.drag = { x: event.clientX, y: event.clientY, yaw: this.yaw, pitch: this.pitch };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (!this.drag) return;
      this.yaw = this.drag.yaw + (event.clientX - this.drag.x) * 0.009;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.drag.pitch + (event.clientY - this.drag.y) * 0.009));
      this.draw();
    });
    const release = () => { this.drag = null; };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
    this.canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.zoom = Math.max(.72, Math.min(1.35, this.zoom * Math.exp(-event.deltaY * .001)));
      this.draw();
    }, { passive: false });
    this.canvas.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') this.yaw -= .1;
      else if (event.key === 'ArrowRight') this.yaw += .1;
      else if (event.key === 'ArrowUp') this.pitch = Math.max(-1.35, this.pitch - .1);
      else if (event.key === 'ArrowDown') this.pitch = Math.min(1.35, this.pitch + .1);
      else return;
      event.preventDefault(); this.draw();
    });
  }

  setScene(vector, trajectory = [], activeAxis = null) {
    this.vector = vector;
    this.trajectory = trajectory;
    this.activeAxis = activeAxis;
    this.draw();
  }

  view(point) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x1 = cy * point.x - sy * point.y;
    const y1 = sy * point.x + cy * point.y;
    return { x: x1, y: cp * y1 - sp * point.z, z: sp * y1 + cp * point.z };
  }

  project(point) {
    const p = this.view(point);
    const radius = Math.min(this.width, this.height) * .34 * this.zoom;
    return { x: this.width / 2 + p.x * radius, y: this.height / 2 - p.z * radius, depth: p.y, radius };
  }

  path(points, stroke, width = 1, alpha = 1) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save(); ctx.beginPath();
    points.forEach((point, i) => { const p = this.project(point); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.stroke(); ctx.restore();
  }

  drawGrid() {
    const circle = (maker, alpha = .23) => {
      const front = [], back = [];
      for (let i = 0; i <= 96; i += 1) {
        const p = maker(i / 96 * Math.PI * 2);
        (this.view(p).y >= 0 ? front : back).push(p);
      }
      this.path(back, '#315267', .75, alpha * .45);
      this.path(front, '#3d687c', .85, alpha);
    };
    for (const z of [-.5, 0, .5]) {
      const r = Math.sqrt(1 - z * z);
      circle(t => ({ x: r * Math.cos(t), y: r * Math.sin(t), z }), z === 0 ? .38 : .2);
    }
    for (const phi of [0, Math.PI / 3, 2 * Math.PI / 3]) {
      circle(t => ({ x: Math.sin(t) * Math.cos(phi), y: Math.sin(t) * Math.sin(phi), z: Math.cos(t) }), .18);
    }
  }

  drawAxis(axis) {
    const unit = axis === 'x' ? { x: 1, y: 0, z: 0 } : axis === 'y' ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 };
    const start = Object.fromEntries(Object.entries(unit).map(([k, v]) => [k, -v * 1.24]));
    const end = Object.fromEntries(Object.entries(unit).map(([k, v]) => [k, v * 1.24]));
    const active = this.activeAxis === axis;
    this.path([start, end], active ? COLORS[axis] : '#5c7888', active ? 2.4 : 1, active ? .95 : .65);
    const p = this.project(end), ctx = this.ctx;
    ctx.save(); ctx.fillStyle = active ? COLORS[axis] : '#8da3af'; ctx.font = '700 12px Cascadia Code, monospace'; ctx.fillText(axis.toUpperCase(), p.x + 7, p.y - 6); ctx.restore();
    if (axis === 'z') {
      const top = this.project({ x: 0, y: 0, z: 1 }), bottom = this.project({ x: 0, y: 0, z: -1 });
      ctx.save(); ctx.fillStyle = '#d8e6e9'; ctx.font = 'italic 14px Georgia, serif';
      ctx.fillText('|0⟩', top.x + 8, top.y - 8); ctx.fillText('|1⟩', bottom.x + 8, bottom.y + 17); ctx.restore();
    }
  }

  drawArrow(vector) {
    const origin = this.project({ x: 0, y: 0, z: 0 }), end = this.project(vector);
    const ctx = this.ctx, angle = Math.atan2(end.y - origin.y, end.x - origin.x);
    ctx.save(); ctx.strokeStyle = '#f4fbfc'; ctx.fillStyle = '#f4fbfc'; ctx.lineWidth = 3;
    ctx.shadowColor = '#43dfd0'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - 14 * Math.cos(angle - .42), end.y - 14 * Math.sin(angle - .42));
    ctx.lineTo(end.x - 14 * Math.cos(angle + .42), end.y - 14 * Math.sin(angle + .42)); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#43dfd0'; ctx.beginPath(); ctx.arc(end.x, end.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  draw() {
    if (!this.width || !this.height) return;
    const ctx = this.ctx, center = this.project({ x: 0, y: 0, z: 0 }), r = center.radius;
    ctx.clearRect(0, 0, this.width, this.height);
    const gradient = ctx.createRadialGradient(center.x - r * .35, center.y - r * .4, r * .05, center.x, center.y, r);
    gradient.addColorStop(0, 'rgba(63, 146, 158, .16)'); gradient.addColorStop(.72, 'rgba(20, 62, 78, .08)'); gradient.addColorStop(1, 'rgba(6, 17, 29, .02)');
    ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
    ctx.strokeStyle = '#31596b'; ctx.lineWidth = 1.2; ctx.stroke();
    this.drawGrid();
    ['x', 'y', 'z'].forEach(axis => this.drawAxis(axis));
    if (this.trajectory.length > 1) this.path(this.trajectory, this.activeAxis ? COLORS[this.activeAxis] : '#43dfd0', 2.2, .9);
    this.drawArrow(this.vector);
  }
}

export class RotationAnimator {
  constructor(renderer, onUpdate) {
    this.renderer = renderer;
    this.onUpdate = onUpdate;
    this.initial = { x: 0, y: 0, z: 1 };
    this.steps = [];
    this.step = 0;
    this.progress = 0;
    this.playing = false;
    this.frame = null;
  }

  setInitial(vector) { this.initial = vector; this.reset(); }
  setAngles({ gamma, beta, alpha }) {
    this.steps = [
      { axis: 'z', angle: gamma, label: 'Rz(γ)' },
      { axis: 'y', angle: beta, label: 'Ry(β)' },
      { axis: 'z', angle: alpha, label: 'Rz(α)' }
    ];
    this.reset();
  }
  pause() { this.playing = false; cancelAnimationFrame(this.frame); this.render(); }
  reset() { this.pause(); this.step = 0; this.progress = 0; this.render(); }
  previous() {
    this.pause();
    if (this.progress > .05) this.progress = 0;
    else this.step = Math.max(0, this.step - 1);
    this.render();
  }
  next() {
    this.pause();
    if (this.step < this.steps.length) this.step += 1;
    this.progress = 0; this.render();
  }
  toggle() {
    if (this.playing) return this.pause();
    if (this.step >= this.steps.length) this.reset();
    this.playing = true; this.started = performance.now() - this.progress * this.duration();
    this.tick();
  }
  duration() { return this.steps[this.step] ? Math.max(700, Math.min(1800, 650 + Math.abs(this.steps[this.step].angle) * 280)) : 700; }
  tick = now => {
    if (!this.playing) return;
    const time = now ?? performance.now();
    this.progress = Math.min(1, (time - this.started) / this.duration());
    this.render();
    if (this.progress >= 1) {
      this.step += 1; this.progress = 0;
      if (this.step >= this.steps.length) return this.pause();
      this.started = time;
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  state() {
    let vector = { ...this.initial };
    const trajectory = [{ ...vector }];
    this.steps.forEach((operation, index) => {
      const fraction = index < this.step ? 1 : index === this.step ? this.progress : 0;
      if (fraction <= 0) return;
      const samples = Math.max(2, Math.ceil(24 * fraction));
      const start = { ...vector };
      for (let i = 1; i <= samples; i += 1) trajectory.push(rotateVector(start, operation.axis, operation.angle * fraction * i / samples));
      vector = rotateVector(start, operation.axis, operation.angle * fraction);
    });
    return { vector, trajectory, active: this.step < this.steps.length ? this.steps[this.step] : null };
  }
  render() {
    if (!this.steps.length) return this.renderer.setScene(this.initial, [this.initial], null);
    const state = this.state();
    this.renderer.setScene(state.vector, state.trajectory, state.active?.axis ?? null);
    this.onUpdate?.({ ...state, step: this.step, progress: this.progress, playing: this.playing });
  }
}
