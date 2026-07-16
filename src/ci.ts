import type { PlaywrightTestConfig } from "@playwright/test";

/** Explicit CI policy overrides. */
export interface CiPlaywrightConfigOptions {
    readonly forbidOnly?: boolean;
    readonly fullyParallel?: boolean;
    readonly retries?: number;
    readonly workers?: number | string;
}

/** Create a small CI fragment that callers can merge into their base config. */
export function createCiPlaywrightConfig(
    options: CiPlaywrightConfigOptions = {}
): PlaywrightTestConfig {
    return {
        forbidOnly: options.forbidOnly ?? true,
        fullyParallel: options.fullyParallel ?? true,
        retries: options.retries ?? 2,
        workers: options.workers ?? 2,
    };
}

export default createCiPlaywrightConfig;
