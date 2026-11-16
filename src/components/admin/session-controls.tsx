"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Square, Trash2, UserCheck, UserX, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { deleteSessionAction, endSessionNowAction, setAttendanceAction } from "@/actions/admin-assess";
import { useAction } from "./use-action";

export function EndSessionButton({ id }: { id: string }) {
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  return (
    <Button
      variant="danger"
      loading={pending}
      onClick={async () => {
        if (await confirm({ title: "End the session now?", description: "Attendance locks immediately: students who haven't joined become absent and excuses close. The PDF report unlocks.", danger: true, confirmLabel: "End session" }))
          exec(() => endSessionNowAction(id));
      }}
    >
      {!pending && <Square className="size-4" />} End session now
    </Button>
  );
}

export function DeleteSessionButton({ id }: { id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  return (
    <Button
      variant="ghost"
      className="hover:text-danger"
      loading={pending}
      onClick={async () => {
        if (await confirm({ title: "Delete this session?", description: "Its attendance records will be deleted too.", danger: true, confirmLabel: "Delete", typeToConfirm: "DELETE" }))
          exec(() => deleteSessionAction(id), { refresh: false, onSuccess: () => router.push("/admin/schedule") });
      }}
    >
      {!pending && <Trash2 className="size-4" />}
    </Button>
  );
}

export function AttendanceMenu({ sessionId, userId, override }: { sessionId: string; userId: string; override: "PRESENT" | "ABSENT" | null }) {
  const { pending, exec } = useAction();
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button size="icon-sm" variant="ghost" loading={pending} aria-label="Adjust attendance">
          {!pending && <MoreHorizontal className="size-4" />}
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem onSelect={() => exec(() => setAttendanceAction(sessionId, userId, "PRESENT"))}>
          <UserCheck /> Mark present
        </DropdownItem>
        <DropdownItem onSelect={() => exec(() => setAttendanceAction(sessionId, userId, "ABSENT"))}>
          <UserX /> Mark absent
        </DropdownItem>
        {override && (
          <DropdownItem onSelect={() => exec(() => setAttendanceAction(sessionId, userId, null))}>
            <Undo2 /> Use automatic (click) status
          </DropdownItem>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
