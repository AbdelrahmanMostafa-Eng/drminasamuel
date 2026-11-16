"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  typeToConfirm?: string;
};

const Ctx = React.createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = React.useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = React.useState("");
  const resolver = React.useRef<(v: boolean) => void>(null);
  const confirm = React.useCallback((o: ConfirmOptions) => {
    setOpts(o);
    setTyped("");
    return new Promise<boolean>((res) => {
      resolver.current = res;
    });
  }, []);
  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  const blocked = !!opts?.typeToConfirm && typed.trim() !== opts.typeToConfirm;
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <D.Root open={!!opts} onOpenChange={(o) => !o && close(false)}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-[60] bg-brand-950/55 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease]" />
          <D.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl data-[state=open]:animate-[dialog-in_260ms_cubic-bezier(0.2,0.9,0.3,1.2)]">
            <div className="flex gap-4">
              <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${opts?.danger ? "bg-red-50 text-danger dark:bg-red-950/40" : "bg-brand-50 text-brand-600 dark:bg-brand-900/40"}`}>
                <AlertTriangle className="size-6" />
              </div>
              <div className="min-w-0">
                <D.Title className="text-lg font-bold">{opts?.title}</D.Title>
                <D.Description asChild>
                  <div className="mt-1.5 text-sm text-muted-foreground">{opts?.description}</div>
                </D.Description>
              </div>
            </div>
            {opts?.typeToConfirm && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Type <span className="font-bold text-foreground">{opts.typeToConfirm}</span> to confirm
                </p>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="field-input h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none"
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button variant={opts?.danger ? "danger" : "primary"} disabled={blocked} onClick={() => close(true)}>
                {opts?.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </Ctx.Provider>
  );
}

export function useConfirm() {
  return React.useContext(Ctx);
}
