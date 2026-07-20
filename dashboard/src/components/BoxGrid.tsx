import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Box, BoxLayout, Task } from "../types/board";
import { BoxCard } from "./BoxCard";

const COLUMNS = 12;
const ROW_HEIGHT = 44;
const GAP = 16;
const MIN_BOARD_WIDTH = 768;
const MIN_WIDTH = 1;
const MIN_HEIGHT = 2;

type LayoutItem = BoxLayout & { i: string };
export type BoardLayout = LayoutItem[];

type Interaction = {
  boxId: string;
  kind: "drag" | "resize";
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startLayout: LayoutItem;
  latestLayout: BoardLayout;
};

type Props = {
  boxes: Box[];
  tasks: Task[];
  onLayoutCommit: (layouts: BoardLayout) => void;
  onQuickCreate: (boxId: string, title: string) => Promise<void>;
  onRenameBox: (box: Box, title: string) => Promise<void>;
  onDeleteBox: (box: Box) => void;
  onToggleComplete: (task: Task) => void;
  onRenameTask: (task: Task, title: string) => Promise<void>;
  onEditTask: (task: Task) => void;
};

function toLayout(boxes: Box[]): BoardLayout {
  return boxes.map((box) => ({ i: box.id, ...box.layout }));
}

function layoutsEqual(left: BoardLayout, right: BoardLayout): boolean {
  return left.every((item) => {
    const other = right.find((candidate) => candidate.i === item.i);
    return other !== undefined && item.x === other.x && item.y === other.y && item.w === other.w && item.h === other.h;
  });
}

function overlaps(left: BoxLayout, right: BoxLayout): boolean {
  return left.x < right.x + right.w && left.x + left.w > right.x && left.y < right.y + right.h && left.y + left.h > right.y;
}

export function BoxGrid(props: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const [layout, setLayout] = useState<BoardLayout>(() => toLayout(props.boxes));
  const layoutRef = useRef(layout);

  const replaceLayout = useCallback((nextLayout: BoardLayout) => {
    layoutRef.current = nextLayout;
    setLayout(nextLayout);
  }, []);

  useEffect(() => {
    if (!interactionRef.current) {
      replaceLayout(toLayout(props.boxes));
    }
  }, [props.boxes, replaceLayout]);

  const beginInteraction = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, boxId: string, kind: Interaction["kind"]) => {
      const startLayout = layoutRef.current.find((item) => item.i === boxId);
      const board = boardRef.current;
      if (!startLayout || !board) return;

      event.preventDefault();
      board.setPointerCapture?.(event.pointerId);
      interactionRef.current = {
        boxId,
        kind,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startLayout,
        latestLayout: layoutRef.current,
      };
    },
    [],
  );

  const moveInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const interaction = interactionRef.current;
      const board = boardRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId || !board) return;

      const rect = board.getBoundingClientRect();
      const columnWidth = (rect.width - GAP * (COLUMNS - 1)) / COLUMNS;
      const columnStep = columnWidth + GAP;
      const rowStep = ROW_HEIGHT + GAP;
      const columnDelta = Math.round((event.clientX - interaction.startClientX) / columnStep);
      const rowDelta = Math.round((event.clientY - interaction.startClientY) / rowStep);
      const initial = interaction.startLayout;
      const candidate: LayoutItem = interaction.kind === "drag"
        ? {
            ...initial,
            x: Math.max(0, Math.min(COLUMNS - initial.w, initial.x + columnDelta)),
            y: Math.max(0, initial.y + rowDelta),
          }
        : {
            ...initial,
            w: Math.max(MIN_WIDTH, Math.min(COLUMNS - initial.x, initial.w + columnDelta)),
            h: Math.max(MIN_HEIGHT, initial.h + rowDelta),
          };

      const nextLayout = layoutRef.current.map((item) => (item.i === interaction.boxId ? candidate : item));
      if (nextLayout.some((item) => item.i !== candidate.i && overlaps(candidate, item))) return;

      interaction.latestLayout = nextLayout;
      replaceLayout(nextLayout);
    },
    [replaceLayout],
  );

  const finishInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const interaction = interactionRef.current;
      const board = boardRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;

      board?.releasePointerCapture?.(event.pointerId);
      interactionRef.current = null;
      if (!layoutsEqual(interaction.latestLayout, toLayout(props.boxes))) {
        props.onLayoutCommit(interaction.latestLayout);
      }
    },
    [props.boxes, props.onLayoutCommit],
  );

  const cancelInteraction = useCallback(() => {
    interactionRef.current = null;
    replaceLayout(toLayout(props.boxes));
  }, [props.boxes, replaceLayout]);

  const boardRows = Math.max(6, ...layout.map((item) => item.y + item.h));

  return (
    <div className="overflow-x-auto pb-2">
      <div
        ref={boardRef}
        className="box-grid grid min-w-[768px] gap-4"
        style={{
          gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardRows}, ${ROW_HEIGHT}px)`,
          minWidth: MIN_BOARD_WIDTH,
        }}
        onPointerMove={moveInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={cancelInteraction}
      >
        {props.boxes.map((box) => {
          const item = layout.find((candidate) => candidate.i === box.id) ?? { i: box.id, ...box.layout };
          return (
            <div
              key={box.id}
              className="min-h-0"
              style={{
                gridColumn: `${item.x + 1} / span ${item.w}`,
                gridRow: `${item.y + 1} / span ${item.h}`,
              }}
            >
              <BoxCard
                box={box}
                tasks={props.tasks.filter((task) => task.boxId === box.id)}
                onQuickCreate={props.onQuickCreate}
                onRenameBox={props.onRenameBox}
                onDeleteBox={props.onDeleteBox}
                onToggleComplete={props.onToggleComplete}
                onRenameTask={props.onRenameTask}
                onEditTask={props.onEditTask}
                onStartDrag={(event) => beginInteraction(event, box.id, "drag")}
                onStartResize={(event) => beginInteraction(event, box.id, "resize")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
