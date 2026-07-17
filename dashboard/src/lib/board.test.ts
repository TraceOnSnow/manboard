import { describe, expect, it } from "vitest";
import { createQuickTaskInput, findFirstLayout, sortTasksForBox } from "./board";
import type { Task } from "../types/board";

describe("board helpers", () => {
  it("places open tasks before completed tasks while preserving position", () => {
    expect(
      sortTasksForBox([
        { id: "done", completedAt: "2026-07-17T09:00:00Z", position: 0 },
        { id: "open-two", completedAt: null, position: 2 },
        { id: "open-one", completedAt: null, position: 1 },
      ] as Task[]).map((task) => task.id),
    ).toEqual(["open-one", "open-two", "done"]);
  });

  it("creates an Inbox quick task with trimmed title and no hidden status", () => {
    expect(createQuickTaskInput("box-1", "  Capture this ")).toEqual({
      title: "Capture this",
      boxId: "box-1",
    });
  });

  it("finds the first free row for a new four-column box", () => {
    expect(
      findFirstLayout([
        { x: 0, y: 0, w: 4, h: 6 },
        { x: 4, y: 0, w: 4, h: 6 },
      ]),
    ).toEqual({ x: 8, y: 0, w: 4, h: 6 });
  });
});
