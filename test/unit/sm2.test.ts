import { describe, it, expect } from 'vitest';
import { calculateSM2 } from '@/lib/sm2';

describe('SM-2 algorithm', () => {
  it('returns interval of 1 for first review', () => {
    const result = calculateSM2(5, 2.5, 1, 0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
    expect(result.nextReviewAt).toBeDefined();
  });

  it('returns interval of 6 for second review', () => {
    const result = calculateSM2(5, 2.5, 1, 1);
    expect(result.interval).toBe(6);
  });

  it('calculates interval based on ease factor for later reviews', () => {
    const result = calculateSM2(4, 2.5, 6, 2);
    expect(result.interval).toBe(15);
    // 6 * 2.5 = 15
  });

  it('resets interval on failed recall (quality < 3)', () => {
    const result = calculateSM2(2, 2.5, 15, 5);
    expect(result.interval).toBe(1);
  });

  it('decreases ease factor on poor recall', () => {
    const result = calculateSM2(1, 2.5, 6, 2);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('increases ease factor on perfect recall', () => {
    const result = calculateSM2(5, 2.5, 6, 2);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('never drops ease factor below 1.3', () => {
    const result = calculateSM2(0, 1.3, 1, 1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('clamps quality to 0-5 range', () => {
    const lowResult = calculateSM2(-1, 2.5, 1, 0);
    const highResult = calculateSM2(10, 2.5, 1, 0);
    expect(lowResult.interval).toBe(1);
    expect(highResult.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('sets nextReviewAt to a future date', () => {
    const result = calculateSM2(4, 2.5, 6, 2);
    const reviewDate = new Date(result.nextReviewAt);
    expect(reviewDate.getTime()).toBeGreaterThan(Date.now());
  });
});
