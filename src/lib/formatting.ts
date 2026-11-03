export type ScriptFormat =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "heading"
  | "quote"
  | "bullet"
  | "ordered";
export type TextSelection = { start: number; end: number };
export type FormattedSelection = TextSelection & { text: string };

export function formatSelection(
  text: string,
  selection: TextSelection,
  format: ScriptFormat,
): FormattedSelection {
  const start = Math.max(0, Math.min(text.length, selection.start));
  const end = Math.max(start, Math.min(text.length, selection.end));
  if (start === end) return { text, start, end };
  const markers = {
    bold: "**",
    italic: "*",
    strike: "~~",
    code: String.fromCharCode(96),
  };
  if (format in markers) {
    const selected = text.slice(start, end);
    const content = selected.trim();
    if (!content) return { text, start, end };
    const a = start + selected.length - selected.trimStart().length;
    const b = end - (selected.length - selected.trimEnd().length);
    // Blank paragraphs are separate reader cues, so give each its own inline markup.
    if (/\n[ \t]*\n/.test(content)) {
      const chunks = content.split(/(\n[ \t]*\n)/);
      const replacement = chunks
        .map((chunk, index) =>
          index % 2
            ? chunk
            : formatSelection(chunk, { start: 0, end: chunk.length }, format)
                .text,
        )
        .join("");
      return {
        text: text.slice(0, a) + replacement + text.slice(b),
        start: a,
        end: a + replacement.length,
      };
    }
    let marker = markers[format as keyof typeof markers];
    if (format === "code") {
      const runs = content.match(/\x60+/g) ?? [];
      marker = String.fromCharCode(96).repeat(
        Math.max(0, ...runs.map((run) => run.length)) + 1,
      );
    }
    const wholeWrapped =
      format !== "code" &&
      content.length > marker.length * 2 &&
      content.startsWith(marker) &&
      content.endsWith(marker) &&
      (format !== "italic" ||
        !content.startsWith("**") ||
        content.startsWith("***"));
    if (wholeWrapped) {
      const replacement = content.slice(marker.length, -marker.length);
      return {
        text: text.slice(0, a) + replacement + text.slice(b),
        start: a,
        end: a + replacement.length,
      };
    }
    const padding =
      format === "code" &&
      (content.startsWith(String.fromCharCode(96)) ||
        content.endsWith(String.fromCharCode(96)))
        ? " "
        : "";
    const opening = marker + padding,
      closing = padding + marker;
    const before = text.slice(0, a),
      after = text.slice(b);
    const italicPresent =
      format !== "italic" ||
      ((before.match(/\*+$/)?.[0].length ?? 0) % 2 === 1 &&
        (after.match(/^\*+/)?.[0].length ?? 0) % 2 === 1);
    // A repeated action removes formatting around the preserved inner selection.
    if (
      italicPresent &&
      text.slice(Math.max(0, a - opening.length), a) === opening &&
      text.slice(b, b + closing.length) === closing
    ) {
      return {
        text:
          text.slice(0, a - opening.length) +
          content +
          text.slice(b + closing.length),
        start: a - opening.length,
        end: b - opening.length,
      };
    }
    return {
      text: text.slice(0, a) + opening + content + closing + text.slice(b),
      start: a + opening.length,
      end: b + opening.length,
    };
  }
  const newline = String.fromCharCode(10);
  const blockStart = start === 0 ? 0 : text.lastIndexOf(newline, start - 1) + 1;
  const lastSelected = text[end - 1] === newline ? end - 1 : end;
  const nextBreak = text.indexOf(newline, lastSelected);
  const blockEnd = nextBreak < 0 ? text.length : nextBreak;
  const lines = text.slice(blockStart, blockEnd).split(newline);
  const prefixes = {
    heading: /^#{1,6} /,
    quote: /^> /,
    bullet: /^[-*+] /,
    ordered: /^\d+[.)] /,
  };
  const prefix = prefixes[format as keyof typeof prefixes];
  const populated = lines.filter((line) => line.trim());
  const remove =
    populated.length > 0 && populated.every((line) => prefix.test(line));
  let number = 0;
  const replacement = lines
    .map((line) => {
      if (!line.trim()) return line;
      if (remove) return line.replace(prefix, "");
      number++;
      const marker =
        format === "heading"
          ? "# "
          : format === "quote"
            ? "> "
            : format === "bullet"
              ? "- "
              : number + ". ";
      return marker + line;
    })
    .join(newline);
  return {
    text: text.slice(0, blockStart) + replacement + text.slice(blockEnd),
    start: blockStart,
    end: blockStart + replacement.length,
  };
}
