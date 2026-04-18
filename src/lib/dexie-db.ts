import Dexie, { type EntityTable } from 'dexie';
import type { Highlight, Tag } from '@/shared/types';
import { DB_NAME, DB_VERSION } from '@/shared/constants';

export class HighlightSyncDB extends Dexie {
  highlights!: EntityTable<Highlight, 'id'>;
  tags!: EntityTable<Tag, 'id'>;

  constructor() {
    super(DB_NAME, { autoOpen: true });

    this.version(DB_VERSION).stores({
      highlights: 'id, url, createdAt, updatedAt, nextReviewAt, *tags, color',
      tags: 'id, &name',
    });
  }
}

export const db = new HighlightSyncDB();
