"use client";

import {
  forwardRef,
  createContext,
  useContext,
  memo,
  useMemo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
  type PointerEvent,
} from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { sourceAnchors, type PreviewEdit } from "@/lib/markdown";
import {
  IconArrowsUpDown,
  IconBookmark,
  IconBookmarkFilled,
  IconGripHorizontal,
  IconGripVertical,
  IconFileText,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import { s } from "@/content/strings.en";
import {
  advances,
  clamp,
  FOCUS_INACTIVE_OPACITY,
  symmetricMargins,
  type Anchor,
  type Bookmark,
  type Cue,
  type Settings,
} from "@/lib/model";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/controls";

export type ReaderHandle = {
  jump: (lineId: string) => void;
  restore: (anchor: Anchor | null, notify?: boolean) => void;
  getAnchor: () => Anchor | null;
  fullscreen: () => void;
};
type Props = {
  cues: Cue[];
  settings: Settings;
  playing: boolean;
  active?: boolean;
  output?: boolean;
  bookmarks: Bookmark[];
  onBookmark?: (lineId: string) => void;
  onEditScript?: () => void;
  onPreviewEdit?: (edit: PreviewEdit) => void;
  onExitFullscreen?: () => void;
  onTrySample?: () => void;
  onSettings: (settings: Partial<Settings>) => void;
  onProgress: (cue: number, progress: number, anchor: Anchor | null) => void;
  onEnd: () => void;
  onPauseForResize?: (paused: boolean) => void;
  onFallbackFullscreen?: () => void;
  onFullscreenChange?: (active: boolean) => void;
  countdown?: number | null;
  fullscreenControls?: ReactNode;
};

export const Reader = forwardRef<ReaderHandle, Props>(function Reader(
  {
    cues,
    settings,
    playing,
    active = true,
    output = false,
    bookmarks,
    onBookmark,
    onEditScript,
    onPreviewEdit,
    onExitFullscreen,
    onTrySample,
    onSettings,
    onProgress,
    onEnd,
    onPauseForResize,
    onFallbackFullscreen,
    onFullscreenChange,
    countdown,
    fullscreenControls,
  },
  ref,
) {
  const container = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const latest = useRef({ settings, cues, onProgress, onEnd });
  useLayoutEffect(() => {
    latest.current = { settings, cues, onProgress, onEnd };
  });
  const lastAnchor = useRef<Anchor | null>(null);
  const synchronizedScroll = useRef<number | null>(null);
  const lastCue = useRef(0);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [viewportWidth, setViewportWidth] = useState(1000);
  const [widthAdjusted, setWidthAdjusted] = useState(false);
  const narrow =
    !widthAdjusted &&
    viewportWidth * (1 - (settings.leftMargin + settings.rightMargin) / 100) <
      160;

  const getLines = useCallback(
    () =>
      viewport.current
        ? Array.from(
            viewport.current.querySelectorAll<HTMLElement>("[data-anchor]"),
          )
        : [],
    [],
  );
  const getAnchor = useCallback((): Anchor | null => {
    const el = viewport.current;
    if (!el) return null;
    const guideY =
      el.getBoundingClientRect().top +
      (el.clientHeight * latest.current.settings.guide) / 100;
    const lines = getLines();
    if (!lines.length) return null;
    const line =
      lines.find((line) => lineBox(line).bottom > guideY) ??
      lines[lines.length - 1];
    const box = lineBox(line);
    return {
      lineId: line.dataset.lineId!,
      fraction: clamp((guideY - box.top) / Math.max(1, box.height), 0, 1),
    };
  }, [getLines]);
  const report = useCallback(
    (notify = true) => {
      const el = viewport.current;
      if (!el) return;
      if (el.querySelector(".preview-text:focus")) return;
      const anchor = getAnchor();
      lastAnchor.current = anchor;
      const found = latest.current.cues.findIndex((cue) =>
        cue.lines.some((line) => line.id === anchor?.lineId),
      );
      const index = Math.max(0, found);
      lastCue.current = index;
      setCurrent(index);
      const end = Math.max(1, el.scrollHeight - el.clientHeight);
      if (notify)
        latest.current.onProgress(
          index,
          clamp(el.scrollTop / end, 0, 1),
          anchor,
        );
    },
    [getAnchor],
  );
  const restore = useCallback(
    (anchor: Anchor | null, notify = true) => {
      const el = viewport.current;
      if (!el || !anchor) return;
      const line = getLines().find(
        (line) => line.dataset.lineId === anchor.lineId,
      );
      if (!line) return;
      const relative = lineBox(line).top - el.getBoundingClientRect().top;
      el.scrollTop +=
        relative +
        lineBox(line).height * anchor.fraction -
        (el.clientHeight * latest.current.settings.guide) / 100;
      synchronizedScroll.current = el.scrollTop;
      report(notify);
    },
    [getLines, report],
  );
  const jump = useCallback(
    (lineId: string) => restore({ lineId, fraction: 0 }),
    [restore],
  );
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    try {
      if (!container.current?.requestFullscreen) throw new Error();
      await container.current.requestFullscreen();
    } catch {
      onFallbackFullscreen?.();
    }
  }, [onFallbackFullscreen]);
  useImperativeHandle(
    ref,
    () => ({ jump, restore, getAnchor, fullscreen: toggleFullscreen }),
    [jump, restore, getAnchor, toggleFullscreen],
  );

  useEffect(() => {
    const listener = () => {
      const value = document.fullscreenElement === container.current;
      setFullscreen(value);
      onFullscreenChange?.(value);
    };
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, [onFullscreenChange]);
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setViewportHeight(el.clientHeight);
      setViewportWidth(el.clientWidth);
      if (lastAnchor.current && !el.querySelector(".preview-text:focus"))
        restore(lastAnchor.current, active);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [restore, active]);
  useLayoutEffect(() => {
    if (lastAnchor.current && !viewport.current?.querySelector(".preview-text:focus"))
      restore(lastAnchor.current, active);
  }, [
    settings.font,
    settings.fontSize,
    settings.lineHeight,
    settings.leftMargin,
    settings.rightMargin,
    settings.guide,
    viewportHeight,
    viewportWidth,
    narrow,
    cues,
    restore,
    active,
  ]);

  useEffect(() => {
    if (!playing || !active || !cues.length) return;
    let frame = 0;
    let timestamp: number | null = null;
    let reported = 0;
    let position = viewport.current?.scrollTop ?? 0;
    let applied = position;
    const tick = (time: number) => {
      const el = viewport.current;
      if (!el) return;
      const elapsed = timestamp === null ? 0 : time - timestamp;
      timestamp = time;
      const max = el.scrollHeight - el.clientHeight;
      // Keep fractional movement outside the DOM: scrollTop may round each frame.
      if (el.scrollTop !== applied) position = el.scrollTop;
      position = advances(
        position,
        latest.current.settings.speed,
        elapsed,
        max,
      );
      el.scrollTop = position;
      applied = el.scrollTop;
      if (time - reported > 100) {
        report();
        reported = time;
      }
      if (el.scrollTop >= max - 1) {
        report();
        latest.current.onEnd();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, active, cues.length, report]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const middle = (event: MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    const preventAux = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };
    el.addEventListener("mousedown", middle);
    el.addEventListener("auxclick", preventAux);
    return () => {
      el.removeEventListener("mousedown", middle);
      el.removeEventListener("auxclick", preventAux);
    };
  }, [toggleFullscreen]);

  useEffect(() => {
    const outsideText = (event: globalThis.PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const el = viewport.current;
      if (!el || !el.querySelector(".preview-text")) return;
      const text = event.target.closest<HTMLElement>(".preview-text");
      // Inline fragments can wrap: test each visible box, not the empty space in their union.
      if (text && el.contains(text) && Array.from(text.getClientRects()).some((box) =>
        box.width > 0 && box.height > 0 && event.clientX >= box.left && event.clientX <= box.right
        && event.clientY >= box.top && event.clientY <= box.bottom)) return;

      const focused = el.querySelector<HTMLElement>(".preview-text:focus");
      focused?.blur();
      const readerBackground = container.current?.contains(event.target)
        && !event.target.closest("button, a, input, textarea, select, [role='slider']");
      if (readerBackground) {
        // Prevent the browser from placing a caret in the nearest editable line across a margin.
        event.preventDefault();
        el.focus({ preventScroll: true });
      }
      if (focused) window.getSelection()?.removeAllRanges();
    };
    document.addEventListener("pointerdown", outsideText, true);
    return () => document.removeEventListener("pointerdown", outsideText, true);
  }, []);

  const drag = useRef<{
    kind: "width" | "height" | "guide";
    side: number;
    x: number;
    y: number;
    settings: Settings;
    wasPlaying: boolean;
  } | null>(null);
  function begin(
    event: PointerEvent<HTMLButtonElement>,
    kind: "width" | "height" | "guide",
    side = 1,
  ) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastAnchor.current = getAnchor();
    drag.current = {
      kind,
      side,
      x: event.clientX,
      y: event.clientY,
      settings: {
        ...settings,
        height,
        ...(kind === "width" && narrow
          ? { leftMargin: 4, rightMargin: 4 }
          : {}),
      },
      wasPlaying: playing,
    };
    onPauseForResize?.(true);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "width") {
      setWidthAdjusted(true);
      onSettings(
        symmetricMargins(
          d.settings.leftMargin,
          d.settings.rightMargin,
          (((event.clientX - d.x) * d.side) /
            Math.max(1, viewport.current?.clientWidth ?? 1)) *
            100,
        ),
      );
    } else if (d.kind === "height")
      onSettings({
        height: clamp(
          d.settings.height +
            ((event.clientY - d.y) /
              Math.max(1, stage.current?.clientHeight ?? 1)) *
              100,
          20,
          100,
        ),
        ...(clean ? { outputClearance: true } : {}),
      });
    else
      onSettings({
        guide: clamp(
          d.settings.guide +
            ((event.clientY - d.y) /
              Math.max(1, viewport.current?.clientHeight ?? 1)) *
              100,
          0,
          100,
        ),
      });
  }
  function finish() {
    if (!drag.current) return;
    const resume = drag.current.wasPlaying;
    drag.current = null;
    onPauseForResize?.(!resume);
  }
  const clean = output || fullscreen;
  const showBookmarks = settings.outputBookmarks;
  const height = settings.outputClearance ? settings.height : 100;
  const style: CSSProperties = { height: `${height}%` };
  const fontFamily =
    settings.font === "serif"
      ? "Georgia, serif"
      : settings.font === "mono"
        ? "var(--font-geist-mono), monospace"
        : "var(--font-geist), sans-serif";
  return (
    <div
      ref={container}
      className={`reader-container ${clean ? "reader-clean" : ""}`}
    >
      {(onEditScript || fullscreen || (output && onExitFullscreen)) && (
        <div className="output-actions reader-actions">
          {onEditScript && (
            <Button variant="ghost" size="sm" onClick={onEditScript}>
              <IconEdit size={16} />
              {s.edit}
            </Button>
          )}
          {(fullscreen || (output && onExitFullscreen)) && (
            <IconButton
              label={s.exitFullscreen}
              onClick={onExitFullscreen ?? (() => document.exitFullscreen())}
            >
              <IconX />
            </IconButton>
          )}
        </div>
      )}
      <div ref={stage} className="reader-stage">
        <div className="reader-top" style={style}>
          {showBookmarks && bookmarks.length > 0 && (
            <nav aria-label={s.bookmarks} className="stage-bookmarks">
              {bookmarks.map((bookmark, i) => {
                const valid = cues.some((c) =>
                  c.lines.some((l) => l.id === bookmark.lineId),
                );
                return (
                  <button
                    key={bookmark.id}
                    title={valid ? bookmark.label : s.unresolved}
                    aria-label={valid ? bookmark.label : s.unresolved}
                    disabled={!valid}
                    onClick={() => jump(bookmark.lineId)}
                    className="stage-bookmark"
                  >
                    <IconBookmarkFilled size={14} />
                    <span>{i + 1}</span>
                  </button>
                );
              })}
            </nav>
          )}
          <div className="reading-area">
            <div
              ref={viewport}
              tabIndex={0}
              aria-label={s.focusReader}
              className={`reading-viewport ${clean ? "" : "reading-workspace"}`}
              onScroll={() => {
                const top = viewport.current?.scrollTop;
                if (top === synchronizedScroll.current) return;
                synchronizedScroll.current = null;
                if (!playing || !active) report();
              }}
            >
              {!cues.length ? (
                <div className="reader-empty">
                  <h2>{s.empty}</h2>
                  {!onEditScript && <p>{s.emptyOutputHint}</p>}
                  {onEditScript && (
                    <div className="reader-empty-actions">
                      <Button
                        className="reader-empty-action"
                        onClick={onEditScript}
                      >
                        <IconFileText size={17} />
                        {s.newScript}
                      </Button>
                      {onTrySample && (
                        <Button
                          className="reader-empty-action sample-button"
                          onClick={onTrySample}
                        >
                          {s.trySample}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="script-column"
                  style={{
                    marginLeft: `${narrow ? 4 : settings.leftMargin}%`,
                    marginRight: `${narrow ? 4 : settings.rightMargin}%`,
                    paddingTop: (viewportHeight * settings.guide) / 100,
                    paddingBottom: viewportHeight * (1 - settings.guide / 100),
                    fontFamily,
                    fontSize: settings.fontSize,
                    lineHeight: settings.lineHeight,
                    transform: settings.mirror ? "scaleX(-1)" : undefined,
                  }}
                >
                  {cues.map((cue, index) => (
                    <div
                      key={cue.id}
                      className={`script-cue ${index === current ? "cue-active" : ""}`}
                      style={{
                        opacity:
                          settings.focus && index !== current
                            ? FOCUS_INACTIVE_OPACITY
                            : 1,
                      }}
                      data-cue-id={cue.id}
                    >
                      <CueContent
                        cue={cue}
                        bookmarks={bookmarks}
                        clean={clean}
                        mirror={settings.mirror}
                        onBookmark={onBookmark}
                        onPreviewEdit={!playing && countdown == null ? onPreviewEdit : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {
              <>
                {[1, -1].map((side) => (
                  <button
                    key={side}
                    aria-label={s.resizeWidth}
                    className={`width-handle ${side === 1 ? "width-handle-left" : "width-handle-right"}`}
                    style={{
                      top: `clamp(0px, ${settings.guide}%, calc(100% - 42px))`,
                      ...(side === 1
                        ? {
                            left: `clamp(4px, calc(${narrow ? 4 : settings.leftMargin}% - 28px), calc(100% - 24px))`,
                          }
                        : {
                            right: `clamp(4px, calc(${narrow ? 4 : settings.rightMargin}% - 28px), calc(100% - 24px))`,
                          }),
                    }}
                    onPointerDown={(e) => begin(e, "width", side)}
                    onPointerMove={move}
                    onPointerUp={finish}
                    onPointerCancel={finish}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                        e.preventDefault();
                        setWidthAdjusted(true);
                        onSettings(
                          symmetricMargins(
                            narrow ? 4 : settings.leftMargin,
                            narrow ? 4 : settings.rightMargin,
                            (e.key === "ArrowRight" ? 1 : -1) * side,
                          ),
                        );
                      }
                    }}
                  >
                    <IconGripVertical size={16} />
                  </button>
                ))}
              </>
            }
            {settings.showGuide && cues.length > 0 && (
              <>
                <div
                  className="reading-guide"
                  style={{
                    top: `${settings.guide}%`,
                    transform: settings.guide === 100 ? "translateY(-1px)" : undefined,
                  }}
                >
                  <span />
                </div>
                <button
                  aria-label={s.adjustGuide}
                  className="guide-handle"
                  style={{ "--guide-position": `${settings.guide}%` } as CSSProperties}
                  onPointerDown={(e) => begin(e, "guide")}
                  onPointerMove={move}
                  onPointerUp={finish}
                  onPointerCancel={finish}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      onSettings({
                        guide: clamp(
                          settings.guide + (e.key === "ArrowDown" ? 2 : -2),
                          0,
                          100,
                        ),
                      });
                    }
                  }}
                >
                  <IconArrowsUpDown size={16} />
                </button>
              </>
            )}
          </div>
          {narrow && !clean && (
            <p className="narrow-warning">{s.narrowWarning}</p>
          )}
          {countdown != null && (
            <div className="countdown-overlay" role="status">
              {countdown}
            </div>
          )}
        </div>
        {settings.outputClearance && (
          <button
            aria-label={s.resizeHeight}
            className="height-handle"
            style={{ top: `min(${height}%, calc(100% - 11px))` }}
            onPointerDown={(e) => begin(e, "height")}
            onPointerMove={move}
            onPointerUp={finish}
            onPointerCancel={finish}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                onSettings({
                  height: clamp(
                    height + (e.key === "ArrowDown" ? 2 : -2),
                    20,
                    100,
                  ),
                  ...(clean ? { outputClearance: true } : {}),
                });
              }
            }}
          >
            <span />
            <IconGripHorizontal size={18} />
            <span />
          </button>
        )}
        {height < 100 && (
          <div
            className="phone-clearance"
            style={{ height: `${100 - height}%` }}
          >
            {!clean && (
              <div className="phone-placeholder">
                <p>{s.clearanceEmpty}</p>
                <span>{s.phoneHint}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {clean && fullscreenControls}
      {(fullscreen || (output && onExitFullscreen)) && (
        <p className="fullscreen-readout">
          <span>{s.fontSize}: {settings.fontSize}px</span>
          <span>{s.speed}: {Number((settings.speed / 20).toFixed(2))}×</span>
        </p>
      )}
    </div>
  );
});

function lineBox(line: HTMLElement) {
  const nodes = line
    .closest(".script-column")
    ?.querySelectorAll<HTMLElement>(`[data-line-id="${line.dataset.lineId}"]`);
  if (!nodes?.length) return line.getBoundingClientRect();
  const range = document.createRange();
  range.setStartBefore(nodes[0]);
  range.setEndAfter(nodes[nodes.length - 1]);
  return range.getBoundingClientRect();
}
type CueContextValue = {
  bookmarks: Bookmark[];
  clean: boolean;
  mirror: boolean;
  onBookmark?: (lineId: string) => void;
  onPreviewEdit?: (edit: PreviewEdit) => void;
};
const CueContext = createContext<CueContextValue>({ bookmarks: [], clean: false, mirror: false });
const markdownComponents: Components = {
  a: ({ children }) => <span>{children}</span>,
  span: ScriptSpan,
};
function ScriptSpan({ node, children }: ComponentProps<"span"> & ExtraProps) {
  const { bookmarks, clean, mirror, onBookmark, onPreviewEdit } = useContext(CueContext);
  const lineId = String(node?.properties["data-line-id"] ?? "");
  const first = node?.properties["data-anchor"] === "true";
  const listItem = node?.properties["data-list-item"] === "true";
  const marked = bookmarks.some((b) => b.lineId === lineId);
  return (
    <span data-line-id={lineId || undefined} data-anchor={first ? "true" : undefined}
      className="script-line">
      {first && !listItem && !clean && onBookmark && (
        <button className="line-bookmark"
          style={{ transform: mirror ? "scaleX(-1)" : undefined }}
          aria-label={marked ? s.removeBookmark : s.addBookmark}
          aria-pressed={marked} onClick={() => onBookmark(lineId)}>
          {marked ? <IconBookmarkFilled size={16} /> : <IconBookmark size={16} />}
        </button>
      )}
      {onPreviewEdit && lineId && typeof children === "string" ? (
        <PreviewText value={children} onEdit={onPreviewEdit} lineId={lineId}
          start={Number(node?.properties["data-source-start"])}
          end={Number(node?.properties["data-source-end"])}
          literal={node?.properties["data-literal"] === "true"} />
      ) : children}
    </span>
  );
}
const CueContent = memo(function CueContent({
  cue,
  bookmarks,
  clean,
  mirror,
  onBookmark,
  onPreviewEdit,
}: {
  cue: Cue;
  bookmarks: Bookmark[];
  clean: boolean;
  mirror: boolean;
  onBookmark?: (lineId: string) => void;
  onPreviewEdit?: (edit: PreviewEdit) => void;
}) {
  const anchors = useMemo(() => sourceAnchors(cue.lines), [cue.lines]);
  return (
    <CueContext.Provider value={{ bookmarks, clean, mirror, onBookmark, onPreviewEdit }}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[anchors]}
        skipHtml
        disallowedElements={["img", "table", "iframe"]}
        components={markdownComponents}
      >
        {cue.markdown}
      </Markdown>
    </CueContext.Provider>
  );
});

function PreviewText({ value, onEdit, ...source }: {
  value: string;
  onEdit: (edit: PreviewEdit) => void;
} & Omit<PreviewEdit, "text">) {
  const field = useRef<HTMLSpanElement>(null);
  const composing = useRef(false);
  const [editing, setEditing] = useState(false);
  useLayoutEffect(() => {
    const element = field.current;
    // Let the browser own the text node while typing; rewriting it resets the caret/undo stack.
    if (element && element.textContent !== value && document.activeElement !== element)
      element.textContent = value;
  }, [value]);
  function commit() {
    const text = field.current?.textContent ?? "";
    if (text !== value) onEdit({ ...source, text });
  }
  return (
    <span ref={field} className="preview-text" contentEditable={editing ? "plaintext-only" : false}
      suppressContentEditableWarning role="textbox" aria-label={s.editPreview}
      tabIndex={0}
      spellCheck
      onPointerDown={(event) => {
        if (event.button === 0 && !event.defaultPrevented) {
          setEditing(true);
          event.currentTarget.focus({ preventScroll: true });
        }
      }}
      onFocus={() => setEditing(true)}
      onInput={() => { if (!composing.current) commit(); }}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={() => { composing.current = false; commit(); }}
      onBlur={() => { composing.current = false; commit(); setEditing(false); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain").replace(/\r?\n/g, " ");
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (!event.currentTarget.contains(range.commonAncestorContainer)) return;
        range.deleteContents();
        const inserted = document.createTextNode(text);
        range.insertNode(inserted);
        range.setStartAfter(inserted);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        commit();
      }}
      onDrop={(event) => event.preventDefault()}
    />
  );
}
