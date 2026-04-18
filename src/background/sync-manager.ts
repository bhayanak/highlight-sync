import type { SyncConfig, Highlight } from '@/shared/types';
import { getAllHighlights, updateHighlight } from './storage';
import {
  syncToGist,
  fetchFromGist,
  syncToSelfHosted,
  fetchFromSelfHosted,
} from '@/lib/gist-client';
import { nowISO } from '@/shared/utils';

export async function performSync(config: SyncConfig): Promise<string> {
  if (config.provider === 'none') return 'Sync disabled';

  const local = await getAllHighlights();

  switch (config.provider) {
    case 'gist': {
      const remote = await fetchFromGist(config);
      const merged = mergeHighlights(local, remote);
      const result = await syncToGist(merged, config);
      await applyMergedLocally(merged);
      return `Synced to Gist at ${result.syncedAt}`;
    }
    case 'self-hosted': {
      const remote = await fetchFromSelfHosted(config);
      const merged = mergeHighlights(local, remote);
      await syncToSelfHosted(merged, config);
      await applyMergedLocally(merged);
      return `Synced to self-hosted at ${nowISO()}`;
    }
    case 'local-file':
      return 'Local file sync — use export instead';
    default:
      return 'Unknown provider';
  }
}

/** Last-write-wins merge with field-level merge for non-conflicting fields */
export function mergeHighlights(local: Highlight[], remote: Highlight[]): Highlight[] {
  const map = new Map<string, Highlight>();

  for (const h of local) {
    map.set(h.id, h);
  }

  for (const h of remote) {
    const existing = map.get(h.id);
    if (!existing) {
      map.set(h.id, h);
    } else {
      // Last-write-wins by updatedAt
      if (new Date(h.updatedAt) > new Date(existing.updatedAt)) {
        map.set(h.id, { ...existing, ...h });
      }
    }
  }

  return Array.from(map.values());
}

async function applyMergedLocally(merged: Highlight[]): Promise<void> {
  const syncedAt = nowISO();
  for (const h of merged) {
    await updateHighlight(h.id, { ...h, syncedAt });
  }
}
