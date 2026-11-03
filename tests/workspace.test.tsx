import { forwardRef, useImperativeHandle, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Workspace } from "@/components/workspace";
import { defaults, DRAFT_KEY, reconcileLines, SETTINGS_KEY, type Cue, type Settings } from "@/lib/model";
import type { PreviewEdit } from "@/lib/markdown";
import { s, SAMPLE_SCRIPT } from "@/content/strings.en";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));
vi.mock("@/components/reader", () => ({
  Reader: forwardRef(function MockReader(
    { settings, output, fullscreenControls, onFallbackFullscreen, onEditScript, onPreviewEdit, cues, playing, countdown }:
    { settings: Settings; output: boolean; fullscreenControls: ReactNode;
      onFallbackFullscreen: () => void; onEditScript: () => void; countdown: number | null;
      onPreviewEdit?: (edit: PreviewEdit) => void; cues: Cue[]; playing: boolean }, ref,
  ) {
    useImperativeHandle(ref, () => ({ restore: vi.fn(), jump: vi.fn(), getAnchor: () => null, fullscreen: onFallbackFullscreen }));
    return <div data-testid="reader" data-settings={JSON.stringify(settings)} data-countdown={countdown}>
      {output && fullscreenControls}
      <button onClick={onEditScript}>{s.edit}</button>
      {onPreviewEdit && !playing && countdown == null && cues[0] && (
        <span role="textbox" aria-label={s.editPreview} contentEditable="plaintext-only"
          suppressContentEditableWarning onInput={(event) => onPreviewEdit({
            lineId: cues[0].lines[0].id, start: 0, end: cues[0].lines[0].text.length,
            text: event.currentTarget.textContent ?? "", literal: false,
          })}>{cues[0].lines[0].text}</span>
      )}
    </div>;
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const readerSettings = (): Settings => JSON.parse(
  screen.getByTestId("reader").getAttribute("data-settings")!,
);
const nav = () => within(screen.getByRole("navigation", { name: s.mobileNavigation }));

describe("reader shortcuts and editing", () => {
  it("autosaves a preview correction without switching views or losing bookmark and anchor IDs", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const lines = reconcileLines("Opening camra\n\nClosing");
    const bookmarks = [{ id: "saved", lineId: lines[0].id, excerpt: "Opening camra", label: "Opening" }];
    const anchor = { lineId: lines[0].id, fraction: 0.5 };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, title: "Take", lines, bookmarks, anchor }));
    const { container } = render(<Workspace />);
    const reader = screen.getByTestId("reader");
    const field = screen.getByRole("textbox", { name: s.editPreview });
    field.focus();
    field.textContent = "Opening camera";
    fireEvent.input(field);
    fireEvent.keyDown(field, { key: "ArrowRight" });
    fireEvent.keyDown(field, { key: " ", code: "Space" });
    expect(readerSettings().fontSize).toBe(defaults.fontSize);
    expect(screen.getByTestId("reader")).toBe(reader);
    expect(container.querySelector(".editor-pane")).toBeNull();
    await waitFor(() => {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)!);
      expect(draft.lines[0]).toEqual({ ...lines[0], text: "Opening camera" });
      expect(draft.bookmarks).toEqual(bookmarks);
      expect(draft.anchor).toEqual(anchor);
    });
  });
  it.each([true, false])("opens Contact us from the header and copies email without navigation on mobile=%s", async (mobile) => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    try {
      const { container } = render(<Workspace />);
      if (mobile) fireEvent.click(nav().getByRole("button", { name: s.settings }));
      const header = within(container.querySelector(".sidebar-right .panel-header") as HTMLElement);
      fireEvent.click(header.getByRole("button", { name: s.contact }));
      const dialog = await screen.findByRole("dialog", { name: s.contact });
      expect(screen.queryByRole("button", { name: "About this teleprompter" })).toBeNull();
      expect(dialog.querySelector("a")).toBeNull();
      fireEvent.click(within(dialog).getByRole("button", { name: `${s.copyEmail}: ${s.contactEmail}` }));
      await waitFor(() => expect(within(dialog).getByRole("status").textContent).toBe(s.emailCopied));
      expect(writeText).toHaveBeenCalledWith(s.contactEmail);
      expect(screen.getByTestId("reader")).toBeTruthy();
      fireEvent.click(within(dialog).getByRole("button", { name: s.close }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: s.contact })).toBeNull());
    } finally {
      if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("uses horizontal arrows for bounded font size and yields to typing and resize controls", () => {
    render(<Workspace />);
    for (const [fontSize, key, expected] of [[36, "ArrowRight", 38], [18, "ArrowLeft", 18], [96, "ArrowRight", 96]] as const) {
      cleanup();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings: { ...defaults, fontSize } }));
      render(<Workspace />);
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      fireEvent(window, event);
      expect(event.defaultPrevented).toBe(true);
      expect(readerSettings().fontSize).toBe(expected);
    }
    const handle = document.createElement("button");
    handle.className = "width-handle";
    document.body.append(handle);
    try {
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      expect(readerSettings().fontSize).toBe(96);
    } finally { handle.remove(); }
    fireEvent.click(screen.getByRole("button", { name: s.edit }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: s.editor }), { key: "ArrowLeft" });
    expect(readerSettings().fontSize).toBe(96);
  });

  it.each([true, false])("opens editing from fallback fullscreen and saves the latest draft on mobile=%s", async (mobile) => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const { container } = render(<Workspace />);
    fireEvent.click(screen.getByRole("button", { name: s.fullscreen }));
    fireEvent.click(screen.getByRole("button", { name: s.edit }));
    const field = await screen.findByRole("textbox", { name: s.editor });
    expect(container.querySelector(".fallback-reading")).toBeNull();
    const pane = within(container.querySelector(".editor-pane") as HTMLElement);
    expect(pane.getByRole("button", { name: s.exportScript })).toBeTruthy();
    expect(pane.getByRole("button", { name: s.importScript })).toBeTruthy();
    fireEvent.click(pane.getByRole("button", { name: s.useSample }));
    expect((field as HTMLTextAreaElement).value).toBe(SAMPLE_SCRIPT);
    fireEvent.click(pane.getByRole("button", { name: s.new }));
    const blank = screen.getByRole("textbox", { name: s.editor });
    expect((blank as HTMLTextAreaElement).value).toBe("");
    fireEvent.change(blank, { target: { value: "Saved immediately" } });
    fireEvent.click(within(container.querySelector(".editor-pane") as HTMLElement).getByRole("button", { name: s.done }));
    expect(screen.queryByRole("textbox", { name: s.editor })).toBeNull();
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).lines.map((line: { text: string }) => line.text).join("\n")).toBe("Saved immediately");
  });

  it("waits for native fullscreen exit before mounting the editor", async () => {
    render(<Workspace />);
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.body });
    const exit = vi.fn(async () => { Reflect.deleteProperty(document, "fullscreenElement"); });
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exit });
    try {
      fireEvent.click(screen.getByRole("button", { name: s.edit }));
      await screen.findByRole("textbox", { name: s.editor });
      expect(exit).toHaveBeenCalledOnce();
    } finally {
      Reflect.deleteProperty(document, "fullscreenElement");
      Reflect.deleteProperty(document, "exitFullscreen");
    }
  });
});

