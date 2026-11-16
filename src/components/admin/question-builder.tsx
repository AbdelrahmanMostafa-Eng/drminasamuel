"use client";

import * as React from "react";
import { AnimatePresence, Reorder, useDragControls, type DragControls } from "motion/react";
import { CheckCircle2, Copy, GripVertical, ImagePlus, Plus, Save, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/components/ui/file-upload";
import { useConfirm } from "@/components/ui/confirm";
import { saveQuestionsAction } from "@/actions/admin-assess";
import { useAction } from "./use-action";
import { cn } from "@/lib/utils";

export type BuilderQuestion = {
  key: string;
  id?: string;
  text: string;
  imageKey: string | null;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  points: number;
};

const LETTERS = "ABCDEFGH";
const rid = () => Math.random().toString(36).slice(2, 10);

function blank(): BuilderQuestion {
  const options = Array.from({ length: 4 }, () => ({ id: rid(), text: "" }));
  return { key: rid(), text: "", imageKey: null, options, correctOptionId: "", explanation: "", points: 1 };
}

/** Parses pasted questions: "1. Question", "A) option", mark correct with * or "Answer: B". */
export function parseQuestions(raw: string): BuilderQuestion[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const out: BuilderQuestion[] = [];
  let cur: BuilderQuestion | null = null;
  let answerLetter: string | null = null;
  const flush = () => {
    if (!cur) return;
    if (answerLetter) {
      const idx = LETTERS.indexOf(answerLetter.toUpperCase());
      if (cur.options[idx]) cur.correctOptionId = cur.options[idx]!.id;
    }
    if (cur.text.trim() && cur.options.length >= 2) out.push(cur);
    cur = null;
    answerLetter = null;
  };
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;
    const q = line.match(/^(?:Q?\d+[.)\-:]|\*\*?\d+[.)])\s*(.+)$/i);
    const opt = line.match(/^\(?([A-Ha-h])[.)\]:-]\s*(.+)$/);
    const ans = line.match(/^(?:answer|ans|correct)\s*[:\-]\s*\(?([A-Ha-h])\)?/i);
    const exp = line.match(/^(?:explanation|why|reason)\s*[:\-]\s*(.+)$/i);
    if (ans && cur) answerLetter = ans[1]!;
    else if (exp && cur) cur.explanation = exp[1]!;
    else if (opt && cur) {
      let text = opt[2]!.trim();
      const starred = /(^\*|\*$|✓$|\(correct\)$)/i.test(text);
      text = text.replace(/^\*\s*|\s*\*$|\s*✓$|\s*\(correct\)$/gi, "").trim();
      const o = { id: rid(), text };
      cur.options.push(o);
      if (starred) cur.correctOptionId = o.id;
    } else if (q) {
      flush();
      cur = { key: rid(), text: q[1]!.trim(), imageKey: null, options: [], correctOptionId: "", explanation: "", points: 1 };
    } else if (cur && cur.options.length === 0) {
      cur.text += "\n" + line;
    } else if (!cur) {
      cur = { key: rid(), text: line, imageKey: null, options: [], correctOptionId: "", explanation: "", points: 1 };
    }
  }
  flush();
  return out;
}

