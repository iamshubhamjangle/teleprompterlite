import { test, expect, type Page } from "@playwright/test";

async function setTransportSpeed(page: Page, speed: number) {
  const transport = page.locator(".transport-main").first();
  const current = Number((await transport.locator(".speed-value").innerText()).replace("×", "")) * 20;
  const name = speed > current ? "Increase speed" : "Decrease speed";
  for (let remaining = Math.abs(speed - current); remaining >= 5; remaining -= 5) {
    await transport.getByRole("button", { name, exact: true }).click();
  }
}
test.beforeEach(async ({ page }) => {
  await page.goto("/editor");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});
test("keyboard playback, cue jumps, native wheel scrolling and paused reload", async ({
  page,
}) => {
  const reader = page.getByLabel("Reading surface", { exact: true });
  await reader.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".cue-outline [aria-current] > span")).toHaveText(
    "02",
  );
  await reader.hover();
  const pausedTop = await reader.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => reader.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(pausedTop + 20);
  await expect(page.locator(".transport-main .speed-value")).toHaveText("2×");
  await page.keyboard.press("Space");
  const playingTop = await reader.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => reader.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(playingTop + 20);
  await expect(page.locator(".transport-main .speed-value")).toHaveText("2×");
  await page.keyboard.press("Space");
  await page.waitForTimeout(650);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".transport-main .speed-value")).toHaveText("2×");
});
test("pane handles control margins and zero clearance, hover panels preserve width", async ({
  page,
}) => {
  await page.getByRole("switch", { name: "Phone mode", exact: true }).click();
  const widthHandle = page
    .getByRole("button", { name: "Resize reading width", exact: true })
    .first();
  await widthHandle.focus();
  for (let i = 0; i < 12; i++) await widthHandle.press("ArrowRight");
  await expect(page.locator(".script-column")).toHaveAttribute(
    "style",
    /margin-left: 30%; margin-right: 30%/,
  );
  const heightHandle = page.getByRole("button", {
    name: "Resize reading height",
    exact: true,
  });
  await heightHandle.focus();
  for (let i = 0; i < 14; i++) await heightHandle.press("ArrowDown");
  await expect(page.getByText("Reserved for your phone")).toHaveCount(0);
  await page.getByRole("button", { name: "Collapse content panel" }).click();
  await page.mouse.move(750, 100);
  await page.waitForTimeout(400);
  const before = await page.locator(".script-column").boundingBox();
  await page.locator(".sidebar-left .sidebar-rail").hover();
  await expect(page.locator(".sidebar-left .sidebar-body")).toBeVisible();
  const after = await page.locator(".script-column").boundingBox();
  expect(after?.width).toBeCloseTo(before!.width, 1);
});
test("editor typing, safe Markdown, bookmarks and local draft", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit script", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Edit script" });
  await editor.fill(
    "First paragraph\n\nSecond **bold** paragraph\n\n<script>alert(1)</script>",
  );
  await editor.press("End");
  await editor.press("Space");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Save", exact: true })
    .last()
    .click();
  await expect(page.locator(".script-column strong")).toHaveText("bold");
  await page.locator(".line-bookmark").first().click({ force: true });
  await page.waitForTimeout(650);
  await page.reload();
  await expect(page.locator(".script-column")).toContainText(
    "Second bold paragraph",
  );
  await expect(page.locator(".stage-bookmark")).toHaveCount(1);
});
test("configuration is atomic and undoable", async ({ page }) => {
  await page
    .locator(".panel-tabs")
    .getByRole("button", { name: "Layout", exact: true })
    .click();
  const input = page.locator('input[type="file"]').nth(1);
  await input.setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Invalid configuration" }),
  ).toBeVisible();
  await page.waitForTimeout(650);
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("teleprompter-pro:preferences:v1")!)
        .settings,
  );
  await input.setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        app: "teleprompter-pro",
        version: 1,
        theme: "light",
        settings: { ...stored, height: 100, speed: 75 },
      }),
    ),
  });
  await page
    .getByRole("button", { name: "Apply configuration", exact: true })
    .click();
  await expect(page.locator(".transport-main .speed-value")).toHaveText("3.75×");
  await page.getByRole("button", { name: "Undo configuration import" }).click();
  await expect(page.locator(".transport-main .speed-value")).toHaveText("2×");
});
test("popup owns playback and closing it recovers workspace", async ({
  page,
}) => {
  const outputPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open popup reader" }).first().click();
  const output = await outputPromise;
  await expect(output.locator(".script-column")).toContainText(
    "Your next great take",
  );
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    output.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => output.locator(".reading-viewport").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(5);
  await output.close();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});
test("desktop/mobile have no overflow and settings open on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".mobile-navigation").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Font size", exact: true }),
  ).toBeVisible();
});