describe("layout presets", () => {
  it.each([true, false])("restores the complete layout across preset changes on mobile=%s", (mobile) => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      version: 1,
      settings: { ...defaults, leftCollapsed: true, rightCollapsed: true, outputClearance: false, speed: 24 },
    }));
    const { container } = render(<Workspace />);
    if (mobile) fireEvent.click(nav().getByRole("button", { name: s.layout }));
    else fireEvent.click(within(container.querySelector(".sidebar-right .panel-tabs") as HTMLElement)
      .getByRole("button", { name: s.layout }));

    const expected = {
      phone: { leftMargin: 25, rightMargin: 25, height: 60, outputClearance: true, leftCollapsed: false, rightCollapsed: false },
      wide: { leftMargin: 8, rightMargin: 8, height: 100, outputClearance: false, leftCollapsed: false, rightCollapsed: false },
      clean: { leftMargin: 20, rightMargin: 20, height: 100, outputClearance: false, leftCollapsed: true, rightCollapsed: true },
    };
    // Exercise every transition, including reapplying the same preset.
    for (const from of ["phone", "wide", "clean"] as const) {
      for (const to of ["phone", "wide", "clean"] as const) {
        fireEvent.click(screen.getByRole("button", { name: s.presets[from] }));
        fireEvent.click(screen.getByRole("button", { name: s.presets[to] }));
        expect(readerSettings()).toMatchObject({ ...expected[to], linked: true, speed: 24 });
        expect(container.querySelector(".sidebar-left")?.classList.contains("is-collapsed"))
          .toBe(expected[to].leftCollapsed);
        expect(container.querySelector(".sidebar-right")?.classList.contains("is-collapsed"))
          .toBe(expected[to].rightCollapsed);
      }
    }
    if (mobile) fireEvent.click(nav().getByRole("button", { name: s.settings }));
    else fireEvent.click(within(container.querySelector(".sidebar-right .panel-tabs") as HTMLElement)
      .getByRole("button", { name: s.settings }));
    expect(screen.getByRole("switch", { name: "Phone mode" })).toBeTruthy();
    expect(screen.queryByText("Phone clearance")).toBeNull();
  });
});

