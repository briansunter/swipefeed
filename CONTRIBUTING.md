# Contributing

Thanks for considering a contribution! Please follow these guidelines so changes land smoothly.

## Development setup
- Install Bun: https://bun.sh
- Install dependencies: `bun install`
- Run tests and lint locally before opening a PR:
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:coverage`
  - `bun run test:browser:coverage`
  - `bun run coverage:merge`

## Commit style
- Use Conventional Commits (enforced by commitlint):
  - Examples: `feat: add swipe loop option`, `fix: prevent scroll bleed`
- Hooks run automatically via Husky:
  - `commit-msg`: checks commit message format
  - `pre-commit`: runs lint and typecheck

## Pull requests
- Target branch: `master`
- Ensure CI is green (lint, typecheck, tests, coverage merge).
- Update docs or README when behavior or APIs change.
- Add or adjust tests when fixing bugs or adding features.

## GitHub Pages
- CI publishes docs + example to `gh-pages` from the `master` branch.
- Local build: `bun run site:prepare`.

