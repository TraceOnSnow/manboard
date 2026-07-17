import type { BoxLayout, Task, TaskCreate } from "../types/board";

export function sortTasksForBox(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (left, right) =>
      Number(left.completedAt !== null) - Number(right.completedAt !== null) || left.position - right.position,
  );
}

export function createQuickTaskInput(boxId: string, title: string): TaskCreate {
  return { title: title.trim(), boxId };
}

function overlaps(left: BoxLayout, right: BoxLayout): boolean {
  return (
    left.x < right.x + right.w &&
    left.x + left.w > right.x &&
    left.y < right.y + right.h &&
    left.y + left.h > right.y
  );
}

export function findFirstLayout(layouts: BoxLayout[]): BoxLayout {
  const candidate = { w: 4, h: 6 };
  const maxY = Math.max(0, ...layouts.map((layout) => layout.y + layout.h));

  for (let y = 0; y <= maxY; y += 1) {
    for (const x of [0, 4, 8]) {
      const next = { x, y, ...candidate };
      if (!layouts.some((layout) => overlaps(next, layout))) {
        return next;
      }
    }
  }

  return { x: 0, y: maxY, ...candidate };
}