describe("mobile workspace destinations", () => {
  it.each([true, false])("starts a blank script and clears the saved draft on mobile=%s", (mobile) => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const lines = reconcileLines("Old opening\n\nOld closing");
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 1,
      title: "Old title",
      lines,
      bookmarks: [{ id: "old-bookmark", lineId: lines[0].id, excerpt: "Old opening", label: "Old bookmark" }],
      anchor: { lineId: lines[2].id, fraction: 0.5 },
    }));
    const preferences = { ...defaults, speed: 24, fontSize: 48 };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings: preferences }));
    const { container } = render(<Workspace />);
    if (mobile) fireEvent.click(nav().getByRole("button", { name: s.script }));
    fireEvent.click(screen.getByRole("button", { name: s.newScript }));
    const editor = screen.getByRole("textbox", { name: s.editor }) as HTMLTextAreaElement;
    expect(editor.value).toBe("");
    expect(container.querySelector(mobile ? ".sidebar-left" : ".center-workspace")?.contains(editor)).toBe(true);
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual({
      version: 1, title: "", lines: [], bookmarks: [], anchor: null,
    });
    const pane = within(container.querySelector(".editor-pane") as HTMLElement);
    fireEvent.change(editor, { target: { value: "Fresh opening" } });
    fireEvent.click(pane.getByRole("button", { name: s.done }));
    expect(readerSettings()).toEqual(preferences);
    expect(screen.queryByRole("button", { name: /Old opening/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Fresh opening/ })).toBeTruthy();
    if (mobile) fireEvent.click(nav().getByRole("button", { name: s.bookmarkTab }));
    else fireEvent.click(container.querySelector(".panel-tabs button:nth-child(2)")!);
    expect(screen.getByText(s.bookmarkEmpty)).toBeTruthy();
  });
  it("plays, cancels countdown, and opens Settings from fallback fullscreen", async () => {
    const { container } = render(<Workspace />);
    fireEvent.click(screen.getByRole("button", { name: s.fullscreen }));
    const controls = within(container.querySelector(".mobile-fullscreen-controls") as HTMLElement);
    fireEvent.click(controls.getByRole("button", { name: s.play }));
    expect(screen.getByTestId("reader").getAttribute("data-countdown")).toBe("3");
    fireEvent.click(controls.getByRole("button", { name: s.pause }));
    expect(screen.getByTestId("reader").getAttribute("data-countdown")).toBeNull();
    fireEvent.click(controls.getByRole("button", { name: s.settings }));
    await waitFor(() => expect(container.querySelector(".mobile-fullscreen-controls")).toBeNull());
    expect(nav().getByRole("button", { name: s.settings }).getAttribute("aria-current")).toBe("page");
  });
  it("opens every destination and returns to the same mounted reader", () => {
    const { container } = render(<Workspace />);
    const reader = screen.getByTestId("reader");
    for (const label of [s.script, s.settings, s.bookmarkTab, s.layout]) {
      fireEvent.click(nav().getByRole("button", { name: label }));
      expect(nav().getByRole("button", { name: label }).getAttribute("aria-current")).toBe("page");
      expect(container.querySelectorAll(".sidebar.mobile-open")).toHaveLength(1);
      expect(container.querySelector(".center-workspace")?.hasAttribute("inert")).toBe(true);
    }
    fireEvent.click(nav().getByRole("button", { name: s.home }));
    expect(container.querySelectorAll(".sidebar.mobile-open")).toHaveLength(0);
    expect(screen.getByTestId("reader")).toBe(reader);
    expect(container.querySelector(".center-workspace")?.hasAttribute("inert")).toBe(false);
  });

  it("edits inside Script and keeps Home as the reader", () => {
    const { container } = render(<Workspace />);
    fireEvent.click(nav().getByRole("button", { name: s.script }));
    fireEvent.click(screen.getByRole("button", { name: s.editor }));
    const field = screen.getByRole("textbox", { name: s.editor });
    expect(container.querySelector(".sidebar-left")?.contains(field)).toBe(true);
    fireEvent.change(field, { target: { value: "My mobile script" } });
    fireEvent.click(nav().getByRole("button", { name: s.home }));
    expect(screen.queryByRole("textbox", { name: s.editor })).toBeNull();
    expect(screen.getByTestId("reader")).toBeTruthy();
    fireEvent.click(nav().getByRole("button", { name: s.script }));
    expect(screen.getByRole("button", { name: /My mobile script/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /My mobile script/ }));
    expect(nav().getByRole("button", { name: s.home }).getAttribute("aria-current")).toBe("page");
  });

  it("applies first-use defaults on mobile while retaining saved preferences", () => {
    const view = render(<Workspace />);
    expect(readerSettings()).toMatchObject({
      fontSize: 24, lineHeight: 1.4, speed: 20,
      focus: true, showGuide: true, countdown: true, wakeLock: false,
      mirror: false, outputBookmarks: true, outputClearance: false,
    });
    view.unmount();
    const saved = { ...defaults, fontSize: 36, lineHeight: 1.6, speed: 40, countdown: false, outputBookmarks: false, wakeLock: true };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings: saved }));
    render(<Workspace />);
    expect(readerSettings()).toEqual(saved);
  });

  it("keeps desktop first-use defaults", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(<Workspace />);
    expect(readerSettings()).toEqual(defaults);
  });
});
