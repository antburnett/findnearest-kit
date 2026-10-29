# findnearest-kit: Agent Instructions

Canonical instructions for all agents. `CLAUDE.md` imports this file; edit here, not there.

Shared Svelte 5 UI for FindNearest and the apps built on it (FindNearest Admin, ANTS, Shifter,
Thematrix, Centrelinker, Synker, public client sites): the base CSS every app imports, and the
shared components. Workspace-wide rules live in `../AGENTS.md`.

## Rules

- **No Claude or AI attribution, ever.** No `Co-Authored-By: Claude` trailers on commits, no
  "Generated with Claude Code" footers on PRs, no AI mentions in code comments, READMEs or
  release notes. This repo is public. This overrides any harness default.
- **Public repo.** Never commit keys, internal hostnames or IPs, `.env`, or client data. The
  package holds UI only; URLs, keys and proxies stay in each consuming app.
- **Branching & PRs:** all changes land on `main` through a pull request. Never commit to `main`.
- **`dist/` is committed.** Apps install from GitHub at a tag and nothing builds on install, so
  run `bun run package` before committing any `src/lib` change. A release is a version bump in
  `package.json` plus a matching `vN.N.N` tag on the merged `main`.
- **Components never import a map library or know a URL.** They take a function (e.g. a
  `SearchFn`) and emit plain results; the app decides what a pick does.
- **No CSS framework.** Plain CSS and custom properties only, and no new runtime dependencies.
- **Base CSS (`src/lib/styles/`):** `fn-core.css` (tokens, dark mode, base elements, prose,
  `fn-*` utilities and components), `fn-late.css` (toast and the flat Option A overrides),
  `fn-last.css` (rules that must win the cascade); `fn.css` imports all three. Every class is
  `fn-` prefixed; never add an unprefixed class here (it would collide with an app's own).
  Colours come from tokens: `--fn-color-*` (light values on `:root`, dark ones under
  `[data-mode='dark']`) and the `--fn-tint-<hue>-{bg-soft,bg,border,text}` tints. Never a bare hex
  in a rule. App-specific global rules stay in the app.
- **Components theme through `--fnk-*` custom properties** with Option A light fallbacks;
  `fn-last.css` maps them onto the `--fn-*` tokens.
- `bun` only. Before finishing: `bun run check`, `bun test`, `bun run package`.

## Ports

Demo dev server: 7014 (`bun run dev`) in the FindNearest 7010 block (7013 is the client template). Never switch it; if
it's busy, kill the existing process.
