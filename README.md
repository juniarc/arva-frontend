# Arva

Marketplace website where users can buy and sell products.

## About this project

This is a rebuild project. Arva was first built as an earlier version (`juniarc/arva-gfp-frontend`), and this repository rebuilds it from scratch with a new stack and a cleaner structure.

The rebuild is also a learning project: its goal is to learn how to get the most out of Claude AI in real software development. Claude is used as a coding partner across the whole process, from planning features and writing code to testing, debugging and keeping the documentation up to date. `CLAUDE.md` holds the project context and rules that guide it.

## Before you start (every session, on every machine)

1. `git pull`
2. Check the Node version: `node -v` (must match `.nvmrc`)
3. If `package.json` changed: `npm install` in the app folder you are working on
4. Read `CLAUDE.md` and `docs/DECISIONS.md`

## Before you stop

1. Run `npm run typecheck`, `npm run lint`, and `npm test`
2. Commit your work (use `WIP:` if unfinished)
3. `git push`

## Setup

```bash
# frontend
cd apps/web && cp .env.example .env.local && npm install && npm run dev

# backend
cd apps/api && cp .env.example .env && npm install && npx prisma migrate dev && npm run dev
```

## Documentation

- `CLAUDE.md`: project context and rules for AI assistants
- `docs/ARCHITECTURE.md`: folder structure and layers
- `docs/CONVENTIONS.md`: naming, styling, and testing rules
- `docs/DECISIONS.md`: decisions and open questions
