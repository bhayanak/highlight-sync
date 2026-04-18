import type { Highlight, ExportOptions } from '@/shared/types';
import { formatDate, getDomain, escapeHtml } from '@/shared/utils';
import { htmlToMarkdown } from '@/lib/html-to-md';

export function exportHighlights(highlights: Highlight[], options: ExportOptions): string {
  const filtered = filterByOptions(highlights, options);
  const grouped = groupHighlights(filtered, options.groupBy);

  switch (options.format) {
    case 'markdown':
      return toMarkdown(grouped, options.groupBy);
    case 'csv':
      return toCSV(filtered);
    case 'json':
      return JSON.stringify(filtered, null, 2);
    case 'obsidian':
      return toObsidian(grouped, options.groupBy);
    case 'notion':
      return toNotion(grouped, options.groupBy);
    case 'anki':
      return toAnki(filtered);
    default:
      return JSON.stringify(filtered, null, 2);
  }
}

function filterByOptions(highlights: Highlight[], options: ExportOptions): Highlight[] {
  let result = highlights;

  if (options.dateRange) {
    const from = new Date(options.dateRange.from).getTime();
    const to = new Date(options.dateRange.to).getTime();
    result = result.filter((h) => {
      const t = new Date(h.createdAt).getTime();
      return t >= from && t <= to;
    });
  }

  if (options.tags && options.tags.length > 0) {
    const tagSet = new Set(options.tags);
    result = result.filter((h) => h.tags.some((t) => tagSet.has(t)));
  }

  return result;
}

function groupHighlights(
  highlights: Highlight[],
  groupBy: 'page' | 'date' | 'tag',
): Map<string, Highlight[]> {
  const groups = new Map<string, Highlight[]>();

  for (const h of highlights) {
    let keys: string[];
    switch (groupBy) {
      case 'page':
        keys = [h.url];
        break;
      case 'date':
        keys = [formatDate(h.createdAt)];
        break;
      case 'tag':
        keys = h.tags.length > 0 ? h.tags : ['Untagged'];
        break;
    }
    for (const key of keys) {
      const existing = groups.get(key) ?? [];
      existing.push(h);
      groups.set(key, existing);
    }
  }

  return groups;
}

/** Wrap text in a proper markdown blockquote — each line prefixed with `> `. */
function blockquote(text: string): string {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

/** Get the best markdown representation of a highlight's content. */
function highlightContent(h: Highlight): string {
  return htmlToMarkdown(h.html, h.text);
}

function toMarkdown(groups: Map<string, Highlight[]>, groupBy: string): string {
  const lines: string[] = ['# Highlight Sync Export', ''];

  for (const [key, highlights] of groups) {
    const heading =
      groupBy === 'page' ? `## ${highlights[0]?.title || getDomain(key)}` : `## ${key}`;
    lines.push(heading);
    if (groupBy === 'page') lines.push(`> Source: ${key}`);
    lines.push('');

    for (const h of highlights) {
      const content = highlightContent(h);
      // If the content contains block-level elements (tables, lists, headings),
      // render it directly; otherwise wrap in a blockquote.
      const hasBlocks = /^(\||#|-|\d+\.|```)/m.test(content);
      if (hasBlocks) {
        lines.push(content);
      } else {
        lines.push(blockquote(content));
      }
      lines.push('');
      if (h.note) {
        lines.push(`**Note:** ${h.note}`);
        lines.push('');
      }
      const meta: string[] = [];
      meta.push(`- **URL:** ${h.url}`);
      meta.push(`- **Date:** ${formatDate(h.createdAt)}`);
      meta.push(`- **Tags:** ${h.tags.join(', ') || 'none'}`);
      meta.push(`- **Color:** ${h.color}`);
      lines.push(meta.join('\n'));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function toObsidian(groups: Map<string, Highlight[]>, groupBy: string): string {
  const lines: string[] = [];

  for (const [key, highlights] of groups) {
    const title = groupBy === 'page' ? highlights[0]?.title || getDomain(key) : key;
    lines.push('---');
    lines.push(`title: "${escapeHtml(title)}"`);
    lines.push(`date: ${new Date().toISOString().split('T')[0]}`);
    lines.push(`tags: [highlight-sync]`);
    lines.push('---');
    lines.push('');
    lines.push(`# ${title}`);
    if (groupBy === 'page') lines.push(`Source:: ${key}`);
    lines.push('');

    for (const h of highlights) {
      const content = highlightContent(h);
      const hasBlocks = /^(\||#|-|\d+\.|```)/m.test(content);
      if (hasBlocks) {
        // Block content doesn't fit inside a callout cleanly — render directly
        lines.push(content);
      } else {
        lines.push(`> [!quote]`);
        const quotedText = content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
        lines.push(quotedText);
      }
      lines.push('');
      if (h.note) {
        lines.push(`**Note:** ${h.note}`);
        lines.push('');
      }
      const tagLinks = h.tags.map((t) => `[[${t}]]`).join(' ');
      lines.push(`- **Tags:** ${tagLinks || 'none'}`);
      lines.push(`- **Color:** ${h.color}`);
      lines.push(`- **Date:** ${formatDate(h.createdAt)}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function toNotion(groups: Map<string, Highlight[]>, groupBy: string): string {
  const lines: string[] = ['# Highlight Sync Export', ''];

  for (const [key, highlights] of groups) {
    const title = groupBy === 'page' ? highlights[0]?.title || getDomain(key) : key;
    lines.push(`## ${title}`);
    lines.push('');

    for (const h of highlights) {
      const content = highlightContent(h);
      const hasBlocks = /^(\||#|-|\d+\.|```)/m.test(content);
      if (hasBlocks) {
        lines.push(content);
      } else {
        lines.push(blockquote(content));
      }
      if (h.note) {
        lines.push('');
        lines.push(blockquote(`💡 ${h.note}`));
      }
      lines.push('');
      lines.push(`- **URL:** ${h.url}`);
      lines.push(`- **Date:** ${formatDate(h.createdAt)}`);
      lines.push(`- **Tags:** ${h.tags.join(', ') || 'none'}`);
      lines.push(`- **Color:** ${h.color}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function toCSV(highlights: Highlight[]): string {
  const header = 'Text,URL,Title,Note,Color,Tags,Created';
  const rows = highlights.map((h) =>
    [
      csvEscape(h.text),
      csvEscape(h.url),
      csvEscape(h.title),
      csvEscape(h.note ?? ''),
      h.color,
      csvEscape(h.tags.join('; ')),
      h.createdAt,
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

function toAnki(highlights: Highlight[]): string {
  return highlights
    .map((h) => {
      const front = `${h.title} (${getDomain(h.url)})`;
      const back = h.text + (h.note ? `\n\nNote: ${h.note}` : '');
      return `${ankiEscape(front)}\t${ankiEscape(back)}`;
    })
    .join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function ankiEscape(value: string): string {
  return value.replace(/\t/g, ' ').replace(/\n/g, '<br>');
}
