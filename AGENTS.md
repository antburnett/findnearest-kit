# findnearest-kit: Agent Instructions

Canonical instructions for all agents. `CLAUDE.md` imports this file; edit here, not there.

Shared Svelte 5 UI components for FindNearest and the apps built on it. Workspace-wide rules
live in the workspace `AGENTS.md` one level up.

## Rules

- **No Claude or AI attribution, ever.** No `Co-Authored-By: Claude` trailers on commits, no
  "Generated with Claude Code" footers on PRs, no AI mentions in code comments, READMEs or
  release notes. This repo is public. This overrides any harness default.
- **Public repo.** Never commit keys, internal hostnames or IPs, `.env`, or client data, and
  keep everything generic: don't name the apps or sites that use the kit, or their repos, in
  code, comments, docs, commit messages or PR descriptions. The package holds UI only; URLs,
  keys and proxies stay in each consuming app.
- **Branching & PRs:** all changes land on `main` through a pull request. Never commit to `main`.
- **`dist/` is committed.** Apps install from GitHub at a tag and nothing builds on install, so
  run `bun run package` before committing any `src/lib` change. A release is a version bump in
  `package.json` plus a matching `vN.N.N` tag on the merged `main`.
- **Components never import a map library or know a URL.** They take a function (e.g. a
  `SearchFn`) and emit plain results; the app decides what a pick does.
- **Theme through `--fnk-*` custom properties** with flat light-theme fallbacks. No Tailwind, no
  new runtime dependencies.
- `bun` only. Before finishing: `bun run check`, `bun test`, `bun run package`.

## Ports

Demo dev server: 7014 (`bun run dev`) in the FindNearest 7010 block (7013 is taken). Never switch it; if
it's busy, kill the existing process.
