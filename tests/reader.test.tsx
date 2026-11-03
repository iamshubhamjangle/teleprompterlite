import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Reader, type ReaderHandle } from "@/components/reader";
import { defaults, isTypingTarget, reconcileLines, toCues, type Settings } from "@/lib/model";
import { applyPreviewEdit, type PreviewEdit } from "@/lib/markdown";

vi.mock("@/components/controls", () => ({
  IconButton: ({
    label,
    onClick,
    children,
  }: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button aria-label={label} onClick={onClick}>
      {children}
    </button>
  ),
}));
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: () => void) {}
      observe() {
        this.callback();
      }
      disconnect() {}
    },
  );
  vi.stubGlobal("PointerEvent", MouseEvent);
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(0, 0, 100, 20),
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: () => {},
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mountReader({
  output = true,
  playing = false,
  pause = vi.fn(),
  initial = defaults,
} = {}) {
  const cues = toCues(
    reconcileLines(
      ["Opening paragraph", "", "Second paragraph"].join(
        String.fromCharCode(10),
      ),
    ),
  );
  function Harness() {
    const [settings, setSettings] = useState<Settings>(initial);
    return (
      <Reader
        cues={cues}
        settings={settings}
        playing={playing}
        output={output}
        fullscreenControls={<button>Fullscreen playback controls</button>}
        bookmarks={[
          {
            id: "mark",
            lineId: cues[0].lines[0].id,
            label: "Opening",
            excerpt: "Opening paragraph",
          },
        ]}
        onSettings={(patch) => setSettings((value) => ({ ...value, ...patch }))}
        onProgress={() => {}}
        onEnd={() => {}}
        onPauseForResize={pause}
      />
    );
  }
  return render(<Harness />);
}
describe("reading geometry in output", () => {
  it("keeps the controls inside the native fullscreen element and removes them on exit", () => {
    const { container } = mountReader({ output: false });
    const element = container.querySelector(".reader-container");
    expect(screen.queryByRole("button", { name: "Fullscreen playback controls" })).toBeNull();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true, value: element,
    });
    try {
      fireEvent(document, new Event("fullscreenchange"));
      expect(element?.contains(screen.getByRole("button", { name: "Fullscreen playback controls" }))).toBe(true);
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
      fireEvent(document, new Event("fullscreenchange"));
      expect(screen.queryByRole("button", { name: "Fullscreen playback controls" })).toBeNull();
    } finally {
      Reflect.deleteProperty(document, "fullscreenElement");
    }
  });
  it("includes the controls in fallback reading output", () => {
    const { container } = mountReader({ output: true });
    expect(container.querySelector(".reader-container")?.contains(
      screen.getByRole("button", { name: "Fullscreen playback controls" }),
    )).toBe(true);
  });
  it("keeps the reading guide adjustable when the workspace enters native fullscreen", () => {
    const { container } = mountReader({ output: false });
    const reader = container.querySelector(".reader-container");
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => reader,
    });
    try {
      fireEvent(document, new Event("fullscreenchange"));
      expect(reader?.classList.contains("reader-clean")).toBe(true);
      const handle = screen.getByRole("button", { name: "Adjust reading guide" });
      fireEvent.keyDown(handle, { key: "ArrowDown" });
      expect(container.querySelector(".reading-guide")?.getAttribute("style"))
        .toContain("top: 37%");
      fireEvent.pointerDown(handle, { clientY: 370 });
      fireEvent.pointerMove(handle, { clientY: 470 });
      fireEvent.pointerUp(handle, { clientY: 470 });
      expect(container.querySelector(".reading-guide")?.getAttribute("style"))
        .toContain("top: 47%");
    } finally {
      Reflect.deleteProperty(document, "fullscreenElement");
    }
  });

  it("supports the reading guide in output while honoring its disabled setting", () => {
    const { container } = mountReader();
    fireEvent.keyDown(screen.getByRole("button", { name: "Adjust reading guide" }), {
      key: "ArrowUp",
    });
    expect(container.querySelector(".reading-guide")?.getAttribute("style"))
      .toContain("top: 33%");
    cleanup();
    mountReader({ initial: { ...defaults, showGuide: false } });
    expect(screen.queryByRole("button", { name: "Adjust reading guide" })).toBeNull();
  });

  it.each([false, true])("drags the guide across the entire reading area (output: %s)", (output) => {
    const { container } = mountReader({ output });
    const handle = screen.getByRole("button", { name: "Adjust reading guide" });
    const guide = container.querySelector<HTMLElement>(".reading-guide")!;
    fireEvent.pointerDown(handle, { clientY: 350 });
    fireEvent.pointerMove(handle, { clientY: -50 });
    expect(guide.style.top).toBe("0%");
    fireEvent.pointerMove(handle, { clientY: 1100 });
    expect(guide.style.top).toBe("100%");
    expect(guide.style.transform).toBe("translateY(-1px)");
    fireEvent.pointerUp(handle, { clientY: 1100 });
    // Edge controls remain inside the pane, so the guide can be moved again.
    expect(handle.style.getPropertyValue("--guide-position")).toBe("100%");
    fireEvent.pointerDown(handle, { clientY: 991 });
    fireEvent.pointerMove(handle, { clientY: 491 });
    fireEvent.pointerUp(handle, { clientY: 491 });
    expect(guide.style.top).toBe("50%");
    expect(guide.style.transform).toBe("");
  });

  it.each([
    { guide: 1, key: "ArrowUp", edge: 0 },
    { guide: 99, key: "ArrowDown", edge: 100 },
  ])("clamps keyboard guide adjustment at $edge%", ({ guide, key, edge }) => {
    const { container } = mountReader({ initial: { ...defaults, guide } });
    const handle = screen.getByRole("button", { name: "Adjust reading guide" });
    fireEvent.keyDown(handle, { key });
    fireEvent.keyDown(handle, { key });
    expect(container.querySelector<HTMLElement>(".reading-guide")?.style.top)
      .toBe(`${edge}%`);
  });

  it("shows saved bookmarks by default and lets keyboard resizing adjust active clearance", () => {
    const { container } = mountReader({
      initial: { ...defaults, height: 100, outputClearance: true },
    });
    expect(screen.getByRole("navigation", { name: "Bookmarks" })).toBeTruthy();
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 100%");
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Resize reading height" }),
      { key: "ArrowUp" },
    );
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 98%");
    expect(
      container.querySelector(".phone-clearance")?.getAttribute("style"),
    ).toContain("height: 2%");
    fireEvent.keyDown(
      screen.getAllByRole("button", { name: "Resize reading width" })[0],
      { key: "ArrowRight" },
    );
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 19%");
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-right: 19%");
  });
  it("drags from the displayed output height and resumes the original playback state", () => {
    const pause = vi.fn();
    const { container } = mountReader({
      playing: true,
      pause,
      initial: { ...defaults, height: 100, outputClearance: true },
    });
    const handle = screen.getByRole("button", {
      name: "Resize reading height",
    });
    fireEvent.pointerDown(handle, { clientY: 1000 });
    fireEvent.pointerMove(handle, { clientY: 900 });
    fireEvent.pointerUp(handle, { clientY: 900 });
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 90%");
    expect(pause.mock.calls).toEqual([[true], [false]]);
  });
  it("resizes visibly from the displayed margins in a narrow window", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    const { container } = mountReader({
      initial: { ...defaults, leftMargin: 40, rightMargin: 40 },
    });
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 4%");
    fireEvent.keyDown(
      screen.getAllByRole("button", { name: "Resize reading width" })[0],
      { key: "ArrowLeft" },
    );
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 3%");
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-right: 3%");
  });
  it("does not change a narrow column when a handle is pressed without moving", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    const { container } = mountReader({
      initial: { ...defaults, leftMargin: 40, rightMargin: 40 },
    });
    const handle = screen.getAllByRole("button", {
      name: "Resize reading width",
    })[0];
    fireEvent.pointerDown(handle, { clientX: 100 });
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 4%");
    fireEvent.pointerUp(handle, { clientX: 100 });
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 4%");
    fireEvent.pointerDown(handle, { clientX: 100 });
    fireEvent.pointerMove(handle, { clientX: 102 });
    expect(
      container.querySelector(".script-column")?.getAttribute("style"),
    ).toContain("margin-left: 5%");
    fireEvent.pointerUp(handle, { clientX: 102 });
  });
  it("keeps zero-clearance output adjustable and honors hidden bookmark preference", () => {
    const { container } = mountReader({
      initial: {
        ...defaults,
        height: 100,
        outputClearance: true,
        outputBookmarks: false,
      },
    });
    expect(screen.queryByRole("navigation", { name: "Bookmarks" })).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "Resize reading width" }),
    ).toHaveLength(2);
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Resize reading height" }),
      { key: "ArrowUp" },
    );
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 98%");
  });

  it("applies bookmark visibility and phone clearance in the workspace preview", () => {
    const { container } = mountReader({
      output: false,
      initial: {
        ...defaults,
        height: 72,
        outputBookmarks: false,
        outputClearance: true,
      },
    });
    expect(screen.queryByRole("navigation", { name: "Bookmarks" })).toBeNull();
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 72%");
    expect(
      container.querySelector(".phone-clearance")?.getAttribute("style"),
    ).toContain("height: 28%");
  });
  it("hides the clearance divider when phone clearance is disabled", () => {
    const { container } = mountReader({
      output: false,
      initial: { ...defaults, height: 72, outputClearance: false },
    });
    expect(
      screen.queryByRole("button", { name: "Resize reading height" }),
    ).toBeNull();
    expect(
      container.querySelector(".reader-top")?.getAttribute("style"),
    ).toContain("height: 100%");
    expect(container.querySelector(".phone-clearance")).toBeNull();
  });


});
describe("empty reader recovery", () => {
  it.each(["preview", "fullscreen", "fallback"])("keeps Edit inside the reader in %s", (mode) => {
    const open = vi.fn();
    const exit = vi.fn();
    const { container } = render(
      <Reader cues={toCues(reconcileLines("Opening"))} settings={defaults}
        playing={false} output={mode === "fallback"} bookmarks={[]}
        onSettings={() => {}} onProgress={() => {}} onEnd={() => {}}
        onEditScript={open} onExitFullscreen={exit} />,
    );
    const reader = container.querySelector(".reader-container");
    try {
      if (mode === "fullscreen") {
        Object.defineProperty(document, "fullscreenElement", { configurable: true, value: reader });
        fireEvent(document, new Event("fullscreenchange"));
      }
      const edit = screen.getByRole("button", { name: "Edit" });
      expect(reader?.contains(edit)).toBe(true);
      fireEvent.click(edit);
      expect(open).toHaveBeenCalledOnce();
      if (mode !== "preview") {
        fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
        expect(exit).toHaveBeenCalledOnce();
      }
    } finally {
      if (mode === "fullscreen") Reflect.deleteProperty(document, "fullscreenElement");
    }
  });
  it("offers editing and a sample without workspace-only guidance", () => {
    const open = vi.fn();
    const trySample = vi.fn();
    render(
      <Reader
        cues={[]}
        settings={defaults}
        playing={false}
        bookmarks={[]}
        onSettings={() => {}}
        onProgress={() => {}}
        onEnd={() => {}}
        onEditScript={open}
        onTrySample={trySample}
      />,
    );
    expect(screen.queryByText("Open Edit script to write or paste your script.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New script" }));
    expect(open).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Try a Sample" }));
    expect(trySample).toHaveBeenCalledOnce();
  });
});

