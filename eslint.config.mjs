import nickTwoBadFourU from "eslint-config-nick2bad4u";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...nickTwoBadFourU.configs.all,
    {
        files: ["src/**/*.ts"],
        rules: {
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
            "eslint-plugin/prefer-message-ids": "off",
            "eslint-plugin/prefer-object-rule": "off",
            "eslint-plugin/require-meta-docs-description": "off",
            "eslint-plugin/require-meta-docs-recommended": "off",
            "eslint-plugin/require-meta-docs-url": "off",
            "eslint-plugin/require-meta-schema": "off",
            "eslint-plugin/require-meta-type": "off",
        },
    },
    {
        files: ["src/playwright-config.ts"],
        rules: {
            "canonical/no-re-export": "off",
            "no-barrel-files/no-barrel-files": "off",
        },
    },
];

export default config;
