/**
 * Lightweight HTML → Markdown converter for highlight export.
 *
 * Handles: headings, bold, italic, links, images, lists (ul/ol),
 * tables, blockquotes, code, <br>, <hr>, and nested structures.
 * Falls back to plain text for unrecognised elements.
 */

const SELF_CLOSING = new Set(['br', 'hr', 'img']);

interface Token {
  type: 'open' | 'close' | 'selfclose' | 'text';
  tag?: string;
  attrs?: Record<string, string>;
  text?: string;
}

/** Tiny tokeniser — splits HTML string into open/close tags and text runs. */
function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<!--[\s\S]*?-->|<\s*\/\s*([a-zA-Z0-9]+)\s*>|<\s*([a-zA-Z0-9]+)([^>]*?)\s*\/?>|[^<]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const full = m[0];
    if (full.startsWith('<!--')) continue; // skip comments
    if (m[1]) {
      // closing tag
      tokens.push({ type: 'close', tag: m[1].toLowerCase() });
    } else if (m[2]) {
      // opening tag
      const tag = m[2].toLowerCase();
      const attrs = parseAttrs(m[3] || '');
      if (SELF_CLOSING.has(tag) || full.endsWith('/>')) {
        tokens.push({ type: 'selfclose', tag, attrs });
      } else {
        tokens.push({ type: 'open', tag, attrs });
      }
    } else {
      // text
      const text = decodeEntities(full);
      if (text) tokens.push({ type: 'text', text });
    }
  }
  return tokens;
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([a-zA-Z_-]+)\s*=\s*"([^"]*)"|([a-zA-Z_-]+)\s*=\s*'([^']*)'|([a-zA-Z_-]+)\s*=\s*(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m[1]) attrs[m[1].toLowerCase()] = m[2];
    else if (m[3]) attrs[m[3].toLowerCase()] = m[4];
    else if (m[5]) attrs[m[5].toLowerCase()] = m[6];
  }
  return attrs;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ── AST ────────────────────────────────────────────────────────────

interface ASTNode {
  tag: string; // 'text', 'root', or HTML tag name
  attrs: Record<string, string>;
  children: ASTNode[];
  text?: string;
}

function buildAST(tokens: Token[]): ASTNode {
  const root: ASTNode = { tag: 'root', attrs: {}, children: [] };
  const stack: ASTNode[] = [root];

  for (const tok of tokens) {
    const parent = stack[stack.length - 1];
    if (tok.type === 'text') {
      parent.children.push({ tag: 'text', attrs: {}, children: [], text: tok.text });
    } else if (tok.type === 'selfclose') {
      parent.children.push({ tag: tok.tag!, attrs: tok.attrs || {}, children: [] });
    } else if (tok.type === 'open') {
      const node: ASTNode = { tag: tok.tag!, attrs: tok.attrs || {}, children: [] };
      parent.children.push(node);
      stack.push(node);
    } else if (tok.type === 'close') {
      // Pop up to the matching open tag (tolerant of mis-nesting)
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tok.tag) {
          stack.length = i;
          break;
        }
      }
    }
  }
  return root;
}

// ── Renderer ───────────────────────────────────────────────────────

