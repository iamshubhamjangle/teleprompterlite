import { describe, expect, it } from "vitest";
import {
  advances,
  configSchema,
  defaults,
  isTypingTarget,
  reconcileLines,
  settingsSchema,
  symmetricMargins,
  toCues,
} from "@/lib/model";
import { messageSchema } from "@/lib/protocol";
describe("script anchors and paragraph cues", () => {
  it("groups logical lines into paragraph cues and normalizes CRLF", () => {
    const cues = toCues(reconcileLines("First\r\nSecond\r\n\r\nThird"));
    expect(cues).toHaveLength(2);
    expect(cues[0].lines).toHaveLength(2);
    expect(cues[0].markdown).toBe("First\nSecond");
  });
  it("preserves identity after inserting a paragraph above", () => {
    const previous = reconcileLines("Opening\n\nBookmark me\n\nEnding");
    const next = reconcileLines(
      "New paragraph\n\nOpening\n\nBookmark me\n\nEnding",
      previous,
    );
    expect(next.find((line) => line.text === "Bookmark me")?.id).toBe(
      previous[2].id,
    );
  });
  it("does not attach a deleted bookmark to another line at the same index", () => {
    const previous = reconcileLines("First\nTarget\nLast");
    expect(
      reconcileLines("First\nReplacement\nLast", previous).some(
        (line) => line.id === previous[1].id,
      ),
    ).toBe(false);
  });
  it("leaves ambiguous duplicate lines unresolved", () => {
    const previous = reconcileLines("A\nSame\nB\nSame\nC");
    const next = reconcileLines("Intro\nA\nSame\nB\nSame\nC", previous);
    expect(next.some((line) => line.id === previous[1].id)).toBe(false);
  });
  it("has no cues for a blank script", () =>
    expect(toCues(reconcileLines("\n \n"))).toEqual([]));
});
describe("geometry and playback", () => {
  it("resizes equally while preserving asymmetry", () =>
    expect(symmetricMargins(10, 20, 5)).toEqual({
      leftMargin: 15,
      rightMargin: 25,
    }));
  it("stops at a shared bound", () =>
    expect(symmetricMargins(10, 35, 20)).toEqual({
      leftMargin: 15,
      rightMargin: 40,
    }));
  it("prevents negative margins", () =>
    expect(symmetricMargins(10, 20, -20)).toEqual({
      leftMargin: 0,
      rightMargin: 10,
    }));
  it("advances with elapsed time and caps interruptions", () => {
    expect(advances(10, 40, 50, 100)).toBe(12);
    expect(advances(10, 40, 5000, 100)).toBe(13.2);
  });
  it("stops at the end", () => expect(advances(99, 200, 80, 100)).toBe(100));
});
describe("portable settings and input", () => {
  it("supports zero clearance", () =>
    expect(settingsSchema.parse({ ...defaults, height: 100 }).height).toBe(
      100,
    ));
  it("rejects invalid imports without coercing values", () => {
    for (const settings of [
      { ...defaults, speed: "40" },
      { ...defaults, height: 120 },
      { ...defaults, font: "url(evil)" },
      { ...defaults, css: "unsafe" },
    ])
      expect(
        configSchema.safeParse({
          app: "teleprompter-pro",
          version: 1,
          settings,
          theme: "dark",
        }).success,
      ).toBe(false);
  });
  it("rejects future config versions", () =>
    expect(
      configSchema.safeParse({
        app: "teleprompter-pro",
        version: 2,
        settings: defaults,
        theme: "dark",
      }).success,
    ).toBe(false));
  it("respects native keyboard input", () => {
    for (const tag of ["textarea", "input", "select"])
      expect(isTypingTarget(document.createElement(tag))).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    const button = document.createElement("button");
    button.innerHTML = "<span>Play</span>";
    expect(isTypingTarget(button.firstChild)).toBe(false);
    for (const role of ["slider", "combobox", "listbox", "dialog", "menu"]) {
      button.setAttribute("role", role);
      expect(isTypingTarget(button.firstChild)).toBe(true);
    }
    expect(isTypingTarget(document.createElement("div"))).toBe(false);
  });
  it("validates popup geometry patches and rejects unknown settings", () => {
    expect(
      messageSchema.safeParse({
        version: 1,
        type: "settings",
        patch: {
          fontSize: 48,
          height: 90,
          guide: 45,
          outputClearance: true,
          leftMargin: 25,
          rightMargin: 25,
        },
      }).success,
    ).toBe(true);
    for (const patch of [
      { height: 101 },
      { fontSize: 17 },
      { fontSize: 97 },
      { guide: -1 },
      { guide: 101 },
      { leftMargin: -1 },
      { outputClearance: "true" },
      { speed: 50 },
      { css: "unsafe" },
    ]) {
      expect(
        messageSchema.safeParse({ version: 1, type: "settings", patch })
          .success,
      ).toBe(false);
    }
  });
  it.each([0, 19, 66, 100])("accepts a guide position of %s%% in configs and popup patches", (guide) => {
    expect(configSchema.safeParse({
      app: "teleprompter-pro", version: 1,
      settings: { ...defaults, guide }, theme: "dark",
    }).success).toBe(true);
    expect(messageSchema.safeParse({
      version: 1, type: "settings", patch: { guide },
    }).success).toBe(true);
  });
  it("validates messages", () => {
    expect(
      messageSchema.safeParse({ version: 1, type: "speed", speed: -50 })
        .success,
    ).toBe(false);
    expect(
      messageSchema.safeParse({
        version: 1,
        type: "command",
        id: "one",
        action: "deleteEverything",
      }).success,
    ).toBe(false);
  });
});
