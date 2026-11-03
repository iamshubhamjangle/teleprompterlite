"use client";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_KEY } from "@/lib/model";
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme={pathname === "/editor" ? undefined : "light"}
      enableSystem={false}
      storageKey={THEME_KEY}
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
