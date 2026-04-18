export interface Highlight {
  id: string;
  url: string;
  title: string;
  text: string;
  html?: string;
  note?: string;
  color: HighlightColor;
  tags: string[];
  xpath: string;
  textOffset: { start: number; end: number };
  createdAt: string;
  updatedAt: string;
  reviewCount: number;
  nextReviewAt: string;
  easeFactor: number;
  syncedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  highlightCount: number;
}

export interface SyncConfig {
  provider: 'none' | 'gist' | 'self-hosted' | 'local-file';
  gistToken?: string;
  gistId?: string;
  selfHostedUrl?: string;
  lastSyncAt?: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface ExportOptions {
  format: 'markdown' | 'csv' | 'json' | 'obsidian' | 'notion' | 'anki';
  dateRange?: { from: string; to: string };
  tags?: string[];
  groupBy: 'page' | 'date' | 'tag';
}

export interface ReviewSession {
  highlights: Highlight[];
  currentIndex: number;
  completed: number;
  remaining: number;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
}
