# playwright-config-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/playwright-config-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/playwright-config-nick2bad4u/actions/workflows/ci.yml)

Composable, typed [Playwright Test](https://playwright.dev/docs/test-configuration) factories for browser, Electron, mixed, local, and CI suites. The package deliberately leaves repository paths, browser channels, setup modules, and signing/sandbox policy to the consumer.

## Install

```sh
npm install --save-dev @playwright/test playwright-config-nick2bad4u
```

## Complete configuration

```ts
// playwright.config.ts
import {
 createBrowserProject,
 createElectronProjects,
 createPlaywrightConfig,
} from "playwright-config-nick2bad4u";

export default createPlaywrightConfig({
 globalSetup: "./playwright/global-setup.ts",
 projects: [
  createBrowserProject({
   name: "ui-smoke",
   grep: /@smoke/u,
   testMatch: "**/*.ui.spec.ts",
  }),
  ...createElectronProjects(),
 ],
 testDir: "./playwright/tests",
 tsconfig: "./playwright/tsconfig.json",
});
```

## Presets and subpaths

| Export                                  | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `playwright-config-nick2bad4u`          | Complete config factory and all named helpers      |
| `playwright-config-nick2bad4u/base`     | Conservative base config and merge helper          |
| `playwright-config-nick2bad4u/browser`  | Browser and cross-browser project factories        |
| `playwright-config-nick2bad4u/electron` | Electron main, renderer, and E2E project factories |
| `playwright-config-nick2bad4u/ci`       | Explicit CI fragment                               |
| `playwright-config-nick2bad4u/env`      | Deterministic environment parsing                  |

Arrays such as `projects` replace earlier values. Nested `expect`, `use`, and `use.launchOptions` objects are merged. This avoids surprising project duplication while allowing small consumer overrides.

## Environment policy

The root and browser factories recognize:

| Variable                        | Meaning                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `CI`                            | Enables headless mode, retries, and CI-safe defaults                  |
| `PLAYWRIGHT_HEADLESS`           | Enables headless mode locally                                         |
| `PLAYWRIGHT_WORKERS`            | Positive integer for total workers                                    |
| `PLAYWRIGHT_UI_WORKERS`         | Positive integer for browser project workers                          |
| `PLAYWRIGHT_SLOWMO`             | Non-negative launch delay in milliseconds                             |
| `PLAYWRIGHT_CHROMIUM_ARGS`      | Shell-free quoted argument list                                       |
| `PLAYWRIGHT_DISABLE_GPU`        | Adds `--disable-gpu` when true                                        |
| `PLAYWRIGHT_ENABLE_ATTACHMENTS` | Enables failure screenshots, retry traces, and retained failure video |

The factories never delete or rewrite environment variables. Pass an explicit `environment` object in tests or when ambient process state is undesirable.

## Browser-only suite

```ts
import {
 createCrossBrowserProjects,
 createPlaywrightConfig,
} from "playwright-config-nick2bad4u";

export default createPlaywrightConfig({
 projects: createCrossBrowserProjects(),
 testDir: "./tests/e2e",
});
```

The package does not force `channel: "chrome"`; Playwright-managed Chromium therefore works without a separate branded Chrome installation. A consumer can set `use.channel` when that is an intentional requirement.

## Electron projects

Electron projects contain collection, metadata, timeout, and worker policy only. They do not receive browser device descriptors because Electron tests generally launch through Playwright's `_electron` API.

```ts
import { createElectronProject } from "playwright-config-nick2bad4u/electron";

const renderer = createElectronProject({
 layer: "renderer",
 name: "electron-renderer",
 testMatch: "**/renderer-process.*.playwright.test.ts",
});
```

## Validation

```sh
npm run release:verify
```

The test suite exercises normal and invalid environment inputs, browser and Electron project shapes, merge semantics, type declarations, package exports, and a real `playwright test --list` consumer load.
