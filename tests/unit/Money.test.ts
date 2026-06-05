import { Money } from '../../src/domain/value-objects/Money';

describe('Money', () => {
  describe('creation', () => {
    it('creates valid money', () => {
      const m = Money.of(10.5, 'USD');
      expect(m.amount).toBe(10.5);
      expect(m.currency).toBe('USD');
    });

    it('throws on negative amount', () => {
      expect(() => Money.of(-1, 'USD')).toThrow('cannot be negative');
    });

    it('throws on invalid currency', () => {
      expect(() => Money.of(10, 'US')).toThrow('Invalid currency');
      expect(() => Money.of(10, '')).toThrow('Invalid currency');
    });

    it('uppercases currency', () => {
      expect(Money.of(10, 'usd').currency).toBe('USD');
    });
  });

  describe('arithmetic', () => {
    it('adds two Money values', () => {
      const a = Money.of(10, 'USD');
      const b = Money.of(5, 'USD');
      expect(a.add(b).amount).toBe(15);
    });

    it('subtracts Money values', () => {
      const a = Money.of(10, 'USD');
      const b = Money.of(3, 'USD');
      expect(a.subtract(b).amount).toBe(7);
    });

    it('multiplies by factor', () => {
      expect(Money.of(5, 'USD').multiply(3).amount).toBe(15);
    });

    it('throws on currency mismatch', () => {
      const usd = Money.of(10, 'USD');
      const eur = Money.of(10, 'EUR');
      expect(() => usd.add(eur)).toThrow('Currency mismatch');
    });
  });

  describe('sum', () => {
    it('sums array of Money', () => {
      const moneys = [Money.of(1, 'USD'), Money.of(2, 'USD'), Money.of(3, 'USD')];
      expect(Money.sum(moneys).amount).toBe(6);
    });

    it('returns zero for empty array', () => {
      expect(Money.sum([]).amount).toBe(0);
    });
  });

  describe('comparison', () => {
    it('compares equality', () => {
      expect(Money.of(10, 'USD').equals(Money.of(10, 'USD'))).toBe(true);
      expect(Money.of(10, 'USD').equals(Money.of(11, 'USD'))).toBe(false);
    });

    it('compares greater than', () => {
      expect(Money.of(10, 'USD').isGreaterThan(Money.of(5, 'USD'))).toBe(true);
      expect(Money.of(5, 'USD').isGreaterThan(Money.of(10, 'USD'))).toBe(false);
    });
  });
});
