import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("uses project tokens and shared taller control height", () => {
    const html = renderToStaticMarkup(<Input type="date" />);

    expect(html).toContain("h-10.5");
    expect(html).toContain("rounded-input");
    expect(html).toContain("bg-background");
    expect(html).toContain("max-w-full");
    expect(html).toContain("appearance-none");
    expect(html).toContain("px-2");
    expect(html).toContain("py-0");
    expect(html).toContain("text-sm");
    expect(html).toContain("leading-none");
    expect(html).toContain("[&amp;::-webkit-date-and-time-value]:flex");
    expect(html).toContain("[&amp;::-webkit-date-and-time-value]:h-full");
    expect(html).toContain("[&amp;::-webkit-date-and-time-value]:min-w-0");
    expect(html).toContain("[&amp;::-webkit-date-and-time-value]:items-center");
    expect(html).toContain("[&amp;::-webkit-date-and-time-value]:text-left");
    expect(html).toContain("focus-visible:ring-[3px]");
    expect(html).not.toContain('lang="en-CA"');
    expect(html).not.toContain("text-base");
  });
});
