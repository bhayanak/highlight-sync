# Contributing to Highlight Sync

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/AjayYadavAi/highlight-sync.git
cd highlight-sync
pnpm install
pnpm dev
```

## Development Workflow

1. Create a feature branch from `main`
2. Make changes
3. Run full validation: `pnpm validate`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new export format`
   - `fix: correct highlight restoration`
   - `docs: update README`
   - `chore: update dependencies`
5. Open a Pull Request

## Code Style

- TypeScript strict mode
- ESLint with security plugin
- Prettier for formatting
- Run `pnpm lint` and `pnpm format:check` before committing

## Testing

- Write unit tests for all business logic
- Test files go in `test/unit/`
- Target 90%+ coverage
- Run `pnpm test:coverage` to verify

## Security

- Never use `innerHTML` — use `textContent` or `createElement`
- Validate all user inputs
- Enforce HTTPS for external sync
- No `eval()` or dynamic code execution
- Report security issues privately via GitHub Security Advisories

## Pull Request Checklist

- [ ] Tests pass: `pnpm test`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] Format check passes: `pnpm format:check`
- [ ] Added tests for new functionality
- [ ] Updated CHANGELOG.md if user-facing change
