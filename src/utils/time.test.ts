import { describe, expect, it } from "bun:test";
import { formatRelativeTime } from "./time";

describe("formatRelativeTime", () => {
  it("should format time just now", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("should format seconds ago", () => {
    const past = new Date(Date.now() - 30 * 1000);
    expect(formatRelativeTime(past)).toBe("30 seconds ago");
  });

  it("should format singular second", () => {
    const past = new Date(Date.now() - 1000);
    expect(formatRelativeTime(past)).toBe("1 second ago");
  });

  it("should format minutes ago", () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("5 minutes ago");
  });

  it("should format singular minute", () => {
    const past = new Date(Date.now() - 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 minute ago");
  });

  it("should format hours ago", () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("3 hours ago");
  });

  it("should format singular hour", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 hour ago");
  });

  it("should format days ago", () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("2 days ago");
  });

  it("should format singular day", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 day ago");
  });

  it("should format weeks ago", () => {
    const past = new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("3 weeks ago");
  });

  it("should format singular week", () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 week ago");
  });

  it("should format months ago", () => {
    const past = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 month ago");
  });

  it("should format years ago", () => {
    const past = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe("1 year ago");
  });

  it("should format future time", () => {
    const future = new Date(Date.now() + 60 * 1000);
    expect(formatRelativeTime(future)).toBe("in 1 minute");
  });

  it("should format future hours", () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(future)).toBe("in 2 hours");
  });
});
