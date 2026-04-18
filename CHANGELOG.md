# Changelog

All notable changes to Highlight Sync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-17

### Added
- Web text highlighting with 5 color options (yellow, green, blue, pink, purple)
- Local-first storage via IndexedDB (Dexie.js)
- Tag management and full-text search
- Spaced repetition review (SM-2 algorithm)
- Export to Markdown, CSV, JSON, Obsidian, Notion, Anki
- GitHub Gist sync (encrypted PAT storage)
- Self-hosted REST endpoint sync (HTTPS enforced)
- Keyboard shortcut: Ctrl/Cmd+Shift+H
- Right-click context menu with color submenu
- Floating toolbar on text selection
- Highlight restoration on page revisit (XPath-based)
- Dashboard with stats (total, weekly, review queue, top domains)
- Dark-friendly UI with Tailwind CSS
- Chrome and Firefox support (Manifest V3)
- CI pipeline: typecheck, lint, test, security scan, SBOM
- Release pipeline: auto GitHub releases with tagged versions
