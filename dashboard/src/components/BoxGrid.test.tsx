import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BoxGrid } from "./BoxGrid";

const box = {
  id: "inbox",
  title: "Inbox",
  layout: { x: 0, y: 0, w: 4, h: 6 },
  createdAt: "2026-07-17T00:00:00Z",
  updatedAt: "2026-07-17T00:00:00Z",
};

it("commits a new grid position when the Box drag handle is moved", () => {
  const onLayoutCommit = vi.fn();
  const { container } = render(
    <BoxGrid
      boxes={[box]}
      tasks={[]}
      onLayoutCommit={onLayoutCommit}
      onQuickCreate={vi.fn()}
      onRenameBox={vi.fn()}
      onDeleteBox={vi.fn()}
      onToggleComplete={vi.fn()}
      onRenameTask={vi.fn()}
      onEditTask={vi.fn()}
    />,
  );
  const grid = container.querySelector(".box-grid");
  if (!grid) throw new Error("Board grid was not rendered");
  Object.defineProperty(grid, "getBoundingClientRect", {
    value: () => ({ left: 0, top: 0, width: 1200, height: 600, right: 1200, bottom: 600 }),
  });

  fireEvent.pointerDown(screen.getByRole("button", { name: "拖动 Box" }), {
    pointerId: 1,
    clientX: 120,
    clientY: 80,
  });
  fireEvent.pointerMove(grid, { pointerId: 1, clientX: 520, clientY: 80 });
  fireEvent.pointerUp(grid, { pointerId: 1, clientX: 520, clientY: 80 });

  expect(onLayoutCommit).toHaveBeenCalledWith([
    expect.objectContaining({ i: "inbox", x: 4, y: 0, w: 4, h: 6 }),
  ]);
});

it("commits a new grid size when the resize control is moved", () => {
  const onLayoutCommit = vi.fn();
  const { container } = render(
    <BoxGrid
      boxes={[box]}
      tasks={[]}
      onLayoutCommit={onLayoutCommit}
      onQuickCreate={vi.fn()}
      onRenameBox={vi.fn()}
      onDeleteBox={vi.fn()}
      onToggleComplete={vi.fn()}
      onRenameTask={vi.fn()}
      onEditTask={vi.fn()}
    />,
  );
  const grid = container.querySelector(".box-grid");
  if (!grid) throw new Error("Board grid was not rendered");
  Object.defineProperty(grid, "getBoundingClientRect", {
    value: () => ({ left: 0, top: 0, width: 1200, height: 600, right: 1200, bottom: 600 }),
  });

  fireEvent.pointerDown(screen.getByRole("button", { name: "调整 Box 大小" }), {
    pointerId: 2,
    clientX: 350,
    clientY: 300,
  });
  fireEvent.pointerMove(grid, { pointerId: 2, clientX: 550, clientY: 420 });
  fireEvent.pointerUp(grid, { pointerId: 2, clientX: 550, clientY: 420 });

  expect(onLayoutCommit).toHaveBeenCalledWith([
    expect.objectContaining({ i: "inbox", x: 0, y: 0, w: 6, h: 8 }),
  ]);
});