test("whole-paragraph Markdown preserves multiline emphasis and ordered lists", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit script", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Edit script" })
    .fill("**First line\nsecond line**\n\n1. One\n2. Two");
  await page
    .getByRole("button", { name: "Save", exact: true })
    .last()
    .click();
  await expect(page.locator(".script-column strong")).toContainText(
    "second line",
  );
  await expect(page.locator(".script-column ol")).toHaveCount(1);
  await expect(page.locator(".script-column ol li")).toHaveCount(2);
  await expect(page.locator(".line-bookmark")).toHaveCount(2);
});
test("revealed panel retains focus, Escape dismisses, touch-equivalent toggle closes", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Collapse settings panel" }).click();
  await page.mouse.move(600, 100);
  await page.locator(".sidebar-right .sidebar-rail").hover();
  await page
    .getByRole("spinbutton", { name: "Font size", exact: true })
    .focus();
  await page.mouse.move(600, 100);
  await page.waitForTimeout(400);
  await expect(page.locator(".sidebar-right .sidebar-body")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar-right .sidebar-body")).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Reading surface", { exact: true }).focus();
  const navigation = page.locator(".mobile-navigation");
  await navigation.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator(".sidebar-right .sidebar-body")).toBeVisible();
  await navigation.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.locator(".sidebar-right .sidebar-body")).not.toBeVisible();
});
test("fullscreen fallback preserves bookmark preferences and Escape restores workspace", async ({
  page,
}) => {
  await page.locator(".line-bookmark").first().click();
  await page.evaluate(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      value: undefined,
      configurable: true,
    });
  });
  await page.getByLabel("Reading surface", { exact: true }).focus();
  await page.keyboard.press("f");
  await expect(page.locator(".fallback-reading")).toBeVisible();
  await expect(page.locator(".fallback-reading .line-bookmark")).toHaveCount(0);
  await expect(page.locator(".fallback-reading .stage-bookmark")).toHaveCount(1);
  await expect(page.locator(".fallback-reading .phone-clearance")).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".fallback-reading")).toHaveCount(0);
});

test("height and font changes preserve the active reading anchor", async ({
  page,
}) => {
  await page.getByRole("switch", { name: "Phone mode", exact: true }).click();
  const reader = page.getByLabel("Reading surface", { exact: true });
  await reader.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".cue-outline [aria-current] > span")).toHaveText(
    "02",
  );
  await page
    .getByRole("spinbutton", { name: "Font size", exact: true })
    .fill("48");
  const heightHandle = page.getByRole("button", {
    name: "Resize reading height",
    exact: true,
  });
  for (let i = 0; i < 11; i++) await heightHandle.press("ArrowUp");
  await page.waitForTimeout(200);
  await expect(page.locator(".cue-outline [aria-current] > span")).toHaveText(
    "02",
  );
  const distance = await page.locator(".reading-viewport").evaluate((el) => {
    const line = el.querySelector<HTMLElement>(".cue-active [data-anchor]")!;
    return Math.abs(
      line.getBoundingClientRect().top -
        (el.getBoundingClientRect().top + el.clientHeight * 0.35),
    );
  });
  expect(distance).toBeLessThan(12);
});
test("corrupt preferences never overwrite a valid saved script", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("teleprompter-pro:preferences:v1", "broken json");
    localStorage.setItem(
      "teleprompter-pro:draft:v1",
      JSON.stringify({
        version: 1,
        title: "Saved draft",
        lines: [{ id: "saved-line", text: "Important take" }],
        bookmarks: [],
        anchor: null,
      }),
    );
  });
  await page.reload();
  await expect(page.locator(".script-column")).toContainText("Important take");
  await expect(
    page.getByRole("status").filter({ hasText: "your script is kept" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});
test("a 10000-word script remains playable", async ({ page }) => {
  const longScript = Array.from({ length: 100 }, (_, i) => ({
    id: `long-line-${i}`,
    text:
      `Paragraph ${i + 1}. ` +
      "Read comfortably near the camera lens. ".repeat(17),
  })).flatMap((line) => [line, { id: `blank-${line.id}`, text: "" }]);
  await page.addInitScript(
    (lines) =>
      localStorage.setItem(
        "teleprompter-pro:draft:v1",
        JSON.stringify({
          version: 1,
          title: "Long script",
          lines,
          bookmarks: [],
          anchor: null,
        }),
      ),
    longScript,
  );
  await page.reload();
  await expect(page.locator(".script-cue")).toHaveCount(100);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(500);
  expect(
    await page.locator(".reading-viewport").evaluate((el) => el.scrollTop),
  ).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
});

for (const speed of [5, 10, 25]) {
  test(`slow playback moves at ${speed} px/s in workspace and popup`, async ({
    page,
  }) => {
    await setTransportSpeed(page, speed);
    const reader = page.getByLabel("Reading surface", { exact: true });
    await page.getByRole("button", { name: "Play", exact: true }).click();
    const start = await reader.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1000);
    const delta = (await reader.evaluate((el) => el.scrollTop)) - start;
    expect(delta).toBeGreaterThan(speed * 0.5);
    expect(delta).toBeLessThan(speed * 1.8);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const outputPromise = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Open popup reader" })
      .first()
      .click();
    const output = await outputPromise;
    const outputReader = output.getByLabel("Reading surface", { exact: true });
    await expect(outputReader).toBeVisible();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(
      output.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
    const outputStart = await outputReader.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1000);
    expect(
      (await outputReader.evaluate((el) => el.scrollTop)) - outputStart,
    ).toBeGreaterThan(speed * 0.5);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await outputReader.hover();
    const pausedStart = await outputReader.evaluate((el) => el.scrollTop);
    await output.mouse.wheel(0, 120);
    await expect
      .poll(() => outputReader.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(pausedStart + 20);
    await expect(page.locator(".transport-main .speed-value")).toHaveText(String(speed / 20) + "×");
    await output.close();
  });
}
test("sidebar tools reclaim the navbar, match theme accents, and expose settings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Workspace", { exact: true })).toHaveCount(0);
  const primary = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    );
  expect(await primary()).toBe("#226d4c");
  await page.getByRole("button", { name: "Toggle light / dark theme" }).click();
  expect(await primary()).toBe("#226d4c");
  await page.screenshot({
    path: ".impeccable/review/desktop-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle light / dark theme" }).click();
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  const phoneMode = page.getByRole("switch", { name: "Phone mode", exact: true });
  await phoneMode.scrollIntoViewIfNeeded();
  await expect(phoneMode).toBeVisible();
  await page.getByRole("button", { name: "Collapse settings panel" }).click();
  await page.getByLabel("Reading surface", { exact: true }).focus();
  await page.mouse.move(600, 300);
  await page.waitForTimeout(400);
  await expect(page.locator(".sidebar-right .rail-toggle svg")).toHaveClass(
    /tabler-icon-layout-sidebar-left-collapse/,
  );
  await page.locator(".sidebar-right .sidebar-rail").hover();
  await page
    .locator(".sidebar-right .panel-actions")
    .getByRole("button", { name: "Keyboard shortcuts" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Mouse wheel: scroll script",
  );
});

