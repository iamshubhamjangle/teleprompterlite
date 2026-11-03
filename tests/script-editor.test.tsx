import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScriptEditor } from "@/components/script-editor";
import { s } from "@/content/strings.en";

afterEach(cleanup);
function mountEditor(value = "Hello camera") {
  const done = vi.fn();
  function Harness() {
    const [text, setText] = useState(value);
    return <ScriptEditor value={text} onChange={setText} onDone={done} />;
  }
  render(<Harness />);
  return {
    field: screen.getByRole("textbox", {
      name: "Edit script",
    }) as HTMLTextAreaElement,
    done,
  };
}
function select(field: HTMLTextAreaElement, start: number, end: number) {
  field.focus();
  field.setSelectionRange(start, end);
  fireEvent.keyUp(field, { key: "Shift" });
}
describe("script formatting actions", () => {
  it("formats only the current line with a collapsed selection and toggles it", () => {
    const { field } = mountEditor("Opening\nHello camera\nClosing");
    select(field, 11, 11);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("Opening\n**Hello camera**\nClosing");
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("Opening\nHello camera\nClosing");
    select(field, 11, 11);
    fireEvent.click(screen.getByRole("button", { name: "Heading" }));
    expect(field.value).toBe("Opening\n# Hello camera\nClosing");
  });

  it("formats the first and last lines with caret shortcuts", () => {
    const { field } = mountEditor("Opening\nClosing");
    select(field, 0, 0);
    fireEvent.keyDown(field, { key: "b", ctrlKey: true });
    expect(field.value).toBe("**Opening**\nClosing");
    select(field, field.value.length, field.value.length);
    fireEvent.keyDown(field, { key: "i", ctrlKey: true });
    expect(field.value).toBe("**Opening**\n*Closing*");
  });

  it("shows formatting actions for native textarea selection events", () => {
    const { field } = mountEditor();
    field.setSelectionRange(0, 5);
    fireEvent(field, new Event("select", { bubbles: true }));
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("**Hello** camera");
  });

  it("formats the current DOM selection before selection state catches up", () => {
    const { field } = mountEditor();
    select(field, 0, 5);
    field.setSelectionRange(6, 12);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("Hello **camera**");
  });

  it("tracks document selection changes and touch toolbar activation", () => {
    const { field } = mountEditor();
    field.setSelectionRange(6, 12);
    fireEvent(document, new Event("selectionchange"));
    const bold = screen.getByRole("button", { name: "Bold" });
    expect(fireEvent.pointerDown(bold, { pointerType: "touch" })).toBe(false);
    fireEvent.click(bold);
    expect(field.value).toBe("Hello **camera**");
    expect(document.activeElement).toBe(field);
    expect(field.value.slice(field.selectionStart, field.selectionEnd)).toBe("camera");
  });

  it("uses the live selection for shortcuts before selection events arrive", () => {
    const { field } = mountEditor();
    field.setSelectionRange(6, 12);
    fireEvent.keyDown(field, { key: "b", ctrlKey: true });
    expect(field.value).toBe("Hello **camera**");
  });
  it("stays visible and preserves selection through formatting", () => {
    const { field } = mountEditor();
    expect(screen.getByRole("toolbar")).toBeTruthy();
    select(field, 0, 5);
    expect(
      screen.getByRole("toolbar", { name: "Format selected text" }),
    ).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole("button", { name: "Bold" }));
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("**Hello** camera");
    expect(field.value.slice(field.selectionStart, field.selectionEnd)).toBe(
      "Hello",
    );
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(field.value).toBe("Hello camera");
  });
  it("supports keyboard formatting without closing the editor", () => {
    const { field, done } = mountEditor();
    select(field, 6, 12);
    fireEvent.keyDown(field, { key: "i", ctrlKey: true });
    expect(field.value).toBe("Hello *camera*");
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: s.done }));
    expect(done).toHaveBeenCalledOnce();
  });
  it("keeps actions available when the selection is collapsed", () => {
    const { field } = mountEditor();
    select(field, 0, 5);
    select(field, 5, 5);
    expect(screen.getByRole("toolbar")).toBeTruthy();
  });
});
