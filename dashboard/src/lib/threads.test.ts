import { describe, expect, it } from "vitest";
import {
  isInboxThread,
  quickCaptureInput,
  sortByRecent,
  sortTodayTodos,
} from "./threads";
import type { Thread } from "../types/thread";

const thread = (overrides: Partial<Thread>): Thread => ({
  id: "thread",
  title: "Test thread",
  type: "todo",
  status: "active",
  priority: "next",
  horizon: "none",
  lastTouched: "2026-07-14T00:00:00.000Z",
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
  ...overrides,
});

describe("dashboard thread views", () => {
  it("uses the existing other/none shape for Inbox", () => {
    expect(isInboxThread(thread({ type: "other", horizon: "none" }))).toBe(true);
    expect(isInboxThread(thread({ type: "other", horizon: "today" }))).toBe(false);
  });

  it("creates frictionless capture records with safe defaults", () => {
    expect(quickCaptureInput("  Remember this  ")).toEqual({
      title: "Remember this",
      type: "other",
      status: "active",
      priority: "next",
      horizon: "none",
    });
  });

  it("places unfinished, high-priority today tasks first", () => {
    const sorted = sortTodayTodos([
      thread({ id: "done", status: "done", priority: "now" }),
      thread({ id: "later", priority: "later" }),
      thread({ id: "now", priority: "now" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["now", "later", "done"]);
  });

  it("sorts long-lived content by most recent update", () => {
    const sorted = sortByRecent([
      thread({ id: "old", updatedAt: "2026-07-10T00:00:00.000Z" }),
      thread({ id: "new", updatedAt: "2026-07-14T00:00:00.000Z" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["new", "old"]);
  });
});
