import type { SM2Result } from '@/shared/types';
import { MIN_EASE_FACTOR } from '@/shared/constants';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * quality: 0-5 (user-rated recall quality)
 *   0 - Complete blackout
 *   1 - Incorrect, but remembered upon seeing answer
 *   2 - Incorrect, but answer seemed easy to recall
 *   3 - Correct with serious difficulty
 *   4 - Correct with some hesitation
 *   5 - Perfect recall
 */
export function calculateSM2(
  quality: number,
  previousEaseFactor: number,
  previousInterval: number,
  reviewCount: number,
): SM2Result {
  // Clamp quality to valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let easeFactor = previousEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  let interval: number;

  if (q < 3) {
    // Failed recall — reset interval
    interval = 1;
  } else if (reviewCount === 0) {
    interval = 1;
  } else if (reviewCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(previousInterval * easeFactor);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    nextReviewAt: nextReviewDate.toISOString(),
  };
}
