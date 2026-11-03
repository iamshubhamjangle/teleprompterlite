import { z } from "zod";

export const SETTINGS_KEY = "teleprompter-pro:preferences:v1";
export const DRAFT_KEY = "teleprompter-pro:draft:v1";
export const THEME_KEY = "teleprompter-pro:theme";
export const FOCUS_INACTIVE_OPACITY = 0.5;
export const settingsSchema = z
  .object({
    font: z.enum(["sans", "serif", "mono"]),
    fontSize: z.number().min(18).max(96),
    lineHeight: z.number().min(1.1).max(2.2),
    leftMargin: z.number().min(0).max(40),
    rightMargin: z.number().min(0).max(40),
    height: z.number().min(20).max(100),
    speed: z.number().min(5).max(200),
    guide: z.number().min(0).max(100),
    inactiveOpacity: z.number().min(0.5).max(1),
    linked: z.boolean(),
    focus: z.boolean(),
    mirror: z.boolean(),
    showGuide: z.boolean(),
    outputBookmarks: z.boolean(),
    outputClearance: z.boolean(),
    leftCollapsed: z.boolean(),
    rightCollapsed: z.boolean(),
    shortcuts: z.boolean(),
    countdown: z.boolean(),
    wakeLock: z.boolean(),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export const defaults: Settings = {
  font: "sans",
  fontSize: 24,
  lineHeight: 1.4,
  leftMargin: 18,
  rightMargin: 18,
  height: 72,
  speed: 20,
  guide: 35,
  inactiveOpacity: FOCUS_INACTIVE_OPACITY,
  linked: true,
  focus: true,
  mirror: false,
  showGuide: true,
  outputBookmarks: true,
  outputClearance: false,
  leftCollapsed: false,
  rightCollapsed: false,
  shortcuts: true,
  countdown: true,
  wakeLock: false,
};
export const configSchema = z
  .object({
    app: z.literal("teleprompter-pro"),
    version: z.literal(1),
    settings: settingsSchema,
    theme: z.enum(["light", "dark"]),
  })
  .strict();
export type Config = z.infer<typeof configSchema>;
export const lineSchema = z.object({ id: z.string(), text: z.string() });
export const bookmarkSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  excerpt: z.string(),
  label: z.string(),
});
export type ScriptLine = z.infer<typeof lineSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
export const draftSchema = z.object({
  version: z.literal(1),
  title: z.string().max(200),
  lines: z.array(lineSchema),
  bookmarks: z.array(bookmarkSchema),
  anchor: z
    .object({ lineId: z.string(), fraction: z.number().min(0).max(1) })
    .nullable(),
});
export type Anchor = { lineId: string; fraction: number };
export type Cue = { id: string; lines: ScriptLine[]; markdown: string };
export const id = () => crypto.randomUUID();
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function reconcileLines(
  text: string,
  previous: ScriptLine[] = [],
): ScriptLine[] {
  const raw = text.replace(/\r\n?/g, "\n").split("\n");
  const oldBuckets = new Map<
    string,
    { line: ScriptLine; oldIndex: number }[]
  >();
  const newCounts = new Map<string, number>();
  previous.forEach((line, oldIndex) => {
    const bucket = oldBuckets.get(line.text) ?? [];
    bucket.push({ line, oldIndex });
    oldBuckets.set(line.text, bucket);
  });
  raw.forEach((value) => newCounts.set(value, (newCounts.get(value) ?? 0) + 1));
  const used = new Set<string>();
  return raw.map((value, index) => {
    const matches = (oldBuckets.get(value) ?? []).filter(
      ({ line }) => !used.has(line.id),
    );
    const same = matches.find(
      ({ oldIndex }) =>
        oldIndex === index &&
        previous[index - 1]?.text === raw[index - 1] &&
        previous[index + 1]?.text === raw[index + 1],
    );
    const unique =
      matches.length === 1 && newCounts.get(value) === 1
        ? matches[0]
        : undefined;
    const match = same ?? unique;
    if (match) {
      used.add(match.line.id);
      return match.line;
    }
    return { id: id(), text: value };
  });
}
export function toCues(lines: ScriptLine[]): Cue[] {
  const groups: ScriptLine[][] = [];
  let current: ScriptLine[] = [];
  for (const line of lines) {
    if (!line.text.trim()) {
      if (current.length) groups.push(current);
      current = [];
    } else current.push(line);
  }
  if (current.length) groups.push(current);
  return groups.map((group) => ({
    id: group[0].id,
    lines: group,
    markdown: group.map((line) => line.text).join("\n"),
  }));
}
export function symmetricMargins(left: number, right: number, delta: number) {
  const bounded = clamp(
    delta,
    -Math.min(left, right),
    40 - Math.max(left, right),
  );
  return { leftMargin: left + bounded, rightMargin: right + bounded };
}
export function advances(
  position: number,
  speed: number,
  elapsed: number,
  max: number,
) {
  return clamp(position + (speed * clamp(elapsed, 0, 80)) / 1000, 0, max);
}
export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest(
      "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='slider'], [role='combobox'], [role='listbox'], [role='dialog'], [role='menu']",
    )
  );
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