describe("script line breaks", () => {
  function renderScript(script: string, output = false) {
    const cues = toCues(reconcileLines(script));
    const onBookmark = vi.fn();
    const result = render(
      <Reader cues={cues} settings={defaults} playing={false} output={output}
        bookmarks={[]} onBookmark={onBookmark} onSettings={() => {}}
        onProgress={() => {}} onEnd={() => {}} />,
    );
    return { ...result, cues, onBookmark };
  }

  it.each(["preview", "fullscreen", "output"])("preserves single newlines in %s", (mode) => {
    const { container, cues, onBookmark } = renderScript(
      "Your next great take\n\nYou don't need a perfect setup to tell a good story.\nYou just need a little space to find your voice.",
      mode === "output",
    );
    if (mode === "fullscreen") {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true, value: container.querySelector(".reader-container"),
      });
      try {
        fireEvent(document, new Event("fullscreenchange"));
      } finally {
        Reflect.deleteProperty(document, "fullscreenElement");
      }
    }
    const paragraphs = container.querySelectorAll(".script-cue p");
    expect(paragraphs).toHaveLength(2);
    const lineId = cues[1].lines[1].id;
    const secondLine = paragraphs[1].querySelector(`[data-line-id="${lineId}"]`)!;
    expect(secondLine.previousSibling?.nodeName).toBe("BR");
    expect(secondLine.getAttribute("data-anchor")).toBe("true");
    expect(paragraphs[1].querySelectorAll("br")).toHaveLength(1);
    if (mode === "preview") {
      fireEvent.click(secondLine.querySelector("button")!);
      expect(onBookmark).toHaveBeenCalledWith(lineId);
    } else {
      expect(container.querySelector(".line-bookmark")).toBeNull();
    }
  });

  it("preserves formatting across soft breaks and does not duplicate explicit Markdown breaks", () => {
    const { container } = renderScript("**First\nsecond**  \nThird\\\nFourth");
    const paragraph = container.querySelector(".script-cue p")!;
    expect(paragraph.querySelector("strong")?.querySelectorAll("br")).toHaveLength(1);
    expect(paragraph.querySelectorAll("br")).toHaveLength(3);
    expect(paragraph.querySelectorAll('[data-anchor="true"]')).toHaveLength(4);
  });

  it("preserves list continuation breaks and code-block whitespace", () => {
    const { container } = renderScript("- First\n  continuation\n\n```text\nFirst code line\nSecond code line\n```");
    const item = container.querySelector("li")!;
    expect(item.querySelectorAll("br")).toHaveLength(1);
    expect(item.querySelector(".line-bookmark")).toBeNull();
    const code = container.querySelector("pre code")!;
    expect(code.querySelector("br")).toBeNull();
    expect(code.textContent).toBe("First code line\nSecond code line\n");
  });
});

