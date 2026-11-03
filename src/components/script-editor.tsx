"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconHeading,
  IconQuote,
  IconList,
  IconListNumbers,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/controls";
import { Textarea } from "@/components/ui/textarea";
import { s } from "@/content/strings.en";
import {
  formatSelection,
  type ScriptFormat,
  type TextSelection,
} from "@/lib/formatting";

const formats = [
  { format: "bold", Icon: IconBold },
  { format: "italic", Icon: IconItalic },
  { format: "strike", Icon: IconStrikethrough },
  { format: "code", Icon: IconCode },
  { format: "heading", Icon: IconHeading },
  { format: "quote", Icon: IconQuote },
  { format: "bullet", Icon: IconList },
  { format: "ordered", Icon: IconListNumbers },
] as const;
export function ScriptEditor({
  value,
  onChange,
  onDone,
  onDownload,
  onUpload,
  onUseSample,
  onNew,
}: {
  value: string;
  onChange: (text: string) => void;
  onDone: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
  onUseSample?: () => void;
  onNew?: () => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<TextSelection>({
    start: 0,
    end: 0,
  });
  const pending = useRef<TextSelection | null>(null);
  useLayoutEffect(() => {
    if (!pending.current || !field.current) return;
    const next = pending.current;
    pending.current = null;
    field.current.focus();
    field.current.setSelectionRange(next.start, next.end);
  }, [value]);
  const capture = useCallback(() => {
    const el = field.current;
    if (!el) return;
    const next = { start: el.selectionStart, end: el.selectionEnd };
    setSelection((previous) =>
      previous.start === next.start && previous.end === next.end
        ? previous
        : next,
    );
  }, []);
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    // Native selection events also cover touch handles and menu-based selection.
    const captureFocusedSelection = () => {
      if (el.ownerDocument.activeElement === el) capture();
    };
    el.addEventListener("select", captureFocusedSelection);
    el.ownerDocument.addEventListener("selectionchange", captureFocusedSelection);
    return () => {
      el.removeEventListener("select", captureFocusedSelection);
      el.ownerDocument.removeEventListener(
        "selectionchange",
        captureFocusedSelection,
      );
    };
  }, [capture]);
  function apply(format: ScriptFormat) {
    const el = field.current;
    if (!el) return;
    // Read the live range; a caret formats its entire source line.
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (start === end) {
      start = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
      const newline = value.indexOf("\n", end);
      end = newline === -1 ? value.length : newline;
    }
    const next = formatSelection(
      value,
      { start, end },
      format,
    );
    pending.current = { start: next.start, end: next.end };
    setSelection(pending.current);
    if (next.text === value) {
      field.current?.focus();
      field.current?.setSelectionRange(next.start, next.end);
      pending.current = null;
    } else onChange(next.text);
  }
  return (
    <div className="editor-pane">
      <div className="editor-heading">
        <h2>{s.editor}</h2>
        <div className="editor-actions">
          {onDownload && (
            <IconButton label={s.exportScript} onClick={onDownload}>
              <IconDownload size={18} />
            </IconButton>
          )}
          {onUpload && (
            <IconButton label={s.importScript} onClick={onUpload}>
              <IconUpload size={18} />
            </IconButton>
          )}
          {onUseSample && <Button variant="outline" size="sm" onClick={onUseSample}>{s.useSample}</Button>}
          {onNew && <Button variant="outline" size="sm" onClick={onNew}>{s.new}</Button>}
          <Button size="sm" onClick={onDone}>{s.done}</Button>
        </div>
      </div>
      <div className="editor-toolbar-slot">
          <div
            role="toolbar"
            aria-label={selection.end > selection.start ? s.formatting.toolbar : s.formatting.lineToolbar}
            className="editor-toolbar"
          >
            {formats.map(({ format, Icon }) => (
              <Button
                key={format}
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={s.formatting[format]}
                title={s.formatting[format]}
                onPointerDown={(event) => event.preventDefault()}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply(format)}
              >
                <Icon size={17} />
              </Button>
            ))}
          </div>
      </div>
      <Textarea
        ref={field}
        autoFocus
        aria-label={s.editor}
        value={value}
        onChange={(event) => {
          pending.current = null;
          onChange(event.target.value);
          setSelection({
            start: event.target.selectionStart,
            end: event.target.selectionEnd,
          });
        }}
        onSelect={capture}
        onKeyUp={capture}
        onPointerUp={capture}
        onKeyDown={(event) => {
          if (
            !(event.ctrlKey || event.metaKey) ||
            event.altKey ||
            event.nativeEvent.isComposing
          )
            return;
          const key = event.key.toLowerCase();
          const format =
            key === "b"
              ? "bold"
              : key === "i"
                ? "italic"
                : key === "x" && event.shiftKey
                  ? "strike"
                  : event.code === "Backquote"
                    ? "code"
                    : null;
          if (format) {
            event.preventDefault();
            apply(format);
          }
        }}
        placeholder={s.paste}
        className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
      />
      <p className="text-xs text-muted-foreground">{s.unsupportedMarkdown}</p>
    </div>
  );
}
