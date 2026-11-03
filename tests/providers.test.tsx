import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTheme } from "next-themes";
import { Providers } from "@/components/providers";
import { THEME_KEY } from "@/lib/model";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

function ThemeControl() {
  const { setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>Use dark</button>;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  vi.stubGlobal("matchMedia", () => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("route theme policy", () => {
  it.each(["/", "/blog", "/docs/getting-started", "/guides/laptop-phone-setup", "/presenter", "/unknown"])("forces %s to light without replacing the saved editor preference", async (pathname) => {
    route.pathname = pathname;
    localStorage.setItem(THEME_KEY, "dark");
    render(<Providers><div>Page</div></Providers>);
    await waitFor(() => expect(document.documentElement.classList.contains("light")).toBe(true));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("restores the editor choice after navigating through a light page", async () => {
    route.pathname = "/editor";
    localStorage.setItem(THEME_KEY, "light");
    const view = render(<Providers><ThemeControl /></Providers>);
    await waitFor(() => expect(document.documentElement.classList.contains("light")).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Use dark" }));
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    route.pathname = "/blog";
    view.rerender(<Providers><ThemeControl /></Providers>);
    await waitFor(() => expect(document.documentElement.classList.contains("light")).toBe(true));
    route.pathname = "/editor";
    view.rerender(<Providers><ThemeControl /></Providers>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  });
});
