import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskRow } from "./TaskRow";
import type { Task } from "../types/board";
const task: Task = { id:"task-1",title:"Draft brief",boxId:"inbox",tags:[],priority:null,dueDate:null,details:null,completedAt:null,position:0,createdAt:"2026-07-17T00:00:00Z",updatedAt:"2026-07-17T00:00:00Z" };
describe("TaskRow",()=>{it("keeps completion, inline rename, and drawer editing as separate actions",async()=>{const user=userEvent.setup();const onToggleComplete=vi.fn();const onRename=vi.fn().mockResolvedValue(undefined);const onEdit=vi.fn();render(<TaskRow task={task} onToggleComplete={onToggleComplete} onRename={onRename} onEdit={onEdit}/>);await user.click(screen.getByRole("checkbox",{name:"完成“Draft brief”"}));expect(onToggleComplete).toHaveBeenCalledWith(task);await user.click(screen.getByRole("button",{name:"Draft brief"}));const input=screen.getByDisplayValue("Draft brief");await user.clear(input);await user.type(input,"Renamed brief{Enter}");expect(onRename).toHaveBeenCalledWith(task,"Renamed brief");await user.click(screen.getByRole("button",{name:"编辑“Draft brief”"}));expect(onEdit).toHaveBeenCalledWith(task);});});
