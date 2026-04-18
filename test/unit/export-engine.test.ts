import { describe, it, expect } from 'vitest';
import { exportHighlights } from '@/background/export-engine';
import type { Highlight } from '@/shared/types';

const mockHighlights: Highlight[] = [
  {
    id: '1',
    url: 'https://example.com/article',
    title: 'Test Article',
    text: 'This is important text',
    note: 'My note',
    color: 'yellow',
    tags: ['test', 'reading'],
    xpath: '/html/body/p[1]',
    textOffset: { start: 0, end: 22 },
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    reviewCount: 0,
    nextReviewAt: '2026-01-16T10:00:00.000Z',
    easeFactor: 2.5,
  },
  {
    id: '2',
    url: 'https://example.com/article',
    title: 'Test Article',
    text: 'Another highlight',
    color: 'green',
    tags: ['test'],
    xpath: '/html/body/p[2]',
    textOffset: { start: 0, end: 17 },
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-01-16T10:00:00.000Z',
    reviewCount: 1,
    nextReviewAt: '2026-01-22T10:00:00.000Z',
    easeFactor: 2.6,
  },
];

describe('export-engine', () => {
  it('exports to JSON', () => {
    const result = exportHighlights(mockHighlights, { format: 'json', groupBy: 'page' });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].text).toBe('This is important text');
  });

  it('exports to CSV with proper escaping', () => {
    const result = exportHighlights(mockHighlights, { format: 'csv', groupBy: 'page' });
    const lines = result.split('\n');
    expect(lines[0]).toBe('Text,URL,Title,Note,Color,Tags,Created');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('exports to Markdown grouped by page', () => {
    const result = exportHighlights(mockHighlights, { format: 'markdown', groupBy: 'page' });
    expect(result).toContain('# Highlight Sync Export');
    expect(result).toContain('## Test Article');
    expect(result).toContain('This is important text');
    expect(result).toContain('**Note:** My note');
  });

  it('exports to Obsidian format with frontmatter', () => {
    const result = exportHighlights(mockHighlights, { format: 'obsidian', groupBy: 'page' });
    expect(result).toContain('---');
    expect(result).toContain('title:');
    expect(result).toContain('tags: [highlight-sync]');
    expect(result).toContain('> [!quote]');
    expect(result).toContain('[[test]]');
  });

  it('exports to Notion format', () => {
    const result = exportHighlights(mockHighlights, { format: 'notion', groupBy: 'page' });
    expect(result).toContain('# Highlight Sync Export');
    expect(result).toContain('**URL:**');
    expect(result).toContain('**Color:** yellow');
  });

  it('exports to Anki format', () => {
    const result = exportHighlights(mockHighlights, { format: 'anki', groupBy: 'page' });
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('\t');
    expect(lines[0]).toContain('This is important text');
  });

  it('filters by date range', () => {
    const result = exportHighlights(mockHighlights, {
      format: 'json',
      groupBy: 'page',
      dateRange: { from: '2026-01-16T00:00:00.000Z', to: '2026-01-17T00:00:00.000Z' },
    });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe('Another highlight');
  });

  it('filters by tags', () => {
    const result = exportHighlights(mockHighlights, {
      format: 'json',
      groupBy: 'page',
      tags: ['reading'],
    });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].tags).toContain('reading');
  });

  it('groups by tag', () => {
    const result = exportHighlights(mockHighlights, { format: 'markdown', groupBy: 'tag' });
    expect(result).toContain('## test');
    expect(result).toContain('## reading');
  });

  it('groups by date', () => {
    const result = exportHighlights(mockHighlights, { format: 'markdown', groupBy: 'date' });
    expect(result).toContain('## Jan');
  });

  it('handles multi-line text in markdown blockquotes', () => {
    const multiLine: Highlight[] = [
      {
        ...mockHighlights[0],
        text: 'Line one\nLine two\nLine three',
      },
    ];
    const result = exportHighlights(multiLine, { format: 'markdown', groupBy: 'page' });
    expect(result).toContain('> Line one\n> Line two\n> Line three');
  });

  it('exports HTML tables as proper markdown tables', () => {
    const withHtml: Highlight[] = [
      {
        ...mockHighlights[0],
        text: 'Name Age Alice 30',
        html: '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>',
      },
    ];
    const result = exportHighlights(withHtml, { format: 'markdown', groupBy: 'page' });
    expect(result).toContain('| Name');
    expect(result).toContain('| ---');
    expect(result).toContain('| Alice');
  });

  it('falls back to plain text when no html field', () => {
    const result = exportHighlights(mockHighlights, { format: 'markdown', groupBy: 'page' });
    expect(result).toContain('This is important text');
  });
});
