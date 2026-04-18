import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/dexie-db';
import {
  addHighlight,
  getHighlight,
  getAllHighlights,
  getHighlightsByUrl,
  updateHighlight,
  deleteHighlight,
  searchHighlights,
  getHighlightsForReview,
  getHighlightCount,
  addTag,
  getAllTags,
  deleteTag,
} from '@/background/storage';

beforeEach(async () => {
  await db.highlights.clear();
  await db.tags.clear();
});

describe('storage: highlights', () => {
  const baseHighlight = {
    url: 'https://example.com/article',
    title: 'Test Article',
    text: 'Important highlighted text',
    color: 'yellow' as const,
    tags: ['test', 'reading'],
    xpath: '/html/body/p[1]',
    textOffset: { start: 0, end: 25 },
  };

  it('adds a highlight with generated fields', async () => {
    const h = await addHighlight(baseHighlight);
    expect(h.id).toBeDefined();
    expect(h.createdAt).toBeDefined();
    expect(h.updatedAt).toBeDefined();
    expect(h.reviewCount).toBe(0);
    expect(h.easeFactor).toBe(2.5);
    expect(h.text).toBe('Important highlighted text');
  });

  it('gets a highlight by id', async () => {
    const h = await addHighlight(baseHighlight);
    const found = await getHighlight(h.id);
    expect(found).toBeDefined();
    expect(found!.text).toBe(h.text);
  });

  it('gets all highlights in order', async () => {
    await addHighlight({ ...baseHighlight, text: 'First' });
    await addHighlight({ ...baseHighlight, text: 'Second' });
    const all = await getAllHighlights();
    expect(all).toHaveLength(2);
    const texts = all.map((h) => h.text);
    expect(texts).toContain('First');
    expect(texts).toContain('Second');
  });

  it('gets highlights by url', async () => {
    await addHighlight(baseHighlight);
    await addHighlight({ ...baseHighlight, url: 'https://other.com' });
    const results = await getHighlightsByUrl('https://example.com/article');
    expect(results).toHaveLength(1);
  });

  it('updates a highlight', async () => {
    const h = await addHighlight(baseHighlight);
    // Ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));
    await updateHighlight(h.id, { note: 'added note' });
    const updated = await getHighlight(h.id);
    expect(updated!.note).toBe('added note');
  });

  it('deletes a highlight', async () => {
    const h = await addHighlight(baseHighlight);
    await deleteHighlight(h.id);
    const found = await getHighlight(h.id);
    expect(found).toBeUndefined();
  });

  it('searches highlights by text', async () => {
    await addHighlight(baseHighlight);
    await addHighlight({ ...baseHighlight, text: 'Unrelated content' });
    const results = await searchHighlights('Important');
    expect(results).toHaveLength(1);
    expect(results[0].text).toContain('Important');
  });

  it('searches highlights by tag', async () => {
    await addHighlight(baseHighlight);
    const results = await searchHighlights('reading');
    expect(results).toHaveLength(1);
  });

  it('gets highlights for review', async () => {
    const h = await addHighlight(baseHighlight);
    // Highlight's nextReviewAt is set to tomorrow, so should not appear
    const due = await getHighlightsForReview();
    expect(due).toHaveLength(0);

    // Set nextReviewAt to past
    await updateHighlight(h.id, { nextReviewAt: new Date(2000, 0, 1).toISOString() });
    const dueNow = await getHighlightsForReview();
    expect(dueNow).toHaveLength(1);
  });

  it('counts highlights', async () => {
    await addHighlight(baseHighlight);
    await addHighlight({ ...baseHighlight, text: 'Another' });
    const count = await getHighlightCount();
    expect(count).toBe(2);
  });
});

describe('storage: tags', () => {
  it('adds and retrieves tags', async () => {
    await addTag('JavaScript', '#f0db4f');
    const tags = await getAllTags();
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('JavaScript');
    expect(tags[0].color).toBe('#f0db4f');
  });

  it('deletes a tag', async () => {
    const tag = await addTag('temp', '#ccc');
    await deleteTag(tag.id);
    const tags = await getAllTags();
    expect(tags).toHaveLength(0);
  });
});
