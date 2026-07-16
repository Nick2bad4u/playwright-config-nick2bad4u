import {
    createBrowserProject,
    createPlaywrightConfig,
} from "../../../dist/playwright-config.js";

export default createPlaywrightConfig({
    environment: {},
    projects: [
        createBrowserProject({
            environment: {},
            name: "chromium",
        }),
    ],
    testDir: "./tests",
});
