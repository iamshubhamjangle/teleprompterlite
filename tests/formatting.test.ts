import { describe, expect, it } from "vitest";
import { formatSelection } from "@/lib/formatting";

describe("Markdown selection editing", () => {
  it("preserves outside text and whitespace while toggling bold on the inner selection", () => {
    const first = formatSelection(
      "Say hello camera",
      { start: 3, end: 9 },
      "bold",
    );
    expect(first).toEqual({ text: "Say **hello** camera", start: 6, end: 11 });
    const second = formatSelection(first.text, first, "bold");
    expect(second).toEqual({ text: "Say hello camera", start: 4, end: 9 });
  });
  it("adds italic to bold rather than removing a bold marker", () => {
    const result = formatSelection("**hello**", { start: 2, end: 7 }, "italic");
    expect(result.text).toBe("***hello***");
    expect(formatSelection(result.text, result, "italic").text).toBe(
      "**hello**",
    );
  });
  it("uses safe code delimiters for text containing backticks", () => {
    const tick = String.fromCharCode(96);
    const content = tick + "camera" + tick;
    const result = formatSelection(
      content,
      { start: 0, end: content.length },
      "code",
    );
    expect(result.text).toBe(
      tick.repeat(2) + " " + content + " " + tick.repeat(2),
    );
    expect(formatSelection(result.text, result, "code").text).toBe(content);
  });
  it("formats whole selected lines without touching following content", () => {
    const text = ["Opening", "Camera", "Closing"].join(String.fromCharCode(10));
    const result = formatSelection(text, { start: 2, end: 14 }, "ordered");
    expect(result.text).toBe(
      ["1. Opening", "2. Camera", "Closing"].join(String.fromCharCode(10)),
    );
    expect(formatSelection(result.text, result, "ordered").text).toBe(text);
  });
  it("formats selected paragraphs as separate cues and toggles them together", () => {
    const separator = String.fromCharCode(10).repeat(2);
    const original = "First take" + separator + "Second take";
    const result = formatSelection(
      original,
      { start: 0, end: original.length },
      "bold",
    );
    expect(result.text).toBe("**First take**" + separator + "**Second take**");
    expect(formatSelection(result.text, result, "bold").text).toBe(original);
  });
  it("ignores empty and whitespace-only inline selections", () => {
    expect(formatSelection("camera", { start: 2, end: 2 }, "bold").text).toBe(
      "camera",
    );
    expect(formatSelection("   ", { start: 0, end: 3 }, "strike").text).toBe(
      "   ",
    );
  });
});
