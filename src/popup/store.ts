import { create } from 'zustand';
import type { Highlight, Tag, SyncConfig } from '@/shared/types';
import {
  getAllHighlights,
  getAllTags,
  searchHighlights,
  getHighlightsForReview,
  deleteHighlight as deleteHL,
  updateHighlight as updateHL,
  updateTagCount,
} from '@/background/storage';

interface StoreState {
  highlights: Highlight[];
  tags: Tag[];
  reviewQueue: Highlight[];
  searchQuery: string;
  activeTab: 'dashboard' | 'search' | 'tags' | 'review' | 'export' | 'settings';
  syncConfig: SyncConfig;
  loading: boolean;

  setActiveTab: (tab: StoreState['activeTab']) => void;
  loadHighlights: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadReviewQueue: () => Promise<void>;
  search: (query: string) => Promise<void>;
  setSyncConfig: (config: SyncConfig) => void;
  deleteHighlight: (id: string) => Promise<void>;
  updateHighlightTags: (id: string, tags: string[]) => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  highlights: [],
  tags: [],
  reviewQueue: [],
  searchQuery: '',
  activeTab: 'dashboard',
  syncConfig: {
    provider: 'none',
    autoSync: false,
    syncIntervalMinutes: 30,
  },
  loading: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadHighlights: async () => {
    set({ loading: true });
    const highlights = await getAllHighlights();
    set({ highlights, loading: false });
  },

  loadTags: async () => {
    const tags = await getAllTags();
    set({ tags });
  },

  loadReviewQueue: async () => {
    const reviewQueue = await getHighlightsForReview();
    set({ reviewQueue });
  },

  search: async (query: string) => {
    set({ searchQuery: query, loading: true });
    const highlights = query ? await searchHighlights(query) : await getAllHighlights();
    set({ highlights, loading: false });
  },

  setSyncConfig: (config) => {
    set({ syncConfig: config });
    chrome.storage.local.set({ syncConfig: config });
  },

  deleteHighlight: async (id: string) => {
    const state = useStore.getState();
    const highlight = state.highlights.find((h) => h.id === id);
    await deleteHL(id);
    set({ highlights: state.highlights.filter((h) => h.id !== id) });
    // Refresh counts for tags that were on the deleted highlight
    if (highlight?.tags.length) {
      for (const tag of highlight.tags) {
        await updateTagCount(tag);
      }
      const tags = await getAllTags();
      set({ tags });
    }
  },

  updateHighlightTags: async (id: string, tags: string[]) => {
    const state = useStore.getState();
    const oldTags = state.highlights.find((h) => h.id === id)?.tags || [];
    await updateHL(id, { tags });
    set({
      highlights: state.highlights.map((h) => (h.id === id ? { ...h, tags } : h)),
    });
    // Refresh counts for all affected tags (added + removed)
    const affected = new Set([...oldTags, ...tags]);
    for (const tag of affected) {
      await updateTagCount(tag);
    }
    const updatedTags = await getAllTags();
    set({ tags: updatedTags });
  },
}));
