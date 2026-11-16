"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Result<T> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Runs a server action with a pending state, toasts, and a router refresh. */
export function useAction() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const exec = React.useCallback(
    <T,>(fn: () => Promise<Result<T>>, opts: { onSuccess?: (data: T | undefined) => void; refresh?: boolean; silent?: boolean } = {}) =>
      new Promise<T | undefined>((resolve) => {
        start(async () => {
          const r = await fn();
          if (!r.ok) {
            toast.error(r.error);
            resolve(undefined);
            return;
          }
          if (!opts.silent && r.message) toast.success(r.message);
          opts.onSuccess?.(r.data);
          if (opts.refresh !== false) router.refresh();
          resolve(r.data);
        });
      }),
    [router],
  );
  return { pending, exec };
}
