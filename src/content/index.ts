import type { Highlight, HighlightColor } from '@/shared/types';
import {
  createHighlightFromSelection,
  applyHighlightToDOM,
  restoreHighlights,
  showFloatingToolbar,
  removeToolbar,
} from './highlighter';

// --- Restore highlights on page load ---
function safeRuntimeSendMessage(message: unknown, callback?: (response: unknown) => void): void {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) return;
      callback?.(response);
    });
  } catch {
    // Extension context not available
  }
}

safeRuntimeSendMessage(
  { type: 'GET_PAGE_HIGHLIGHTS', payload: { url: window.location.href } },
  (highlights) => {
    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      restoreHighlights(highlights);
    }
  },
);

// --- Show floating toolbar on text selection ---
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    removeToolbar();
    return;
  }
  showFloatingToolbar(e.clientX, e.clientY);
});

// --- Listen for messages from background ---
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CREATE_HIGHLIGHT') {
    const color: HighlightColor = message.color || 'yellow';
    const data = createHighlightFromSelection(color);
    if (!data) {
      sendResponse({ error: 'No text selected' });
      return;
    }

    safeRuntimeSendMessage({ type: 'SAVE_HIGHLIGHT', payload: data }, (saved) => {
      if (saved && !(saved as Record<string, unknown>).error) {
        applyHighlightToDOM(saved as Highlight);
      }
      sendResponse(saved);
    });
    return true; // async
  }
});
