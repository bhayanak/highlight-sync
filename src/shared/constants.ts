import type { HighlightColor } from './types';

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  blue: '#bfdbfe',
  pink: '#fbcfe8',
  purple: '#ddd6fe',
};

export const DEFAULT_SYNC_INTERVAL_MINUTES = 30;

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

export const SM2_INITIAL_INTERVAL = 1; // days

export const DB_NAME = 'highlight-sync-db';
export const DB_VERSION = 1;

export const EXTENSION_NAME = 'Highlight Sync';
export const EXTENSION_VERSION = '1.0.0';