export function QuestionBuilder({ assessmentId, courseId, initial, hasSubmissions }: { assessmentId: string; courseId: string; initial: BuilderQuestion[]; hasSubmissions: boolean }) {
  const confirm = useConfirm();
  const [qs, setQs] = React.useState<BuilderQuestion[]>(initial.length ? initial : [blank()]);
  const [dirty, setDirty] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [raw, setRaw] = React.useState("");
  const [uploading, setUploading] = React.useState<string | null>(null);
  const { pending, exec } = useAction();

  React.useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (key: string, patch: Partial<BuilderQuestion>) => {
    setDirty(true);
    setQs((list) => list.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };
  const total = qs.reduce((s, q) => s + (q.points || 0), 0);
  const incomplete = qs.filter((q) => !q.text.trim() || !q.correctOptionId || q.options.some((o) => !o.text.trim())).length;
  const parsed = React.useMemo(() => parseQuestions(raw), [raw]);

  async function save() {
    if (hasSubmissions && !(await confirm({ title: "Save & regrade?", description: "Students have already submitted. Saving will re-score their submissions using the updated correct answers.", confirmLabel: "Save & regrade" }))) return;
    exec(
      () =>
        saveQuestionsAction(
          assessmentId,
          qs.map((q) => ({ id: q.id, text: q.text, imageKey: q.imageKey, options: q.options, correctOptionId: q.correctOptionId, explanation: q.explanation || null, points: q.points })),
        ),
      { onSuccess: () => setDirty(false) },
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-3 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge>{qs.length} questions</Badge>
          <Badge tone="neutral">{total} points</Badge>
          {incomplete > 0 ? <Badge tone="warning">{incomplete} incomplete</Badge> : <Badge tone="success">All complete</Badge>}
          {dirty && <Badge tone="ember">Unsaved changes</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Wand2 className="size-4" /> Quick import
          </Button>
          <Button size="sm" onClick={save} loading={pending} disabled={!dirty && initial.length > 0}>
            <Save className="size-4" /> Save questions
          </Button>
        </div>
      </div>

      <Reorder.Group axis="y" values={qs} onReorder={(v) => { setQs(v); setDirty(true); }} className="space-y-4">
        <AnimatePresence initial={false}>
          {qs.map((q, i) => (
            <DraggableItem key={q.key} value={q}>
              {(controls) => (
              <QuestionCard
                controls={controls}
                q={q}
                index={i}
                uploading={uploading === q.key}
                onChange={(p) => update(q.key, p)}
                onDuplicate={() => {
                  setDirty(true);
                  setQs((l) => {
                    const copy = { ...q, key: rid(), id: undefined, options: q.options.map((o) => ({ ...o, id: rid() })) };
                    const ci = q.options.findIndex((o) => o.id === q.correctOptionId);
                    copy.correctOptionId = ci >= 0 ? copy.options[ci]!.id : "";
                    const next = [...l];
                    next.splice(i + 1, 0, copy);
                    return next;
                  });
                }}
                onDelete={() => {
                  setDirty(true);
                  setQs((l) => l.filter((x) => x.key !== q.key));
                }}
                onImage={async (file) => {
                  setUploading(q.key);
                  try {
                    const up = await uploadFile(file, "question-image", { courseId });
                    update(q.key, { imageKey: up.key });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Upload failed");
                  } finally {
                    setUploading(null);
                  }
                }}
              />
              )}
            </DraggableItem>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <button
        onClick={() => {
          setDirty(true);
          setQs((l) => [...l, blank()]);
        }}
        className="group flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border py-6 font-semibold text-muted-foreground transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 dark:hover:bg-brand-900/20"
      >
        <Plus className="size-5 transition group-hover:rotate-90" /> Add question
      </button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent size="xl" title="Quick import questions" description="Paste questions from Word/Google Docs. Mark the correct option with * or add a line “Answer: B”.">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={16}
              placeholder={"1. Which organelle produces ATP?\nA) Nucleus\nB) Mitochondria *\nC) Ribosome\nD) Golgi body\nExplanation: Cellular respiration happens in the mitochondria.\n\n2. Which blood vessels carry blood away from the heart?\nA) Veins\nB) Arteries\nC) Capillaries\nD) Venules\nAnswer: B"}
              className="field-input w-full rounded-2xl border border-input bg-card p-4 font-mono text-sm outline-none"
            />
            <div className="max-h-[26rem] space-y-2 overflow-y-auto scrollbar-thin rounded-2xl bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview · {parsed.length} detected</p>
              {parsed.map((q, i) => (
                <div key={q.key} className="rounded-xl bg-card p-3 text-sm shadow-soft">
                  <p className="font-semibold">
                    {i + 1}. {q.text}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {q.options.map((o, k) => (
                      <li key={o.id} className={cn("text-xs", o.id === q.correctOptionId ? "font-bold text-emerald-600" : "text-muted-foreground")}>
                        {LETTERS[k]}) {o.text} {o.id === q.correctOptionId && "✓"}
                      </li>
                    ))}
                  </ul>
                  {!q.correctOptionId && <p className="mt-1 text-xs font-semibold text-amber-600">No correct answer marked</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!parsed.length}
              onClick={() => {
                setDirty(true);
                setQs((l) => [...l.filter((q) => q.text.trim() || q.options.some((o) => o.text.trim())), ...parsed]);
                setRaw("");
                setImportOpen(false);
                toast.success(`${parsed.length} questions added — review and save`);
              }}
            >
              Add {parsed.length} questions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraggableItem({ value, children }: { value: BuilderQuestion; children: (c: DragControls) => React.ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={value} dragListener={false} dragControls={controls} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5" whileDrag={{ scale: 1.02, boxShadow: "0 30px 60px -20px rgb(0 0 0 / 0.35)" }}>
      {children(controls)}
    </Reorder.Item>
  );
}

function QuestionCard({
  controls,
  q,
  index,
  onChange,
  onDelete,
  onDuplicate,
  onImage,
  uploading,
}: {
  controls: DragControls;
  q: BuilderQuestion;
  index: number;
  onChange: (p: Partial<BuilderQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onImage: (f: File) => void;
  uploading: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-sm font-extrabold text-white shadow-[0_3px_0_0_#123b4d]">{index + 1}</span>
          <button type="button" onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none rounded-md p-0.5 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing" aria-label="Drag to reorder"><GripVertical className="size-4" /></button>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <textarea
            value={q.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={2}
            placeholder="Type the question…"
            className="field-input w-full resize-y rounded-xl border border-input bg-card px-4 py-3 font-semibold outline-none"
          />
          {q.imageKey && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/files/${q.imageKey}`} alt="" className="max-h-48 rounded-xl border border-border" />
              <button onClick={() => onChange({ imageKey: null })} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-lg bg-black/60 text-white" aria-label="Remove image">
                <X className="size-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const correct = q.correctOptionId === o.id;
              return (
                <div key={o.id} className={cn("flex items-center gap-2 rounded-xl border-2 p-1.5 pl-2 transition", correct ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30" : "border-border")}>
                  <button
                    type="button"
                    onClick={() => onChange({ correctOptionId: o.id })}
                    title="Mark as correct answer"
                    className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold transition", correct ? "bg-emerald-500 text-white shadow-[0_2px_0_0_#08623f]" : "bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700")}
                  >
                    {correct ? <CheckCircle2 className="size-4" /> : LETTERS[k]}
                  </button>
                  <input
                    value={o.text}
                    onChange={(e) => onChange({ options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })}
                    placeholder={`Option ${LETTERS[k]}`}
                    className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onChange({ options: q.options.filter((x) => x.id !== o.id), correctOptionId: correct ? "" : q.correctOptionId })}
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:text-danger"
                      aria-label="Remove option"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {!q.correctOptionId && <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Click a letter to mark the correct answer.</p>}
          <input
            value={q.explanation}
            onChange={(e) => onChange({ explanation: e.target.value })}
            placeholder="Explanation shown after grading (optional)"
            className="field-input h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            {q.options.length < 8 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ options: [...q.options, { id: rid(), text: "" }] })}>
                <Plus className="size-4" /> Option
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" loading={uploading} onClick={() => fileRef.current?.click()}>
              {!uploading && <ImagePlus className="size-4" />} Image
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
            <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Points
              <input type="number" min={1} max={100} value={q.points} onChange={(e) => onChange({ points: Math.max(1, Number(e.target.value) || 1) })} className="field-input h-8 w-16 rounded-lg border border-input bg-card px-2 text-sm outline-none" />
            </label>
            <Button type="button" size="icon-sm" variant="ghost" onClick={onDuplicate} aria-label="Duplicate">
              <Copy className="size-4" />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" className="hover:text-danger" onClick={onDelete} aria-label="Delete question">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