describe("list bookmark controls", () => {
  it("omits actions inside list items while preserving anchors and paragraph bookmarks", () => {
    const cues = toCues(reconcileLines([
      "So to summarize:",
      "",
      "- **First item**",
      "  - Nested item",
      "",
      "1. Ordered item",
      "",
      "Closing paragraph",
    ].join("\n")));
    const onBookmark = vi.fn();
    const { container } = render(
      <Reader
        cues={cues}
        settings={defaults}
        playing={false}
        bookmarks={[]}
        onBookmark={onBookmark}
        onSettings={() => {}}
        onProgress={() => {}}
        onEnd={() => {}}
      />,
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.querySelector(".line-bookmark")).toBeNull();
      expect(item.querySelector('[data-anchor="true"]')).not.toBeNull();
    }
    const buttons = screen.getAllByRole("button", { name: "Bookmark this line" });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(onBookmark).toHaveBeenCalledWith(cues[0].lines[0].id);
  });
});

describe("popup follower synchronization", () => {
  it("restores an anchor without echoing progress and still reports manual scrolling during popup playback", () => {
    const cues = toCues(reconcileLines("First paragraph\n\nSecond paragraph"));
    const ref = createRef<ReaderHandle>();
    const progress = vi.fn();
    const end = vi.fn();
    const { container } = render(
      <Reader ref={ref} cues={cues} settings={defaults} playing active={false}
        bookmarks={[]} onSettings={() => {}} onProgress={progress} onEnd={end} />,
    );
    const viewport = container.querySelector<HTMLElement>(".reading-viewport")!;
    progress.mockClear();
    act(() => ref.current?.restore({ lineId: cues[1].lines[0].id, fraction: 0.5 }, false));
    fireEvent.scroll(viewport);
    expect(progress).not.toHaveBeenCalled();
    viewport.scrollTop += 20;
    fireEvent.scroll(viewport);
    expect(progress).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });
});

