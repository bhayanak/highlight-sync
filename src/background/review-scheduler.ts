import { getHighlightsForReview } from './storage';
import type { ReviewSession } from '@/shared/types';

export async function createReviewSession(): Promise<ReviewSession> {
  const highlights = await getHighlightsForReview();
  return {
    highlights,
    currentIndex: 0,
    completed: 0,
    remaining: highlights.length,
  };
}

export function setupReviewAlarm(): void {
  chrome.alarms.create('daily-review', {
    periodInMinutes: 60 * 24, // once daily
    delayInMinutes: 1,
  });
}

export function setupSyncAlarm(intervalMinutes: number): void {
  chrome.alarms.create('auto-sync', {
    periodInMinutes: intervalMinutes,
    delayInMinutes: intervalMinutes,
  });
}