test("fixed tabs, simplified script actions, and output geometry", async ({
  page,
}) => {
  await page.getByRole("switch", { name: "Phone mode", exact: true }).click();
  await expect(
    page.locator(".stage-heading, .reader-footer, #script-title"),
  ).toHaveCount(0);
  await expect(
    page.locator(".sidebar-left .panel-scroll .panel-tabs"),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".transport-main")
      .getByRole("button", { name: "Open popup reader" }),
  ).toBeVisible();
  await page
    .locator(".panel-tabs")
    .getByRole("button", { name: "Layout", exact: true })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "Left margin", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("spinbutton", { name: "Reading height", exact: true }),
  ).toHaveCount(0);
  await page.locator(".line-bookmark").first().click({ force: true });
  await page.evaluate(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      value: undefined,
      configurable: true,
    });
  });
  await page.getByLabel("Reading surface", { exact: true }).focus();
  await page.keyboard.press("f");
  const output = page.locator(".fallback-reading");
  await expect(output.locator(".stage-bookmark")).toHaveCount(1);
  await output
    .getByRole("button", { name: "Resize reading height", exact: true })
    .press("ArrowUp");
  await expect(output.locator(".reader-top")).toHaveAttribute(
    "style",
    /height: 70%/,
  );
  await output
    .getByRole("button", { name: "Resize reading width", exact: true })
    .first()
    .press("ArrowRight");
  await expect(output.locator(".script-column")).toHaveAttribute(
    "style",
    /margin-left: 19%; margin-right: 19%/,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(650);
  await page.reload();
  await expect(page.locator(".script-column")).toHaveAttribute(
    "style",
    /margin-left: 19%; margin-right: 19%/,
  );
});

test("selected script text can be formatted and empty reader opens editing", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit script", exact: true }).click();
  const editor = page.getByRole("textbox", {
    name: "Edit script",
    exact: true,
  });
  await editor.fill("Hello camera");
  await editor.evaluate((el) => {
    const field = el as HTMLTextAreaElement;
    field.focus();
    field.setSelectionRange(0, 5);
    field.dispatchEvent(new Event("select", { bubbles: true }));
  });
  await editor.press("Shift");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(editor).toHaveValue("**Hello** camera");
  await editor.fill("");
  await page
    .getByRole("button", { name: "Save", exact: true })
    .last()
    .click();
  await page
    .locator(".reader-empty")
    .getByRole("button", { name: "New script", exact: true })
    .click();
  await expect(editor).toBeFocused();
});
