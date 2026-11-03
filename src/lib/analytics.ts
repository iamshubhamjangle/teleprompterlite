import type { BeforeSend } from "@vercel/analytics";

// Popup session identifiers and arbitrary query values must stay out of telemetry.
export const filterAnalyticsEvent: BeforeSend = (event) => {
  try {
    const url = new URL(event.url);
    if (url.pathname === "/presenter" || url.pathname.startsWith("/presenter/")) return null;
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
};
