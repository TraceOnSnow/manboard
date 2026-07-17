import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TaskDrawer } from "./TaskDrawer";
const box={id:"inbox",title:"Inbox",layout:{x:0,y:0,w:4,h:6},createdAt:"2026-07-17T00:00:00Z",updatedAt:"2026-07-17T00:00:00Z"};
const task={id:"task",title:"Draft",boxId:"inbox",tags:[],priority:null,dueDate:null,details:null,completedAt:null,position:0,createdAt:"2026-07-17T00:00:00Z",updatedAt:"2026-07-17T00:00:00Z"};
it("shows the simplified task fields without a status",()=>{render(<TaskDrawer task={task} boxes={[box]} onSubmit={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()}/>);for(const label of ["标签","优先级","截止日期","所属 Box","详情"]){expect(screen.getByText(label)).not.toBeNull();}expect(screen.queryByText("状态")).toBeNull();});
