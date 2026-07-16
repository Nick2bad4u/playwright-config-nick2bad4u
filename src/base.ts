import type { PlaywrightTestConfig } from "@playwright/test";
import type { ArrayElement } from "type-fest";

import { isDefined } from "ts-extras";

import {
    type PlaywrightEnvironment,
    type ResolvedPlaywrightEnvironment,
    resolvePlaywrightEnvironment,
} from "./env.js";

/** Options for the portable base Playwright configuration. */
export interface BasePlaywrightConfigOptions {
    readonly environment?: PlaywrightEnvironment;
    readonly expectTimeout?: number;
    readonly outputDir?: string;
    readonly reporter?: PlaywrightTestConfig["reporter"];
    readonly testDir?: string;
    readonly testIdAttribute?: string;
    readonly timeout?: number;
}

/** One item in Playwright's project array. */
export type PlaywrightProject = ArrayElement<
    NonNullable<PlaywrightTestConfig["projects"]>
>;

/** Create conservative Playwright defaults with no repository-specific modules. */
export function createBasePlaywrightConfig(
    options: BasePlaywrightConfigOptions = {}
): PlaywrightTestConfig {
    const environment = resolvePlaywrightEnvironment(options.environment);
    const launchOptions = {
        args: [...environment.launchArgs],
        ...(isDefined(environment.slowMo) && {
            slowMo: environment.slowMo,
        }),
    };

    return {
        expect: { timeout: options.expectTimeout ?? 10_000 },
        forbidOnly: environment.isCi,
        outputDir: options.outputDir ?? "playwright/test-results",
        reporter:
            options.reporter ??
            ([
                ["html", { open: "never", outputFolder: "playwright-report" }],
                ["list"],
            ] as const),
        retries: environment.isCi ? 2 : 0,
        testDir: options.testDir ?? "playwright/tests",
        timeout: options.timeout ?? 30_000,
        use: {
            headless: environment.headless,
            launchOptions,
            screenshot: environment.attachmentsEnabled
                ? "only-on-failure"
                : "off",
            testIdAttribute: options.testIdAttribute ?? "data-testid",
            trace: environment.attachmentsEnabled ? "on-first-retry" : "off",
            video: environment.attachmentsEnabled ? "retain-on-failure" : "off",
        },
        workers: environment.totalWorkers,
    };
}

/**
 * Merge two configs while preserving nested `expect` and `use` options. Arrays
 * replace.
 */
export function mergePlaywrightConfig(
    base: PlaywrightTestConfig,
    overrides: PlaywrightTestConfig
): PlaywrightTestConfig {
    const hasExpect = isDefined(base.expect) || isDefined(overrides.expect);
    const hasLaunchOptions =
        isDefined(base.use?.launchOptions) ||
        isDefined(overrides.use?.launchOptions);
    const hasUse = isDefined(base.use) || isDefined(overrides.use);

    return {
        ...base,
        ...overrides,
        ...(hasExpect && {
            expect: { ...base.expect, ...overrides.expect },
        }),
        ...(hasUse && {
            use: {
                ...base.use,
                ...overrides.use,
                ...(hasLaunchOptions && {
                    launchOptions: {
                        ...base.use?.launchOptions,
                        ...overrides.use?.launchOptions,
                    },
                }),
            },
        }),
    };
}

/** Resolve environment policy for callers building custom project arrays. */
export function resolveBaseEnvironment(
    environment?: PlaywrightEnvironment
): ResolvedPlaywrightEnvironment {
    return resolvePlaywrightEnvironment(environment);
}

export default createBasePlaywrightConfig;
