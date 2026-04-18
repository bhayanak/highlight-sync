import type { Highlight, HighlightColor } from '@/shared/types';
import { HIGHLIGHT_COLORS } from '@/shared/constants';
import { getXPath } from '@/shared/utils';

const HIGHLIGHT_ATTR = 'data-hs-id';
const TOOLBAR_ID = 'hs-toolbar';

/**
 * Safely send a message to the background service worker.
 * Swallows "Extension context invalidated" errors that occur
 * when the extension has been reloaded but old content scripts
 * are still running on the page.
 */
function safeSendMessage(message: unknown, callback?: (response: unknown) => void): void {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        // Extension context invalidated or disconnected — silently ignore
        return;
      }
      callback?.(response);
    });
  } catch {
    // Extension context not available (extension unloaded/reloaded)
  }
}

/** Cached selection range — saved when toolbar appears, used on color click. */
let cachedRange: Range | null = null;

export function createHighlightFromSelection(
  color: HighlightColor,
): Omit<
  Highlight,
  'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'nextReviewAt' | 'easeFactor' | 'syncedAt'
> | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  if (!text) return null;

  // Capture the rich HTML content of the selection
  const fragment = range.cloneContents();
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  const html = wrapper.innerHTML;

  const xpath = getXPath(range.startContainer.parentElement || range.startContainer);

  return {
    url: window.location.href,
    title: document.title,
    text,
    html,
    color,
    tags: [],
    xpath,
    textOffset: {
      start: range.startOffset,
      end: range.endOffset,
    },
  };
}

export function applyHighlightToDOM(highlight: Highlight): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);

  const mark = document.createElement('mark');
  mark.setAttribute(HIGHLIGHT_ATTR, highlight.id);
  mark.style.backgroundColor = HIGHLIGHT_COLORS[highlight.color];
  mark.style.borderRadius = '2px';
  mark.style.padding = '0 1px';
  mark.style.cursor = 'pointer';

  try {
    range.surroundContents(mark);
  } catch {
    // Range spans multiple elements — wrap extracted contents
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }

  selection.removeAllRanges();

  mark.addEventListener('click', () => {
    showHighlightTooltip(mark, highlight);
  });
}

export function restoreHighlights(highlights: Highlight[]): void {
  for (const h of highlights) {
    try {
      const result = document.evaluate(
        h.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );
      const node = result.singleNodeValue;
      if (!node?.textContent) continue;

      const textNode = findTextNode(node, h.text);
      if (!textNode) continue;

      const range = document.createRange();
      const startOffset = Math.min(h.textOffset.start, textNode.length);
      const endOffset = Math.min(h.textOffset.end, textNode.length);

      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);

      const mark = document.createElement('mark');
      mark.setAttribute(HIGHLIGHT_ATTR, h.id);
      mark.style.backgroundColor = HIGHLIGHT_COLORS[h.color];
      mark.style.borderRadius = '2px';
      mark.style.padding = '0 1px';
      mark.style.cursor = 'pointer';

      try {
        range.surroundContents(mark);
      } catch {
        // Skip if range is invalid
      }

      mark.addEventListener('click', () => {
        showHighlightTooltip(mark, h);
      });
    } catch {
      // Skip highlights that can't be restored
    }
  }
}

function findTextNode(parent: Node, searchText: string): Text | null {
  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent?.includes(searchText)) return node;
  }
  return null;
}

function showHighlightTooltip(mark: HTMLElement, highlight: Highlight): void {
  removeToolbar();
  const rect = mark.getBoundingClientRect();

  const tooltip = document.createElement('div');
  tooltip.id = TOOLBAR_ID;
  tooltip.style.cssText = `
    position: fixed;
    top: ${rect.bottom + 8}px;
    left: ${Math.max(8, rect.left)}px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2147483647;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    color: #374151;
    max-width: 300px;
  `;

  const textEl = document.createElement('p');
  textEl.textContent = highlight.note || 'No note';
  textEl.style.cssText = 'margin: 0 0 6px 0; font-style: italic;';

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.cssText =
    'background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 12px;';
  deleteBtn.addEventListener('click', () => {
    safeSendMessage({
      type: 'DELETE_HIGHLIGHT',
      payload: { id: highlight.id },
    });
    mark.replaceWith(...Array.from(mark.childNodes));
    removeToolbar();
  });

  tooltip.appendChild(textEl);
  tooltip.appendChild(deleteBtn);
  document.body.appendChild(tooltip);

  const dismissHandler = (e: MouseEvent) => {
    if (!tooltip.contains(e.target as Node) && e.target !== mark) {
      removeToolbar();
      document.removeEventListener('click', dismissHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', dismissHandler), 0);
}

export function showFloatingToolbar(x: number, y: number): void {
  removeToolbar();

  // Cache the current selection range so it survives mousedown on the toolbar buttons
  const sel = window.getSelection();
  cachedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;

  const toolbar = document.createElement('div');
  toolbar.id = TOOLBAR_ID;
  toolbar.style.cssText = `
    position: fixed;
    top: ${y - 44}px;
    left: ${x}px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 4px;
    display: flex;
    gap: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2147483647;
  `;

  for (const [color, hex] of Object.entries(HIGHLIGHT_COLORS)) {
    const btn = document.createElement('button');
    btn.title = color;
    btn.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%;
      border: 2px solid transparent; cursor: pointer;
      background: ${hex};
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = '#6366f1';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'transparent';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Restore cached selection — clicking the button may have collapsed it
      if (cachedRange) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(cachedRange);
        }
      }

      const data = createHighlightFromSelection(color as HighlightColor);
      if (data) {
        safeSendMessage({ type: 'SAVE_HIGHLIGHT', payload: data }, (saved) => {
          const s = saved as Highlight | undefined;
          if (s && !('error' in s)) {
            applyHighlightToDOM(s);
          }
        });
      }
      cachedRange = null;
      removeToolbar();
    });
    toolbar.appendChild(btn);
  }

  document.body.appendChild(toolbar);

  // Prevent mousedown inside toolbar from collapsing the text selection,
  // and prevent mouseup from bubbling to the document handler (which would
  // destroy the toolbar before the click event fires on the button).
  toolbar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  toolbar.addEventListener('mouseup', (e) => {
    e.stopPropagation();
  });
}

export function removeToolbar(): void {
  document.getElementById(TOOLBAR_ID)?.remove();
}
