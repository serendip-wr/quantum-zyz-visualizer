const EPS = 1e-14;

export class Complex {
  constructor(re = 0, im = 0) { this.re = re; this.im = im; }
  add(z) { z = Complex.from(z); return new Complex(this.re + z.re, this.im + z.im); }
  sub(z) { z = Complex.from(z); return new Complex(this.re - z.re, this.im - z.im); }
  mul(z) { z = Complex.from(z); return new Complex(this.re * z.re - this.im * z.im, this.re * z.im + this.im * z.re); }
  div(z) {
    z = Complex.from(z); const d = z.re * z.re + z.im * z.im;
    if (d < EPS) throw new Error('Division by zero');
    return new Complex((this.re * z.re + this.im * z.im) / d, (this.im * z.re - this.re * z.im) / d);
  }
  conj() { return new Complex(this.re, -this.im); }
  abs() { return Math.hypot(this.re, this.im); }
  arg() { return Math.atan2(this.im, this.re); }
  neg() { return new Complex(-this.re, -this.im); }
  sqrt() {
    const r = this.abs();
    return new Complex(Math.sqrt(Math.max(0, (r + this.re) / 2)), Math.sign(this.im || 1) * Math.sqrt(Math.max(0, (r - this.re) / 2)));
  }
  equals(z, tolerance = 1e-10) { return this.sub(z).abs() <= tolerance; }
  static from(value) { return value instanceof Complex ? value : new Complex(Number(value), 0); }
  static expi(theta) { return new Complex(Math.cos(theta), Math.sin(theta)); }
}

class ExpressionParser {
  constructor(source) {
    this.source = String(source)
      .normalize('NFKC')
      .toLowerCase()
      .replaceAll('π', 'pi')
      .replace(/[−–—﹣]/g, '-')
      .replace(/\s+/g, '');
    this.pos = 0;
  }
  parse() {
    if (!this.source) throw new Error('表达式不能为空');
    const value = this.expression();
    if (this.pos !== this.source.length) throw new Error(`无法识别“${this.source.slice(this.pos)}”`);
    if (!Number.isFinite(value.re) || !Number.isFinite(value.im)) throw new Error('结果不是有限数值');
    return value;
  }
  peek() { return this.source[this.pos]; }
  eat(token) { if (this.source.startsWith(token, this.pos)) { this.pos += token.length; return true; } return false; }
  expression() {
    let value = this.term();
    while (true) {
      if (this.eat('+')) value = value.add(this.term());
      else if (this.eat('-')) value = value.sub(this.term());
      else return value;
    }
  }
  term() {
    let value = this.unary();
    while (true) {
      if (this.eat('*')) value = value.mul(this.unary());
      else if (this.eat('/')) value = value.div(this.unary());
      else if (this.startsPrimary()) value = value.mul(this.unary());
      else return value;
    }
  }
  unary() {
    if (this.eat('+')) return this.unary();
    if (this.eat('-')) return this.unary().neg();
    return this.primary();
  }
  startsPrimary() {
    const c = this.peek();
    return c === '(' || c === '.' || c === 'i' || /[0-9]/.test(c || '') || this.source.startsWith('pi', this.pos) || this.source.startsWith('sqrt', this.pos);
  }
  primary() {
    if (this.eat('(')) {
      const value = this.expression();
      if (!this.eat(')')) throw new Error('缺少右括号');
      return value;
    }
    if (this.eat('sqrt')) {
      if (!this.eat('(')) throw new Error('sqrt 后需要括号');
      const value = this.expression();
      if (!this.eat(')')) throw new Error('缺少右括号');
      return value.sqrt();
    }
    if (this.eat('pi')) return new Complex(Math.PI, 0);
    if (this.eat('i')) return new Complex(0, 1);
    const match = this.source.slice(this.pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);
    if (!match) throw new Error(`应为数字，位置 ${this.pos + 1}`);
    this.pos += match[0].length;
    return new Complex(Number(match[0]), 0);
  }
}

export function parseComplex(source) { return new ExpressionParser(String(source)).parse(); }

export function formatComplex(z, digits = 6) {
  const clean = n => Math.abs(n) < 10 ** (-digits) ? 0 : n;
  const re = clean(z.re), im = clean(z.im);
  const number = n => Number(n.toFixed(digits)).toString();
  if (im === 0) return number(re);
  if (re === 0) return `${im === -1 ? '-' : im === 1 ? '' : number(im)}i`;
  return `${number(re)} ${im < 0 ? '-' : '+'} ${Math.abs(im) === 1 ? '' : number(Math.abs(im))}i`;
}
