import { expect, test } from "@playwright/test";

test("consumer smoke test", () => {
    expect(test.info().project.name).toBe("chromium");
});
