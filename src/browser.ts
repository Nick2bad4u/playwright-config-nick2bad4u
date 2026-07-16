import type { UnknownRecord } from "type-fest";

import { devices, type PlaywrightTestConfig } from "@playwright/test";
import { isDefined } from "ts-extras";

import type { PlaywrightProject } from "./base.js";

import {
    type PlaywrightEnvironment,
    resolvePlaywrightEnvironment,
} from "./env.js";

/** Options for one reusable browser project. */
export interface BrowserProjectOptions {
    readonly device?: PlaywrightDeviceName;
    readonly environment?: PlaywrightEnvironment;
    readonly grep?: RegExp;
    readonly grepInvert?: RegExp;
    readonly metadata?: Readonly<UnknownRecord>;
    readonly name: string;
    readonly testMatch?: PlaywrightProject["testMatch"];
    readonly timeout?: number;
    readonly use?: PlaywrightProject["use"];
    readonly workers?: number;
}

/** A device descriptor name published by the installed Playwright version. */
export type PlaywrightDeviceName = keyof typeof devices;

const assertName = (name: string): void => {
    if (!name.trim()) {
        throw new TypeError("A Playwright project name must not be empty.");
    }
};

/** Create a browser project while retaining caller-supplied `use` overrides. */
export function createBrowserProject(
    options: BrowserProjectOptions
): PlaywrightProject {
    assertName(options.name);
    const environment = resolvePlaywrightEnvironment(options.environment);
    const descriptor = devices[options.device ?? "Desktop Chrome"];

    return {
        fullyParallel: true,
        ...(isDefined(options.grep) && { grep: options.grep }),
        ...(isDefined(options.grepInvert) && {
            grepInvert: options.grepInvert,
        }),
        metadata: { scope: "browser", ...options.metadata },
        name: options.name,
        ...(isDefined(options.testMatch) && {
            testMatch: options.testMatch,
        }),
        ...(isDefined(options.timeout) && { timeout: options.timeout }),
        use: {
            ...descriptor,
            headless: environment.headless,
            ...options.use,
            launchOptions: {
                args: [...environment.launchArgs],
                ...(isDefined(environment.slowMo) && {
                    slowMo: environment.slowMo,
                }),
                ...options.use?.launchOptions,
            },
        },
        workers: options.workers ?? environment.browserWorkers,
    };
}

/** Create Chromium, Firefox, and WebKit desktop projects. */
export function createCrossBrowserProjects(
    environment?: PlaywrightEnvironment
): NonNullable<PlaywrightTestConfig["projects"]> {
    const environmentOption = isDefined(environment) ? { environment } : {};

    return [
        createBrowserProject({
            device: "Desktop Chrome",
            ...environmentOption,
            name: "chromium",
        }),
        createBrowserProject({
            device: "Desktop Firefox",
            ...environmentOption,
            name: "firefox",
        }),
        createBrowserProject({
            device: "Desktop Safari",
            ...environmentOption,
            name: "webkit",
        }),
    ];
}

export default createBrowserProject;
