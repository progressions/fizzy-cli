import { describe, it, expect } from 'vitest';
import { formatDate, truncate } from '../src/lib/output.js';

describe('output utilities', () => {
  describe('formatDate', () => {
    it('should return dash for null/undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    it('should format valid date string', () => {
      const result = formatDate('2025-01-15T10:30:00Z');
      expect(result).toContain('2025');
    });
  });

  describe('truncate', () => {
    it('should return dash for null/undefined', () => {
      expect(truncate(null)).toBe('-');
      expect(truncate(undefined)).toBe('-');
      expect(truncate('')).toBe('-');
    });

    it('should not truncate short strings', () => {
      expect(truncate('hello', 50)).toBe('hello');
      expect(truncate('short', 10)).toBe('short');
    });

    it('should truncate long strings with ellipsis', () => {
      const long = 'This is a very long string that should be truncated';
      const result = truncate(long, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should use default length of 50', () => {
      const str = 'a'.repeat(60);
      const result = truncate(str);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });
  });
});
