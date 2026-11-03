import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Presenter } from "@/components/presenter";
import { Switch } from "@/components/ui/switch";
import { defaults, reconcileLines } from "@/lib/model";
import { messageSchema, type Message } from "@/lib/protocol";

const connection = vi.hoisted(() => ({
  receive: (message: Message) => { void message; },
  send: vi.fn(),
  setTheme: vi.fn(),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: connection.setTheme }) }));
vi.mock("@/lib/protocol", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/protocol")>(),
  connectChannel: (_session: string, receive: (message: Message) => void) => {
    connection.receive = receive;
    return { send: connection.send, close: vi.fn() };
  },
}));
vi.mock("@/components/reader", () => ({ Reader: () => <div /> }));

beforeEach(() => {
  connection.send.mockClear();
  window.history.replaceState(null, "", "/presenter?session=12345678-1234-1234-1234-123456789abc");
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("consumes the playback Space release across a synchronized snapshot update", () => {
  const changed = vi.fn();
  render(<><Presenter /><Switch aria-label="Preview option" onCheckedChange={changed} /></>);
  const snapshot = {
    lines: reconcileLines("Opening"), bookmarks: [], settings: defaults,
    playing: false, countdown: null, anchor: null, theme: "light" as const,
  };
  act(() => connection.receive({ type: "snapshot", version: 1, sequence: 1, snapshot }));
  connection.send.mockClear();
  const option = screen.getByRole("switch", { name: "Preview option" });
  option.focus();
  expect(fireEvent.keyDown(option, { key: " ", code: "Space" })).toBe(false);
  expect(connection.send.mock.lastCall?.[0]).toMatchObject({ type: "command", action: "play" });
  act(() => connection.receive({
    type: "snapshot", version: 1, sequence: 2, snapshot: { ...snapshot, playing: true },
  }));
  expect(fireEvent.keyUp(option, { key: " ", code: "Space" })).toBe(false);
  expect(changed).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(option);
});

it("synchronizes horizontal font shortcuts while vertical arrows retain cue navigation", () => {
  render(<Presenter />);
  act(() => connection.receive({
    type: "snapshot", version: 1, sequence: 1,
    snapshot: {
      lines: reconcileLines("Opening\n\nClosing"), bookmarks: [], settings: defaults,
      playing: false, countdown: null, anchor: null, theme: "light",
    },
  }));
  connection.send.mockClear();
  fireEvent.keyDown(window, { key: "ArrowRight" });
  const increase = connection.send.mock.lastCall?.[0];
  expect(increase).toEqual({ type: "settings", version: 1, patch: { fontSize: 26 } });
  expect(messageSchema.safeParse(increase).success).toBe(true);
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(connection.send).toHaveBeenLastCalledWith({ type: "settings", version: 1, patch: { fontSize: 24 } });
  fireEvent.keyDown(window, { key: "ArrowDown" });
  expect(connection.send.mock.lastCall?.[0]).toMatchObject({ type: "command", action: "next" });
  fireEvent.keyDown(window, { key: "ArrowUp" });
  expect(connection.send.mock.lastCall?.[0]).toMatchObject({ type: "command", action: "previous" });
});