function renderNode(node: ASTNode): string {
  if (node.tag === 'text') return node.text || '';
  if (node.tag === 'root') return renderChildren(node).trim();

  switch (node.tag) {
    case 'h1':
      return `\n# ${renderChildren(node).trim()}\n`;
    case 'h2':
      return `\n## ${renderChildren(node).trim()}\n`;
    case 'h3':
      return `\n### ${renderChildren(node).trim()}\n`;
    case 'h4':
      return `\n#### ${renderChildren(node).trim()}\n`;
    case 'h5':
      return `\n##### ${renderChildren(node).trim()}\n`;
    case 'h6':
      return `\n###### ${renderChildren(node).trim()}\n`;

    case 'strong':
    case 'b':
      return `**${renderChildren(node).trim()}**`;

    case 'em':
    case 'i':
      return `*${renderChildren(node).trim()}*`;

    case 'u':
      return `<u>${renderChildren(node).trim()}</u>`;

    case 'del':
    case 's':
    case 'strike':
      return `~~${renderChildren(node).trim()}~~`;

    case 'code':
      return `\`${renderChildren(node).trim()}\``;

    case 'pre': {
      const inner = renderChildren(node).trim();
      return `\n\`\`\`\n${inner}\n\`\`\`\n`;
    }

    case 'a': {
      const href = node.attrs.href || '';
      const text = renderChildren(node).trim();
      if (!href || href === text) return text;
      return `[${text}](${href})`;
    }

    case 'img': {
      const src = node.attrs.src || '';
      const alt = node.attrs.alt || 'image';
      if (!src) return '';
      return `![${alt}](${src})`;
    }

    case 'br':
      return '  \n';

    case 'hr':
      return '\n---\n';

    case 'blockquote': {
      const inner = renderChildren(node).trim();
      return (
        '\n' +
        inner
          .split('\n')
          .map((l) => `> ${l}`)
          .join('\n') +
        '\n'
      );
    }

    case 'p':
    case 'div':
    case 'section':
    case 'article':
    case 'header':
    case 'footer':
    case 'main':
    case 'figure':
    case 'figcaption':
      return `\n${renderChildren(node).trim()}\n`;

    case 'span':
    case 'mark':
    case 'abbr':
    case 'time':
    case 'small':
    case 'sub':
    case 'sup':
      return renderChildren(node);

    case 'ul':
      return '\n' + renderListItems(node, 'ul') + '\n';
    case 'ol':
      return '\n' + renderListItems(node, 'ol') + '\n';
    case 'li': {
      // Handled by renderListItems; fallback if orphaned
      return `- ${renderChildren(node).trim()}\n`;
    }

    case 'table':
      return '\n' + renderTable(node) + '\n';

    // Ignore style/script
    case 'style':
    case 'script':
    case 'noscript':
      return '';

    default:
      return renderChildren(node);
  }
}

function renderChildren(node: ASTNode): string {
  return node.children.map(renderNode).join('');
}

function renderListItems(list: ASTNode, type: 'ul' | 'ol'): string {
  const lines: string[] = [];
  let idx = 1;
  for (const child of list.children) {
    if (child.tag === 'li') {
      const prefix = type === 'ol' ? `${idx}. ` : '- ';
      lines.push(`${prefix}${renderChildren(child).trim()}`);
      idx++;
    } else if (child.tag === 'text' && !child.text?.trim()) {
      continue; // skip whitespace between li
    } else {
      lines.push(renderNode(child));
    }
  }
  return lines.join('\n');
}

// ── Table rendering ────────────────────────────────────────────────

function renderTable(table: ASTNode): string {
  const rows = collectRows(table);
  if (rows.length === 0) return '';

  // Determine column count from the widest row
  const colCount = Math.max(...rows.map((r) => r.length));
  if (colCount === 0) return '';

  // Normalise all rows to same width
  const normalised = rows.map((r) => {
    while (r.length < colCount) r.push('');
    return r;
  });

  // Calculate column widths
  const widths = Array.from({ length: colCount }, (_, c) =>
    Math.max(3, ...normalised.map((r) => r[c].length)),
  );

  const formatRow = (row: string[]) =>
    '| ' + row.map((cell, i) => cell.padEnd(widths[i])).join(' | ') + ' |';

  const lines: string[] = [];
  // First row as header
  lines.push(formatRow(normalised[0]));
  lines.push('| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |');

  for (let i = 1; i < normalised.length; i++) {
    lines.push(formatRow(normalised[i]));
  }

  return lines.join('\n');
}

function collectRows(node: ASTNode): string[][] {
  const rows: string[][] = [];

  function walk(n: ASTNode) {
    if (n.tag === 'tr') {
      const cells: string[] = [];
      for (const child of n.children) {
        if (child.tag === 'th' || child.tag === 'td') {
          cells.push(renderChildren(child).trim().replace(/\|/g, '\\|'));
        }
      }
      if (cells.length > 0) rows.push(cells);
    } else {
      for (const child of n.children) walk(child);
    }
  }

  walk(node);
  return rows;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Convert an HTML string to Markdown.
 * If the input is empty/undefined, returns the fallback text as-is.
 */
export function htmlToMarkdown(html: string | undefined, fallbackText: string): string {
  if (!html || !html.trim()) return fallbackText;

  try {
    const tokens = tokenize(html);
    const ast = buildAST(tokens);
    const md = renderNode(ast);
    // Collapse excessive blank lines
    const cleaned = md.replace(/\n{3,}/g, '\n\n').trim();
    return cleaned || fallbackText;
  } catch {
    return fallbackText;
  }
}
