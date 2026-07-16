# Repository Instructions

This repository publishes `playwright-config-nick2bad4u`.
Treat every exported factory, option type, project preset, and environment parser as a public package surface.

## Priorities

- Keep defaults conservative and portable across browser-only, Electron, local, and CI suites.
- Never mutate consumer environment variables while loading configuration.
- Keep repository-specific paths, browser channels, launch arguments, and global setup modules opt-in.
- Preserve caller projects and overrides without silently deep-merging arrays.
- Validate the packed ESM package and load it through the real Playwright CLI before release.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
