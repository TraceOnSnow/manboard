import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { BoxCard } from "./BoxCard";
const box={id:"inbox",title:"Inbox",layout:{x:0,y:0,w:4,h:6},createdAt:"2026-07-17T00:00:00Z",updatedAt:"2026-07-17T00:00:00Z"};
it("creates a task from the Box quick input",async()=>{const user=userEvent.setup();const onQuickCreate=vi.fn().mockResolvedValue(undefined);render(<BoxCard box={box} tasks={[]} onQuickCreate={onQuickCreate} onRenameBox={vi.fn()} onDeleteBox={vi.fn()} onToggleComplete={vi.fn()} onRenameTask={vi.fn()} onEditTask={vi.fn()}/>);await user.click(screen.getByRole("button",{name:"新增 Inbox"}));await user.type(screen.getByPlaceholderText("写一条待办…"),"New task{Enter}");expect(onQuickCreate).toHaveBeenCalledWith("inbox","New task");});
