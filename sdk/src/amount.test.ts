import { describe, expect, it } from 'vitest';
import { AmountUtils } from './types';

describe('AmountUtils', () => {
  describe('toStroops', () => {
    it('converts whole XLM', () => {
      expect(AmountUtils.toStroops('10')).toBe('100000000');
    });

    it('converts decimal XLM with full precision', () => {
      expect(AmountUtils.toStroops('1.5')).toBe('15000000');
      expect(AmountUtils.toStroops('0.0000001')).toBe('1');
    });

    it('truncates beyond 7 decimal places', () => {
      expect(AmountUtils.toStroops('1.123456789')).toBe('11234567');
    });

    it('accepts number input', () => {
      expect(AmountUtils.toStroops(2)).toBe('20000000');
    });
  });

  describe('fromStroops', () => {
    it('converts stroops to whole XLM', () => {
      expect(AmountUtils.fromStroops('100000000')).toBe('10');
    });

    it('converts stroops to fractional XLM', () => {
      expect(AmountUtils.fromStroops('15000000')).toBe('1.5');
      expect(AmountUtils.fromStroops('1')).toBe('0.0000001');
    });

    it('round-trips through toStroops', () => {
      const xlm = '1234.5678901';
      expect(AmountUtils.fromStroops(AmountUtils.toStroops(xlm))).toBe(xlm);
    });
  });
});
