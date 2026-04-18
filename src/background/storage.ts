import { db } from '@/lib/dexie-db';
import type { Highlight, Tag } from '@/shared/types';
import { generateId, nowISO, daysFromNow } from '@/shared/utils';
import { DEFAULT_EASE_FACTOR, SM2_INITIAL_INTERVAL } from '@/shared/constants';

// --- Highlights ---

export async function addHighlight(
  data: Omit<
    Highlight,
    'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'nextReviewAt' | 'easeFactor'
  >,
): Promise<Highlight> {
  const now = nowISO();
  const highlight: Highlight = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    reviewCount: 0,
    nextReviewAt: daysFromNow(SM2_INITIAL_INTERVAL),
    easeFactor: DEFAULT_EASE_FACTOR,
  };
  await db.highlights.add(highlight);
  return highlight;
}

export async function getHighlight(id: string): Promise<Highlight | undefined> {
  return db.highlights.get(id);
}

export async function getAllHighlights(): Promise<Highlight[]> {
  return db.highlights.orderBy('createdAt').reverse().toArray();
}

export async function getHighlightsByUrl(url: string): Promise<Highlight[]> {
  return db.highlights.where('url').equals(url).toArray();
}

export async function updateHighlight(
  id: string,
  updates: Partial<Omit<Highlight, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.highlights.update(id, { ...updates, updatedAt: nowISO() });
}

export async function deleteHighlight(id: string): Promise<void> {
  await db.highlights.delete(id);
}

export async function searchHighlights(query: string): Promise<Highlight[]> {
  const lowerQuery = query.toLowerCase();
  return db.highlights
    .filter(
      (h) =>
        h.text.toLowerCase().includes(lowerQuery) ||
        h.title.toLowerCase().includes(lowerQuery) ||
        (h.note?.toLowerCase().includes(lowerQuery) ?? false) ||
        h.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
    )
    .toArray();
}

export async function getHighlightsForReview(): Promise<Highlight[]> {
  const now = new Date().toISOString();
  return db.highlights.where('nextReviewAt').belowOrEqual(now).toArray();
}

export async function getHighlightCount(): Promise<number> {
  return db.highlights.count();
}

// --- Tags ---

export async function addTag(name: string, color: string): Promise<Tag> {
  const tag: Tag = { id: generateId(), name, color, highlightCount: 0 };
  await db.tags.add(tag);
  return tag;
}

export async function getAllTags(): Promise<Tag[]> {
  return db.tags.toArray();
}

export async function deleteTag(id: string): Promise<void> {
  await db.tags.delete(id);
}

export async function updateTagCount(tagName: string): Promise<void> {
  const count = await db.highlights.where('tags').equals(tagName).count();
  await db.tags.where('name').equals(tagName).modify({ highlightCount: count });
}
