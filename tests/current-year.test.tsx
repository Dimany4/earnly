// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { CurrentYear } from "@/components/landing/CurrentYear";
import { SiteFooter } from "@/components/landing/SiteFooter";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("footer year", () => {
  it("updates a previous year's static footer without a hydration mismatch", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 11, 31, 12));

    // Evaluate the Server Component once, as a static build would. Hydration
    // receives this same tree/initialYear rather than re-running it in 2027.
    const footer = SiteFooter();
    const html = renderToString(footer);
    expect(html).toMatch(/© .*2026/);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    vi.setSystemTime(new Date(2027, 0, 1, 12));
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, footer, { onRecoverableError });
      });

      expect(container.textContent).toContain("© 2027 Earnly.");
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("refreshes the year when an existing page is revisited after rollover", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 11, 31, 12));
    const { container } = render(<CurrentYear initialYear={2026} />);
    expect(container.textContent).toBe("2026");

    vi.setSystemTime(new Date(2027, 0, 1, 12));
    act(() => window.dispatchEvent(new Event("focus")));
    expect(container.textContent).toBe("2027");
  });
});
