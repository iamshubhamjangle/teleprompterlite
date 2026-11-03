import { describe, expect, it } from "vitest";
import { filterAnalyticsEvent } from "@/lib/analytics";

describe("analytics privacy", () => {
  it("drops presenter session events, including custom events", () => {
    expect(filterAnalyticsEvent({ type: "pageview", url: "https://site.dev/presenter?session=private-session" })).toBeNull();
    expect(filterAnalyticsEvent({ type: "event", url: "https://site.dev/presenter/?session=private-session" })).toBeNull();
  });

  it("keeps ordinary page counts without query values or fragments", () => {
    expect(filterAnalyticsEvent({ type: "pageview", url: "https://site.dev/editor?script=private-text#private-anchor" })).toEqual({
      type: "pageview", url: "https://site.dev/editor",
    });
    expect(filterAnalyticsEvent({ type: "pageview", url: "https://site.dev/" })).toEqual({
      type: "pageview", url: "https://site.dev/",
    });
  });

  it("drops malformed event URLs", () => {
    expect(filterAnalyticsEvent({ type: "pageview", url: "invalid" })).toBeNull();
  });
});
