import { describe, it, expect } from 'vitest';
import { validateEmail, validatePhone, validateCPF, validateCEP } from '../validation';

describe('validation utils', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('11987654321')).toBe(true);
      expect(validatePhone('(11) 98765-4321')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('should validate correct CPF format', () => {
      // Basic format validation only
      expect(validateCPF('123.456.789-00')).toBe(true);
      expect(validateCPF('12345678900')).toBe(true);
    });

    it('should reject invalid CPF format', () => {
      expect(validateCPF('123')).toBe(false);
      expect(validateCPF('abc')).toBe(false);
      expect(validateCPF('')).toBe(false);
    });
  });

  describe('validateCEP', () => {
    it('should validate correct CEP format', () => {
      expect(validateCEP('01310-100')).toBe(true);
      expect(validateCEP('01310100')).toBe(true);
    });

    it('should reject invalid CEP format', () => {
      expect(validateCEP('123')).toBe(false);
      expect(validateCEP('abc')).toBe(false);
      expect(validateCEP('')).toBe(false);
    });
  });
});
