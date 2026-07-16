import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
    createBasePlaywrightConfig,
    createBrowserProject,
    createCiPlaywrightConfig,
    createCrossBrowserProjects,
    createElectronProject,
    createElectronProjects,
    createPlaywrightConfig,
    isBooleanFlagEnabled,
    mergePlaywrightConfig,
    parseLaunchArguments,
    parseNonNegativeInteger,
    parsePositiveInteger,
    resolveBaseEnvironment,
    resolvePlaywrightEnvironment,
} from "../src/playwright-config.js";

describe("environment policy", () => {
    it("resolves CI, diagnostics, workers, slow motion, and launch args", () => {
        expect.assertions(1);

        const environment = {
            CI: "yes",
            PLAYWRIGHT_CHROMIUM_ARGS:
                '--no-sandbox --proxy-server="http://localhost:8080 proxy"',
            PLAYWRIGHT_DISABLE_GPU: "true",
            PLAYWRIGHT_ENABLE_ATTACHMENTS: "1",
            PLAYWRIGHT_SLOWMO: "25",
            PLAYWRIGHT_UI_WORKERS: "3",
            PLAYWRIGHT_WORKERS: "4",
        };

        expect(resolvePlaywrightEnvironment(environment)).toStrictEqual({
            attachmentsEnabled: true,
            browserWorkers: 3,
            headless: true,
            isCi: true,
            launchArgs: [
                "--no-sandbox",
                "--proxy-server=http://localhost:8080 proxy",
                "--disable-gpu",
            ],
            slowMo: 25,
            totalWorkers: 4,
        });
    });

    it("does not mutate the supplied environment", () => {
        expect.assertions(1);

        const environment = {
            FORCE_COLOR: "1",
            NO_COLOR: "1",
            PLAYWRIGHT_DISABLE_GPU: "1",
        };
        const before = { ...environment };

        resolvePlaywrightEnvironment(environment);

        expect(environment).toStrictEqual(before);
    });

    it("rejects unterminated quoted launch arguments", () => {
        expect.assertions(10);

        expect(() => parseLaunchArguments('--proxy-server="broken')).toThrow(
            RangeError
        );
        expect(parseLaunchArguments(undefined)).toStrictEqual([]);
        expect(
            parseLaunchArguments(
                String.raw`one\ two "three'four" 'five"six' plain\q`
            )
        ).toStrictEqual([
            "one two",
            "three'four",
            'five"six',
            String.raw`plain\q`,
        ]);
        expect(isBooleanFlagEnabled(undefined)).toBe(false);
        expect(isBooleanFlagEnabled(" OFF ")).toBe(false);
        expect(parseNonNegativeInteger("0")).toBe(0);
        expect(parseNonNegativeInteger("-1")).toBeUndefined();
        expect(parseNonNegativeInteger("9".repeat(400))).toBeUndefined();
        expect(parsePositiveInteger("2workers", 1)).toBe(1);
        expect(parsePositiveInteger("0", 3)).toBe(3);
    });

    it("keeps GPU arguments idempotent and applies local defaults", () => {
        expect.assertions(2);

        const environment = resolveBaseEnvironment({
            PLAYWRIGHT_CHROMIUM_ARGS: "--disable-gpu",
            PLAYWRIGHT_DISABLE_GPU: "true",
        });

        expect(environment.launchArgs).toStrictEqual(["--disable-gpu"]);
        expect(createBasePlaywrightConfig({ environment: {} }).retries).toBe(0);
    });
});

