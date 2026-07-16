/**
 * Composable Playwright Test configuration factories.
 *
 * @packageDocumentation
 */

import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";
import { isDefined } from "ts-extras";

import {
    type BasePlaywrightConfigOptions,
    createBasePlaywrightConfig,
    mergePlaywrightConfig,
} from "./base.js";

export * from "./base.js";
export * from "./browser.js";
export * from "./ci.js";
export * from "./electron.js";
export * from "./env.js";

/** Options for the root Playwright configuration factory. */
export interface SharedPlaywrightConfigOptions extends BasePlaywrightConfigOptions {
    readonly globalSetup?: PlaywrightTestConfig["globalSetup"];
    readonly globalTeardown?: PlaywrightTestConfig["globalTeardown"];
    readonly overrides?: PlaywrightTestConfig;
    readonly projects?: PlaywrightTestConfig["projects"];
    readonly testIgnore?: PlaywrightTestConfig["testIgnore"];
    readonly testMatch?: PlaywrightTestConfig["testMatch"];
    readonly tsconfig?: string;
}

/** Create a complete Playwright config with explicit consumer-owned paths. */
export function createPlaywrightConfig(
    options: SharedPlaywrightConfigOptions = {}
): PlaywrightTestConfig {
    const base = createBasePlaywrightConfig(options);
    const configured: PlaywrightTestConfig = {
        ...base,
        ...(isDefined(options.globalSetup) && {
            globalSetup: options.globalSetup,
        }),
        ...(isDefined(options.globalTeardown) && {
            globalTeardown: options.globalTeardown,
        }),
        ...(isDefined(options.projects) && {
            projects: [...options.projects],
        }),
        ...(isDefined(options.testIgnore) && {
            testIgnore: options.testIgnore,
        }),
        ...(isDefined(options.testMatch) && {
            testMatch: options.testMatch,
        }),
        ...(isDefined(options.tsconfig) && { tsconfig: options.tsconfig }),
    };

    return defineConfig(
        isDefined(options.overrides)
            ? mergePlaywrightConfig(configured, options.overrides)
            : configured
    );
}

export default createPlaywrightConfig;
