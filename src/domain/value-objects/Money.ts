export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string,
  ) {
    if (_amount < 0) throw new Error('Money amount cannot be negative');
    if (!_currency || _currency.length !== 3) throw new Error('Invalid currency code');
  }

  static of(amount: number, currency: string = 'USD'): Money {
    return new Money(Math.round(amount * 100) / 100, currency.toUpperCase());
  }

  static sum(moneys: Money[]): Money {
    if (moneys.length === 0) return Money.of(0);
    const currency = moneys[0]._currency;
    if (!moneys.every(m => m._currency === currency)) {
      throw new Error('Cannot sum Money of different currencies');
    }
    const total = moneys.reduce((acc, m) => acc + m._amount, 0);
    return Money.of(total, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this._amount - other._amount, this._currency);
  }

  multiply(factor: number): Money {
    return Money.of(this._amount * factor, this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount > other._amount;
  }

  get amount(): number { return this._amount; }
  get currency(): string { return this._currency; }

  toString(): string { return `${this._currency} ${this._amount.toFixed(2)}`; }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
    }
  }
}
