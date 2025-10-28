import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPhone, formatCPF, formatCEP } from '../formatting';

describe('formatting utils', () => {
  describe('formatCurrency', () => {
    it('should format number to BRL currency', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(10.5)).toBe('R$ 10,50');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-R$ 100,00');
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit phone numbers', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should format 10-digit phone numbers', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should return original if invalid', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone('')).toBe('');
    });
  });

  describe('formatCPF', () => {
    it('should format valid CPF', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00');
    });

    it('should return original if invalid length', () => {
      expect(formatCPF('123')).toBe('123');
    });
  });

  describe('formatCEP', () => {
    it('should format valid CEP', () => {
      expect(formatCEP('01310100')).toBe('01310-100');
    });

    it('should return original if invalid length', () => {
      expect(formatCEP('123')).toBe('123');
    });
  });
});
