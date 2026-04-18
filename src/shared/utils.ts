export function generateId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch]);
}

export function getXPath(element: Node): string {
  if (element.nodeType === Node.DOCUMENT_NODE) return '/';

  const parts: string[] = [];
  let current: Node | null = element;

  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const tagName = el.tagName.toLowerCase();
      let index = 1;
      let sibling = el.previousElementSibling;
      while (sibling) {
        if (sibling.tagName.toLowerCase() === tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      parts.unshift(`${tagName}[${index}]`);
    }
    current = current.parentNode;
  }

  return '/' + parts.join('/');
}
