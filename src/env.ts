import { arrayIncludes, isDefined, isSafeInteger, setHas } from "ts-extras";

/** Read-only environment input accepted by the configuration factories. */
export type PlaywrightEnvironment = Readonly<
    Record<string, string | undefined>
>;

/** Normalized environment-dependent Playwright policy. */
export interface ResolvedPlaywrightEnvironment {
    readonly attachmentsEnabled: boolean;
    readonly browserWorkers: number;
    readonly headless: boolean;
    readonly isCi: boolean;
    readonly launchArgs: readonly string[];
    readonly slowMo: number | undefined;
    readonly totalWorkers: number;
}

const TRUE_VALUES = new Set([
    "1",
    "on",
    "true",
    "yes",
]);

type LaunchArgumentQuote = "'" | '"';

/** Test the conventional truthy environment spellings used by CI systems. */
export function isBooleanFlagEnabled(value: string | undefined): boolean {
    return isDefined(value)
        ? setHas(TRUE_VALUES, value.trim().toLowerCase())
        : false;
}

/**
 * Split a command-line argument string without invoking a shell.
 *
 * Supports single/double quotes and escaping a quote, backslash, or whitespace.
 * An unterminated quote is rejected instead of silently changing launch
 * policy.
 *
 * @throws When the argument string has an unterminated quote.
 */
export function parseLaunchArguments(value: string | undefined): string[] {
    if (!isDefined(value) || value.trim() === "") {
        return [];
    }

    const result: string[] = [];
    let current = "";
    let quote: LaunchArgumentQuote | undefined;
    let skipNextCharacter = false;

    for (let index = 0; index < value.length; index += 1) {
        if (skipNextCharacter) {
            skipNextCharacter = false;
            continue;
        }

        const character = value[index];
        if (!isDefined(character)) {
            continue;
        }

        if (character === "\\") {
            const [escapedCharacter, consumesNextCharacter] =
                readEscapedLaunchCharacter(value, index);
            current += escapedCharacter;
            skipNextCharacter = consumesNextCharacter;
            continue;
        }

        if (isLaunchArgumentQuote(character)) {
            const [nextQuote, literalCharacter] = readLaunchArgumentQuote(
                character,
                quote
            );
            quote = nextQuote;
            current += literalCharacter;
            continue;
        }

        if (isLaunchArgumentSeparator(character, quote)) {
            current = pushLaunchArgument(result, current);
            continue;
        }

        current += character;
    }

    if (isDefined(quote)) {
        throw new RangeError("Unterminated quote in PLAYWRIGHT_CHROMIUM_ARGS.");
    }

    pushLaunchArgument(result, current);

    return result;
}

/**
 * Parse an optional non-negative integer such as Playwright's slow-motion
 * delay.
 */
export function parseNonNegativeInteger(
    value: string | undefined
): number | undefined {
    if (value === "" || !isDefined(value) || !/^\d+$/v.test(value)) {
        return undefined;
    }

    const parsed = Number(value);
    return isSafeInteger(parsed) ? parsed : undefined;
}

/**
 * Parse a strictly positive integer, falling back when input is absent or
 * invalid.
 */
export function parsePositiveInteger(
    value: string | undefined,
    fallback: number
): number {
    if (value === "" || !isDefined(value) || !/^\d+$/v.test(value)) {
        return fallback;
    }

    const parsed = Number(value);
    return isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Resolve all supported Playwright environment variables without mutating them. */
export function resolvePlaywrightEnvironment(
    // eslint-disable-next-line n/no-process-env -- callers may omit an environment to use the current process policy
    environment: PlaywrightEnvironment = process.env
): ResolvedPlaywrightEnvironment {
    const isCi = isBooleanFlagEnabled(environment["CI"]);
    const defaultWorkers = isCi ? 2 : 1;
    const launchArgs = parseLaunchArguments(
        environment["PLAYWRIGHT_CHROMIUM_ARGS"]
    );

    if (
        isBooleanFlagEnabled(environment["PLAYWRIGHT_DISABLE_GPU"]) &&
        !arrayIncludes(launchArgs, "--disable-gpu")
    ) {
        launchArgs.push("--disable-gpu");
    }

    return Object.freeze({
        attachmentsEnabled: isBooleanFlagEnabled(
            environment["PLAYWRIGHT_ENABLE_ATTACHMENTS"]
        ),
        browserWorkers: parsePositiveInteger(
            environment["PLAYWRIGHT_UI_WORKERS"],
            defaultWorkers
        ),
        headless:
            isCi || isBooleanFlagEnabled(environment["PLAYWRIGHT_HEADLESS"]),
        isCi,
        launchArgs: Object.freeze([...launchArgs]),
        slowMo: parseNonNegativeInteger(environment["PLAYWRIGHT_SLOWMO"]),
        totalWorkers: parsePositiveInteger(
            environment["PLAYWRIGHT_WORKERS"],
            defaultWorkers
        ),
    });
}

function isEscapableLaunchCharacter(
    character: string | undefined
): character is string {
    return isDefined(character) && /[\s"'\\]/v.test(character);
}

function isLaunchArgumentQuote(
    character: string
): character is LaunchArgumentQuote {
    return character === '"' || character === "'";
}

function isLaunchArgumentSeparator(
    character: string,
    activeQuote: LaunchArgumentQuote | undefined
): boolean {
    return !isDefined(activeQuote) && /\s/v.test(character);
}

function pushLaunchArgument(result: string[], current: string): "" {
    if (current !== "") {
        result.push(current);
    }

    return "";
}

function readEscapedLaunchCharacter(
    value: string,
    index: number
): readonly [character: string, consumesNextCharacter: boolean] {
    const next = value[index + 1];
    return isEscapableLaunchCharacter(next) ? [next, true] : ["\\", false];
}

function readLaunchArgumentQuote(
    character: LaunchArgumentQuote,
    activeQuote: LaunchArgumentQuote | undefined
): readonly [
    activeQuote: LaunchArgumentQuote | undefined,
    literalCharacter: string,
] {
    if (activeQuote === character) {
        return [undefined, ""];
    }

    return isDefined(activeQuote) ? [activeQuote, character] : [character, ""];
}

export default resolvePlaywrightEnvironment;