describe("project factories", () => {
    it("creates a browser project without forcing a branded channel", () => {
        expect.assertions(9);

        const project = createBrowserProject({
            environment: {
                PLAYWRIGHT_CHROMIUM_ARGS: "--disable-dev-shm-usage",
                PLAYWRIGHT_HEADLESS: "true",
                PLAYWRIGHT_SLOWMO: "12",
            },
            grep: /smoke/v,
            grepInvert: /flaky/v,
            metadata: { owner: "desktop" },
            name: "smoke",
            testMatch: "**/*.smoke.spec.ts",
            timeout: 45_000,
            use: {
                launchOptions: { args: ["--consumer-override"] },
                locale: "en-CA",
            },
            workers: 4,
        });

        expect(project.name).toBe("smoke");
        expect(project.use?.headless).toBe(true);
        expect(project.use?.locale).toBe("en-CA");
        expect(project.use).not.toHaveProperty("channel");
        expect(project.grep).toStrictEqual(/smoke/v);
        expect(project.grepInvert).toStrictEqual(/flaky/v);
        expect(project.metadata).toStrictEqual({
            owner: "desktop",
            scope: "browser",
        });
        expect(project.timeout).toBe(45_000);
        expect(project.workers).toBe(4);
    });

    it("keeps Electron projects free of browser-only device settings", () => {
        expect.assertions(4);

        const project = createElectronProject({
            layer: "main",
            name: "electron-main",
            testMatch: "**/*.electron.spec.ts",
        });

        expect(project.metadata).toStrictEqual({
            layer: "main",
            scope: "electron",
        });
        expect(project.workers).toBe(1);
        expect(project).not.toHaveProperty("use");
        expect(createElectronProjects()).toHaveLength(3);
    });

    it("offers a conventional cross-browser project set", () => {
        expect.assertions(1);
        expect(
            createCrossBrowserProjects().map(({ name }) => name)
        ).toStrictEqual([
            "chromium",
            "firefox",
            "webkit",
        ]);
    });

    it("rejects empty project names", () => {
        expect.assertions(2);
        expect(() => createBrowserProject({ name: "" })).toThrow(TypeError);
        expect(() =>
            createElectronProject({
                layer: "e2e",
                name: " ",
                testMatch: "**/*.spec.ts",
            })
        ).toThrow(TypeError);
    });
});

describe("root configuration", () => {
    it("creates explicit CI fragments", () => {
        expect.assertions(2);

        expect(createCiPlaywrightConfig()).toStrictEqual({
            forbidOnly: true,
            fullyParallel: true,
            retries: 2,
            workers: 2,
        });
        expect(
            createCiPlaywrightConfig({
                forbidOnly: false,
                fullyParallel: false,
                retries: 0,
                workers: "50%",
            })
        ).toStrictEqual({
            forbidOnly: false,
            fullyParallel: false,
            retries: 0,
            workers: "50%",
        });
    });

    it("composes paths, projects, and nested overrides", () => {
        expect.assertions(8);

        const projects = createElectronProjects();
        const config = createPlaywrightConfig({
            environment: { CI: "true" },
            globalSetup: "./fixtures/setup.ts",
            globalTeardown: "./fixtures/teardown.ts",
            overrides: {
                expect: { timeout: 99 },
                use: { locale: "en-US" },
            },
            projects,
            testDir: "tests/e2e",
            testIgnore: "**/*.manual.spec.ts",
            testMatch: "**/*.spec.ts",
            tsconfig: "./tsconfig.e2e.json",
        });

        expect(config.testDir).toBe("tests/e2e");
        expect(config.globalSetup).toBe("./fixtures/setup.ts");
        expect(config.globalTeardown).toBe("./fixtures/teardown.ts");
        expect(config.projects).toHaveLength(3);
        expect(config.expect?.timeout).toBe(99);
        expect(config.use?.locale).toBe("en-US");
        expect(config.testIgnore).toBe("**/*.manual.spec.ts");
        expect(config.testMatch).toBe("**/*.spec.ts");
    });

    it("replaces arrays instead of concatenating them", () => {
        expect.assertions(1);

        const merged = mergePlaywrightConfig(
            { projects: [{ name: "base" }] },
            { projects: [{ name: "replacement" }] }
        );

        expect(merged.projects?.map(({ name }) => name)).toStrictEqual([
            "replacement",
        ]);
    });

    it("loads the built package through the real Playwright CLI", () => {
        expect.assertions(4);

        const fixtureRoot = fileURLToPath(
            new URL("fixtures/playwright", import.meta.url)
        );
        const cliPath = fileURLToPath(
            new URL("../node_modules/@playwright/test/cli.js", import.meta.url)
        );
        const configPath = path.join(fixtureRoot, "playwright.config.mjs");
        const result = spawnSync(
            process.execPath,
            [
                cliPath,
                "test",
                "--config",
                configPath,
                "--list",
            ],
            { cwd: fixtureRoot, encoding: "utf8" }
        );

        expect(result.error).toBeUndefined();
        expect(result.status).toBe(0);
        expect(result.stdout).toContain("consumer smoke test");
        expect(result.stderr).not.toContain("Cannot find module");
    });
});
