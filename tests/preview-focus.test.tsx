import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Workspace } from "@/components/workspace";
import { defaults, DRAFT_KEY, reconcileLines, SETTINGS_KEY } from "@/lib/model";
import { s } from "@/content/strings.en";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe() { this.callback(); }
    disconnect() {}
  });
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true, value: () => new DOMRect(0, 0, 100, 20),
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    version: 1, settings: { ...defaults, countdown: false },
  }));
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    version: 1, title: "Take", lines: reconcileLines("Hello camera"), bookmarks: [], anchor: null,
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  s.mirror, s.outputBookmarks, s.preserveClearance, s.focus, s.guide,
  s.countdownLabel, s.wakeLock,
])("keeps %s unchanged when Space starts and pauses playback after toggling it", async (label) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    version: 1, settings: { ...defaults, countdown: false, wakeLock: true },
  }));
  const user = userEvent.setup();
  render(<Workspace />);
  const option = screen.getByRole("switch", { name: label });
  const original = option.getAttribute("aria-checked");
  await user.click(option);
  const selected = option.getAttribute("aria-checked");
  expect(selected).not.toBe(original);
  expect(document.activeElement).toBe(option);

  await user.keyboard("[Space>3/]");
  expect(screen.getByRole("button", { name: s.pause })).toBeTruthy();
  expect(option.getAttribute("aria-checked")).toBe(selected);
  expect(document.activeElement).toBe(option);

  await user.keyboard("[Space]");
  expect(screen.getByRole("button", { name: s.play })).toBeTruthy();
  expect(option.getAttribute("aria-checked")).toBe(selected);
});

it("lets Space toggle a focused preview option when shortcuts are disabled", async () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    version: 1, settings: { ...defaults, shortcuts: false },
  }));
  const user = userEvent.setup();
  render(<Workspace />);
  const option = screen.getByRole("switch", { name: s.mirror });
  await user.click(option);
  expect(option.getAttribute("aria-checked")).toBe("true");
  await user.keyboard("[Space]");
  expect(option.getAttribute("aria-checked")).toBe("false");
  expect(screen.getByRole("button", { name: s.play })).toBeTruthy();
});

it.each(["space", "button"])("starts playback with %s after leaving a text correction without inserting whitespace", async (trigger) => {
  const { container } = render(<Workspace />);
  const field = screen.getByRole("textbox", { name: s.editPreview });
  vi.spyOn(field, "getClientRects").mockReturnValue([
    new DOMRect(100, 100, 200, 40),
  ] as unknown as DOMRectList);
  fireEvent.pointerDown(field, { button: 0, clientX: 150, clientY: 120 });
  expect(document.activeElement).toBe(field);
  field.textContent = "Hello cameras";
  fireEvent.input(field);
  if (trigger === "space") {
    // Even a browser-retargeted click on the field is rejected outside its text box.
    fireEvent.pointerDown(field, { button: 0, clientX: 400, clientY: 120 });
    expect(document.activeElement).toBe(container.querySelector(".reading-viewport"));
    expect(fireEvent.keyDown(document.activeElement!, { key: " ", code: "Space" })).toBe(false);
  } else {
    const play = screen.getByRole("button", { name: s.play });
    expect(fireEvent.pointerDown(play, { button: 0 })).toBe(true);
    expect(field.getAttribute("contenteditable")).toBe("false");
    fireEvent.click(play);
  }
  expect(screen.getByRole("button", { name: s.pause })).toBeTruthy();
  expect(container.querySelector(".script-cue")?.textContent).toBe("Hello cameras");
  await waitFor(() => expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).lines[0].text)
    .toBe("Hello cameras"));
});