describe("paused preview corrections", () => {
  function mountPreview(script: string, output = false) {
    const original = reconcileLines(script);
    function Harness() {
      const [lines, setLines] = useState(original);
      return <>
        <output data-testid="source">{lines.map((line) => line.text).join("\n")}</output>
        <Reader cues={toCues(lines)} settings={defaults} playing={false} output={output}
          bookmarks={[{ id: "mark", lineId: original[0].id, label: "Opening", excerpt: script }]}
          onBookmark={() => {}} onSettings={() => {}} onProgress={() => {}} onEnd={() => {}}
          onPreviewEdit={(edit: PreviewEdit) => setLines((previous) => applyPreviewEdit(previous, edit))} />
      </>;
    }
    return { ...render(<Harness />), original };
  }
  function correct(field: HTMLElement, value: string) {
    act(() => field.focus());
    field.textContent = value;
    fireEvent.input(field);
  }
  it.each(["preview", "fullscreen", "fallback"])("limits pointer editing to text boxes and clears focus after an outside click in %s", (mode) => {
    const { container } = mountPreview("Hello camera\n\nClosing", mode === "fallback");
    const reader = container.querySelector(".reader-container");
    const viewport = container.querySelector<HTMLElement>(".reading-viewport")!;
    const field = screen.getAllByRole("textbox", { name: "Correct script text" })[0];
    // Two wrapped line boxes; the blank area to the right of the second is outside the text.
    vi.spyOn(field, "getClientRects").mockReturnValue([
      new DOMRect(100, 100, 200, 40), new DOMRect(100, 140, 80, 40),
    ] as unknown as DOMRectList);
    if (mode === "fullscreen") {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: reader });
      fireEvent(document, new Event("fullscreenchange"));
    }
    try {
      expect(field.getAttribute("contenteditable")).toBe("false");
      for (const point of [{ clientX: 90, clientY: 110 }, { clientX: 310, clientY: 110 },
        { clientX: 250, clientY: 160 }, { clientX: 110, clientY: 190 }]) {
        fireEvent.pointerDown(field, { button: 0, clientX: 110, clientY: 110 });
        expect(document.activeElement).toBe(field);
        expect(field.getAttribute("contenteditable")).toBe("plaintext-only");
        const range = document.createRange();
        range.selectNodeContents(field);
        window.getSelection()!.removeAllRanges();
        window.getSelection()!.addRange(range);
        expect(fireEvent.pointerDown(field, { button: 0, ...point })).toBe(false);
        expect(document.activeElement).toBe(viewport);
        expect(field.getAttribute("contenteditable")).toBe("false");
        expect(window.getSelection()!.rangeCount).toBe(0);
        expect(isTypingTarget(document.activeElement)).toBe(false);
      }
      fireEvent.pointerDown(field, { button: 0, clientX: 110, clientY: 150 });
      expect(document.activeElement).toBe(field);
      fireEvent.pointerDown(container.querySelector(".script-column")!, { button: 0, clientX: 50, clientY: 100 });
      expect(document.activeElement).toBe(viewport);
      expect(field.getAttribute("contenteditable")).toBe("false");
      expect(screen.getByTestId("source").textContent).toBe("Hello camera\n\nClosing");
      if (mode === "fullscreen") expect(document.fullscreenElement).toBe(reader);
    } finally {
      if (mode === "fullscreen") Reflect.deleteProperty(document, "fullscreenElement");
    }
  });
  it("ends a correction without intercepting playback or other controls outside the reader", () => {
    const { container } = mountPreview("Hello camera");
    const field = screen.getByRole("textbox", { name: "Correct script text" });
    act(() => field.focus());
    const bookmark = screen.getByRole("button", { name: "Remove bookmark" });
    expect(fireEvent.pointerDown(bookmark, { button: 0 })).toBe(true);
    expect(field.getAttribute("contenteditable")).toBe("false");
    act(() => field.focus());
    expect(fireEvent.pointerDown(container, { button: 0 })).toBe(true);
    expect(field.getAttribute("contenteditable")).toBe("false");
    expect(isTypingTarget(document.activeElement)).toBe(false);
  });
  it.each(["preview", "fullscreen", "fallback"])("corrects text in %s without remounting the reader or losing the caret", (mode) => {
    const { container, original } = mountPreview("Hello camra\n\nClosing", mode === "fallback");
    const reader = container.querySelector(".reader-container");
    if (mode === "fullscreen") {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: reader });
      fireEvent(document, new Event("fullscreenchange"));
    }
    try {
      const field = screen.getAllByRole("textbox", { name: "Correct script text" })[0];
      field.focus();
      const textNode = field.firstChild!;
      textNode.textContent = "Hello camera";
      const range = document.createRange();
      range.setStart(textNode, 9);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      fireEvent.input(field);
      expect(screen.getByTestId("source").textContent).toBe("Hello camera\n\nClosing");
      expect(document.activeElement).toBe(field);
      expect(field.firstChild).toBe(textNode);
      expect(selection.anchorOffset).toBe(9);
      expect(container.querySelector(".reader-container")).toBe(reader);
      expect(field.closest("[data-line-id]")?.getAttribute("data-line-id")).toBe(original[0].id);
      expect(container.querySelector(".editor-pane")).toBeNull();
      if (mode === "fullscreen") expect(document.fullscreenElement).toBe(reader);
      correct(field, "Hello cameras");
      expect(screen.getByTestId("source").textContent).toBe("Hello cameras\n\nClosing");
    } finally {
      if (mode === "fullscreen") Reflect.deleteProperty(document, "fullscreenElement");
    }
  });
  it("preserves bold, heading, list, link destinations and neighboring source lines", () => {
    const { container } = mountPreview("# Your camra\n\nSay **helo** to [camra](https://example.com).\n\n- First camra\n- Second item");
    for (const field of screen.getAllByRole("textbox", { name: "Correct script text" })) {
      const value = field.textContent!;
      if (value.includes("camra") || value.includes("helo"))
        correct(field, value.replace("camra", "camera").replace("helo", "hello"));
    }
    expect(screen.getByTestId("source").textContent)
      .toBe("# Your camera\n\nSay **hello** to [camera](https://example.com).\n\n- First camera\n- Second item");
    expect(container.querySelector("strong")?.textContent).toBe("hello");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
  it("defers IME changes until composition ends and treats pasted newlines as spaces", () => {
    mountPreview("Hello camra");
    const field = screen.getByRole("textbox", { name: "Correct script text" });
    field.focus();
    fireEvent.compositionStart(field);
    field.textContent = "Hello camera";
    fireEvent.input(field);
    expect(screen.getByTestId("source").textContent).toBe("Hello camra");
    fireEvent.compositionEnd(field);
    expect(screen.getByTestId("source").textContent).toBe("Hello camera");
    const range = document.createRange();
    range.selectNodeContents(field);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    fireEvent.paste(field, { clipboardData: { getData: () => "New\nwords" } });
    expect(screen.getByTestId("source").textContent).toBe("New words");
    expect(field.textContent).toBe("New words");
  });
  it("preserves continuation indentation and quote markers when correcting later source lines", () => {
    mountPreview("- First line\n  Next camra\n\n> First quote\n> Next camra");
    for (const field of screen.getAllByRole("textbox", { name: "Correct script text" })) {
      if (field.textContent?.includes("camra")) correct(field, field.textContent.replace("camra", "camera"));
    }
    expect(screen.getByTestId("source").textContent)
      .toBe("- First line\n  Next camera\n\n> First quote\n> Next camera");
  });
  it("treats typed Markdown characters as literal correction text", () => {
    const { container } = mountPreview("Hello");
    correct(screen.getByRole("textbox", { name: "Correct script text" }), "Hello <camera> *ready*");
    expect(screen.getByTestId("source").textContent).toBe("Hello \\<camera\\> \\*ready\\*");
    expect(container.querySelector(".script-cue em")).toBeNull();
  });
  it("keeps playback, countdown and output without an edit callback read-only", () => {
    const props = { cues: toCues(reconcileLines("Hello camera")), settings: defaults,
      playing: false, active: false, bookmarks: [], onSettings: vi.fn(), onProgress: vi.fn(), onEnd: vi.fn() };
    const view = render(<Reader {...props} onPreviewEdit={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Correct script text" })).toBeTruthy();
    view.rerender(<Reader {...props} playing onPreviewEdit={vi.fn()} />);
    expect(screen.queryByRole("textbox", { name: "Correct script text" })).toBeNull();
    view.rerender(<Reader {...props} countdown={3} onPreviewEdit={vi.fn()} />);
    expect(screen.queryByRole("textbox", { name: "Correct script text" })).toBeNull();
    view.rerender(<Reader {...props} output />);
    expect(screen.queryByRole("textbox", { name: "Correct script text" })).toBeNull();
  });
});
