import type { UnknownRecord } from "type-fest";

import type { PlaywrightProject } from "./base.js";

/** Options for one Electron test project. */
export interface ElectronProjectOptions {
    readonly layer: ElectronTestLayer;
    readonly metadata?: Readonly<UnknownRecord>;
    readonly name: string;
    readonly testMatch: NonNullable<PlaywrightProject["testMatch"]>;
    readonly timeout?: number;
    readonly workers?: number;
}

/** Logical layer exercised by an Electron Playwright project. */
export type ElectronTestLayer =
    | "e2e"
    | "main"
    | "renderer";

/**
 * Create an Electron project without applying browser-only device settings.
 *
 * @throws When the project name is empty.
 */
export function createElectronProject(
    options: ElectronProjectOptions
): PlaywrightProject {
    if (!options.name.trim()) {
        throw new TypeError("A Playwright project name must not be empty.");
    }

    return {
        fullyParallel: false,
        metadata: {
            layer: options.layer,
            scope: "electron",
            ...options.metadata,
        },
        name: options.name,
        testMatch: options.testMatch,
        timeout: options.timeout ?? 45_000,
        workers: options.workers ?? 1,
    };
}

/** Create conventional main, renderer, and application-launch Electron projects. */
export function createElectronProjects(): PlaywrightProject[] {
    return [
        createElectronProject({
            layer: "main",
            name: "electron-main",
            testMatch: "**/main-process.*.playwright.test.ts",
        }),
        createElectronProject({
            layer: "renderer",
            name: "electron-renderer",
            testMatch: "**/renderer-process.*.playwright.test.ts",
        }),
        createElectronProject({
            layer: "e2e",
            name: "electron-e2e",
            testMatch: "**/app-launch.*.playwright.test.ts",
            timeout: 60_000,
        }),
    ];
}

export default createElectronProject;
