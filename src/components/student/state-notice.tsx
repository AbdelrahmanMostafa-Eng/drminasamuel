import { Info } from "lucide-react";

export function StateNotice({ text }: { text: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
      <Info className="size-5 shrink-0" /> {text}
    </div>
  );
}
