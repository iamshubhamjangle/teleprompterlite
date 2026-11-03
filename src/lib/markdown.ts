import type { Root, Element, RootContent } from "hast";
import type { ScriptLine } from "@/lib/model";

// Preserve source-line breaks and anchors without changing Markdown block/inline semantics.
export function sourceAnchors(lines: ScriptLine[]) {
  return function plugin() {
    return function transform(tree: Root) {
      const seen = new Set<string>();
      function annotate(parent: Root | Element, inListItem = false, inCode = false) {
        const children: RootContent[] = [];
        for (const child of parent.children) {
          if (child.type === "element") {
            annotate(
              child,
              inListItem || child.tagName === "li",
              inCode || child.tagName === "pre" || child.tagName === "code",
            );
            children.push(child);
          } else if (child.type === "text" && child.position) {
            const pieces = child.value.split("\n");
            pieces.forEach((value, index) => {
              const line = lines[child.position!.start.line - 1 + index];
              if (index > 0) {
                children.push(inCode
                  ? { type: "text", value: "\n" }
                  : { type: "element", tagName: "br", properties: {}, children: [] });
              }
              if (!line || !value) {
                children.push({ type: "text", value });
                return;
              }
              const first = !seen.has(line.id);
              seen.add(line.id);
              children.push({
                type: "element",
                tagName: "span",
                properties: {
                  "data-line-id": line.id,
                  "data-anchor": first ? "true" : undefined,
                  "data-list-item": inListItem ? "true" : undefined,
                  "data-source-start": index === 0 ? child.position!.start.column - 1
                    : inCode ? 0 : (line.text.match(/^(?:[ \t]*>[ \t]?)*[ \t]*/)?.[0].length ?? 0),
                  "data-source-end": index === pieces.length - 1
                    ? child.position!.end.column - 1 : line.text.length,
                  "data-literal": inCode ? "true" : undefined,
                },
                children: [{ type: "text", value }],
              });
            });
          } else children.push(child);
        }
        parent.children = children as Element["children"];
      }
      annotate(tree);
    };
  };
}

export type PreviewEdit = {
  lineId: string;
  start: number;
  end: number;
  text: string;
  literal: boolean;
};

// Replace only the displayed text's source range; keep Markdown and line IDs intact.
export function applyPreviewEdit(lines: ScriptLine[], edit: PreviewEdit): ScriptLine[] {
  return lines.map((line) => {
    if (line.id !== edit.lineId || !Number.isInteger(edit.start) || !Number.isInteger(edit.end)
      || edit.start < 0 || edit.end < edit.start || edit.end > line.text.length)
      return line;
    const plain = edit.text.replace(/\r?\n/g, " ");
    const replacement = edit.literal ? plain : plain.replace(/[\\`*_[\]<>~]/g, "\\$&");
    return { ...line, text: line.text.slice(0, edit.start) + replacement + line.text.slice(edit.end) };
  });
}
