import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergeHighlights } from '@/background/sync-manager';
import type { Highlight } from '@/shared/types';

const makeHighlight = (overrides: Partial<Highlight> = {}): Highlight => ({
  id: '1',
  url: 'https://example.com',
  title: 'Test',
  text: 'highlighted text',
  color: 'yellow',
  tags: [],
  xpath: '/html/body/p[1]',
  textOffset: { start: 0, end: 16 },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  reviewCount: 0,
  nextReviewAt: '2026-01-02T00:00:00.000Z',
  easeFactor: 2.5,
  ...overrides,
});

describe('sync-manager: mergeHighlights', () => {
  it('merges local-only highlights', () => {
    const local = [makeHighlight({ id: 'a' })];
    const remote: Highlight[] = [];
    const merged = mergeHighlights(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('a');
  });

  it('merges remote-only highlights', () => {
    const local: Highlight[] = [];
    const remote = [makeHighlight({ id: 'b' })];
    const merged = mergeHighlights(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('b');
  });

  it('uses last-write-wins for conflicts', () => {
    const local = [
      makeHighlight({ id: 'c', note: 'local note', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ];
    const remote = [
      makeHighlight({ id: 'c', note: 'remote note', updatedAt: '2026-01-02T00:00:00.000Z' }),
    ];
    const merged = mergeHighlights(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].note).toBe('remote note');
  });

  it('keeps local version when it is newer', () => {
    const local = [
      makeHighlight({ id: 'd', note: 'local', updatedAt: '2026-01-05T00:00:00.000Z' }),
    ];
    const remote = [
      makeHighlight({ id: 'd', note: 'remote', updatedAt: '2026-01-02T00:00:00.000Z' }),
    ];
    const merged = mergeHighlights(local, remote);
    expect(merged[0].note).toBe('local');
  });

  it('combines highlights from both sources', () => {
    const local = [makeHighlight({ id: 'e' })];
    const remote = [makeHighlight({ id: 'f' })];
    const merged = mergeHighlights(local, remote);
    expect(merged).toHaveLength(2);
  });
});
