import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '@/lib/html-to-md';

describe('html-to-md', () => {
  it('returns fallback text when html is undefined', () => {
    expect(htmlToMarkdown(undefined, 'plain text')).toBe('plain text');
  });

  it('returns fallback text when html is empty', () => {
    expect(htmlToMarkdown('', 'plain text')).toBe('plain text');
  });

  it('converts plain text', () => {
    expect(htmlToMarkdown('Hello world', 'fallback')).toBe('Hello world');
  });

  it('converts bold and italic', () => {
    expect(htmlToMarkdown('<b>bold</b> and <i>italic</i>', '')).toBe('**bold** and *italic*');
  });

  it('converts strong and em', () => {
    expect(htmlToMarkdown('<strong>bold</strong> <em>italic</em>', '')).toBe('**bold** *italic*');
  });

  it('converts links', () => {
    expect(htmlToMarkdown('<a href="https://example.com">click here</a>', '')).toBe(
      '[click here](https://example.com)',
    );
  });

  it('converts images', () => {
    expect(htmlToMarkdown('<img src="https://example.com/pic.png" alt="photo">', '')).toBe(
      '![photo](https://example.com/pic.png)',
    );
  });

  it('converts headings', () => {
    expect(htmlToMarkdown('<h1>Title</h1>', '')).toContain('# Title');
    expect(htmlToMarkdown('<h2>Subtitle</h2>', '')).toContain('## Subtitle');
    expect(htmlToMarkdown('<h3>Section</h3>', '')).toContain('### Section');
  });

  it('converts unordered lists', () => {
    const html = '<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('- Apple');
    expect(md).toContain('- Banana');
    expect(md).toContain('- Cherry');
  });

  it('converts ordered lists', () => {
    const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('1. First');
    expect(md).toContain('2. Second');
    expect(md).toContain('3. Third');
  });

  it('converts a simple table', () => {
    const html = `
      <table>
        <tr><th>Name</th><th>Age</th></tr>
        <tr><td>Alice</td><td>30</td></tr>
        <tr><td>Bob</td><td>25</td></tr>
      </table>
    `;
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('| Name');
    expect(md).toContain('| ---');
    expect(md).toContain('| Alice');
    expect(md).toContain('| Bob');
  });

  it('converts a table with thead and tbody', () => {
    const html = `
      <table>
        <thead><tr><th>Description</th><th>Date</th><th>Location</th></tr></thead>
        <tbody>
          <tr><td>Meeting</td><td>May 25</td><td>Room 1</td></tr>
          <tr><td>Review</td><td>June 1</td><td>Room 2</td></tr>
        </tbody>
      </table>
    `;
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('| Description');
    expect(md).toContain('| Meeting');
    expect(md).toContain('| Review');
    // Should have separator
    expect(md).toMatch(/\|\s*-+\s*\|/);
  });

  it('converts blockquotes', () => {
    const html = '<blockquote>A wise quote</blockquote>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('> A wise quote');
  });

  it('converts code blocks', () => {
    const html = '<pre><code>const x = 1;</code></pre>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('```');
    expect(md).toContain('const x = 1;');
  });

  it('converts inline code', () => {
    expect(htmlToMarkdown('Use <code>npm install</code> to install', '')).toBe(
      'Use `npm install` to install',
    );
  });

  it('converts br to line break', () => {
    const md = htmlToMarkdown('Line 1<br>Line 2', '');
    expect(md).toContain('Line 1');
    expect(md).toContain('Line 2');
  });

  it('converts hr to horizontal rule', () => {
    const md = htmlToMarkdown('<p>Above</p><hr><p>Below</p>', '');
    expect(md).toContain('---');
  });

  it('handles nested formatting', () => {
    const html = '<p>This is <strong>bold and <em>italic</em></strong> text</p>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('**bold and *italic***');
  });

  it('decodes HTML entities', () => {
    expect(htmlToMarkdown('&amp; &lt; &gt; &quot;', '')).toBe('& < > "');
  });

  it('strips script and style tags', () => {
    const html = '<p>Hello</p><script>alert(1)</script><style>.x{}</style><p>World</p>';
    const md = htmlToMarkdown(html, '');
    expect(md).not.toContain('alert');
    expect(md).not.toContain('.x{}');
    expect(md).toContain('Hello');
    expect(md).toContain('World');
  });

  it('handles the Cal Poly table case', () => {
    const html = `
      <table>
        <caption>Table caption</caption>
        <thead>
          <tr><th>Description</th><th>Date</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Academic Senate Meeting</td><td>May 25, 2205</td><td>Building 99 Room 1</td></tr>
          <tr><td>Commencement Meeting</td><td>December 15, 2205</td><td>Building 42 Room 10</td></tr>
        </tbody>
      </table>
    `;
    const md = htmlToMarkdown(html, '');
    // Should render as a proper markdown table
    expect(md).toContain('| Description');
    expect(md).toContain('| ---');
    expect(md).toContain('| Academic Senate Meeting');
    expect(md).toContain('| Commencement Meeting');
    expect(md).toContain('Building 99 Room 1');
  });

  it('handles strikethrough', () => {
    expect(htmlToMarkdown('<del>removed</del>', '')).toBe('~~removed~~');
  });

  it('handles mixed inline and block content', () => {
    const html = '<h2>Title</h2><p>Some <b>bold</b> text</p><ul><li>Item 1</li></ul>';
    const md = htmlToMarkdown(html, '');
    expect(md).toContain('## Title');
    expect(md).toContain('**bold**');
    expect(md).toContain('- Item 1');
  });
});
