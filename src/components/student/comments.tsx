"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Reply, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCommentAction, postCommentAction } from "@/actions/student";

export type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string; avatar: string | null };
  replies: Omit<CommentData, "replies">[];
};

const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function Comments({ lessonId, comments, meId, staff }: { lessonId: string; comments: CommentData[]; meId: string; staff: boolean }) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [pending, start] = React.useTransition();

  const send = (body: string, parentId?: string, after?: () => void) =>
    start(async () => {
      const r = await postCommentAction(lessonId, body, parentId);
      if (!r.ok) return void toast.error(r.error);
      after?.();
      router.refresh();
    });
  const del = (id: string) =>
    start(async () => {
      const r = await deleteCommentAction(id);
      if (!r.ok) return void toast.error(r.error);
      router.refresh();
    });

  const Item = ({ c, isReply }: { c: Omit<CommentData, "replies">; isReply?: boolean }) => (
    <div className={isReply ? "mt-3 flex gap-3" : "flex gap-3"}>
      <Avatar name={c.author.name} src={c.author.avatar} size={isReply ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-muted/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{c.author.name}</p>
            {c.author.role !== "STUDENT" && <Badge tone="ember">{c.author.role === "MASTER" ? "Dr. Mina" : "Assistant"}</Badge>}
            <span className="text-[0.7rem] text-muted-foreground">{df.format(new Date(c.createdAt))}</span>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{c.body}</p>
        </div>
        <div className="mt-1 flex gap-3 px-2 text-xs font-semibold text-muted-foreground">
          {!isReply && (
            <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="inline-flex items-center gap-1 hover:text-foreground">
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          {(c.author.id === meId || staff) && (
            <button onClick={() => del(c.id)} className="inline-flex items-center gap-1 hover:text-danger">
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div id="qa" className="scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="size-5 text-brand-500" />
        <h3 className="font-bold">Questions about this lesson</h3>
        <Badge tone="neutral">{comments.length}</Badge>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text, undefined, () => setText(""));
        }}
        className="mt-4 flex gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={staff ? "Post a note for students…" : "Ask Dr. Mina or the assistants a question…"}
          className="field-input min-h-12 flex-1 resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none"
        />
        <Button type="submit" size="icon" loading={pending} disabled={text.trim().length < 2} aria-label="Send">
          {!pending && <Send className="size-4" />}
        </Button>
      </form>
      <div className="mt-6 space-y-5">
        {comments.length === 0 && <p className="text-center text-sm text-muted-foreground">No questions yet. Be the first to ask!</p>}
        {comments.map((c) => (
          <div key={c.id}>
            <Item c={c} />
            <div className="ml-12">
              {c.replies.map((r) => (
                <Item key={r.id} c={r} isReply />
              ))}
              {replyTo === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(reply, c.id, () => {
                      setReply("");
                      setReplyTo(null);
                    });
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input autoFocus value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="field-input h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none" />
                  <Button type="submit" size="sm" loading={pending}>
                    Reply
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
