import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SpeedControl } from "@/components/speed-control";
import { s } from "@/content/strings.en";

afterEach(cleanup);
function mountSpeed(initial: number) {
  function Harness() {
    const [speed, setSpeed] = useState(initial);
    return <SpeedControl speed={speed} onChange={setSpeed} />;
  }
  render(<Harness />);
}
describe("transport speed controls", () => {
  it("adjusts and displays fractional multipliers without a dropdown", () => {
    mountSpeed(24);
    expect(screen.getByRole("status").textContent).toBe("1.2×");
    fireEvent.click(screen.getByRole("button", { name: s.faster }));
    expect(screen.getByRole("status").textContent).toBe("1.45×");
    fireEvent.click(screen.getByRole("button", { name: s.slower }));
    expect(screen.getByRole("status").textContent).toBe("1.2×");
    expect(screen.queryByRole("combobox")).toBeNull();
  });
  it("clamps to the endpoints and disables further movement", () => {
    mountSpeed(7);
    fireEvent.click(screen.getByRole("button", { name: s.slower }));
    expect(screen.getByRole("status").textContent).toBe("0.25×");
    expect((screen.getByRole("button", { name: s.slower }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    mountSpeed(198);
    fireEvent.click(screen.getByRole("button", { name: s.faster }));
    expect(screen.getByRole("status").textContent).toBe("10×");
    expect((screen.getByRole("button", { name: s.faster }) as HTMLButtonElement).disabled).toBe(true);
  });
});
