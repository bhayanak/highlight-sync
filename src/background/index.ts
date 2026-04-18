import { setupReviewAlarm, setupSyncAlarm } from './review-scheduler';
import { performSync } from './sync-manager';
import {
  addHighlight,
  getHighlightsByUrl,
  getHighlightsForReview,
  deleteHighlight,
  updateHighlight,
  getAllHighlights,
  searchHighlights,
} from './storage';
import type { SyncConfig, HighlightColor, Highlight } from '@/shared/types';
import { DEFAULT_SYNC_INTERVAL_MINUTES } from '@/shared/constants';

// --- Context Menu ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'highlight-selection',
    title: 'Highlight Selection',
    contexts: ['selection'],
  });

  for (const color of ['yellow', 'green', 'blue', 'pink', 'purple'] as const) {
    chrome.contextMenus.create({
      id: `highlight-${color}`,
      parentId: 'highlight-selection',
      title: color.charAt(0).toUpperCase() + color.slice(1),
      contexts: ['selection'],
    });
  }

  setupReviewAlarm();
});

/**
 * Safely send a message to a tab's content script.
 * Swallows "Receiving end does not exist" errors that occur when the
 * content script hasn't loaded yet (e.g. chrome:// pages, PDF viewer).
 */
function safeSendToTab(
  tabId: number,
  message: unknown,
  callback?: (response: unknown) => void,
): void {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not available in this tab — silently ignore
      return;
    }
    callback?.(response);
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId.toString().startsWith('highlight-')) return;
  if (!tab?.id) return;

  const color = info.menuItemId.toString().replace('highlight-', '') as HighlightColor;
  safeSendToTab(tab.id, {
    type: 'CREATE_HIGHLIGHT',
    color,
  });
});

// --- Alarms ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-review') {
    const due = await getHighlightsForReview();
    if (due.length > 0) {
      chrome.action.setBadgeText({ text: String(due.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    }
  }

  if (alarm.name === 'auto-sync') {
    const stored = await chrome.storage.local.get('syncConfig');
    const config = stored.syncConfig as SyncConfig | undefined;
    if (config?.autoSync && config.provider !== 'none') {
      try {
        await performSync(config);
      } catch (e) {
        console.error('[Highlight Sync] Auto-sync failed:', e);
      }
    }
  }
});

// --- Message Handling ---
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => {
      console.error('[Highlight Sync]', err);
      sendResponse({ error: err.message });
    });
  return true; // async response
});

async function handleMessage(message: { type: string; payload?: unknown }) {
  switch (message.type) {
    case 'SAVE_HIGHLIGHT':
      return addHighlight(message.payload as Parameters<typeof addHighlight>[0]);

    case 'GET_PAGE_HIGHLIGHTS': {
      const { url } = message.payload as { url: string };
      return getHighlightsByUrl(url);
    }

    case 'SYNC': {
      const stored = await chrome.storage.local.get('syncConfig');
      const config = stored.syncConfig as SyncConfig;
      return performSync(config);
    }

    case 'SET_SYNC_CONFIG': {
      const config = message.payload as SyncConfig;
      await chrome.storage.local.set({ syncConfig: config });
      if (config.autoSync && config.provider !== 'none') {
        setupSyncAlarm(config.syncIntervalMinutes || DEFAULT_SYNC_INTERVAL_MINUTES);
      }
      return { success: true };
    }

    case 'DELETE_HIGHLIGHT': {
      const { id } = message.payload as { id: string };
      await deleteHighlight(id);
      return { success: true };
    }

    case 'UPDATE_HIGHLIGHT': {
      const { id, updates } = message.payload as {
        id: string;
        updates: Partial<Highlight>;
      };
      await updateHighlight(id, updates);
      return { success: true };
    }

    case 'GET_ALL_HIGHLIGHTS':
      return getAllHighlights();

    case 'SEARCH_HIGHLIGHTS': {
      const { query } = message.payload as { query: string };
      return searchHighlights(query);
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// --- Keyboard Shortcut ---
chrome.commands.onCommand.addListener((command) => {
  if (command === 'highlight-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        safeSendToTab(tabs[0].id, {
          type: 'CREATE_HIGHLIGHT',
          color: 'yellow',
        });
      }
    });
  }
});
