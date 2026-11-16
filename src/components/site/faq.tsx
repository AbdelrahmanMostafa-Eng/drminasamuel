"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-3" defaultValue="0">
      {faqs.map((f, i) => (
        <Accordion.Item key={i} value={String(i)} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow data-[state=open]:shadow-lift">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold">
              {f.q}
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-ember-500 group-data-[state=open]:text-white">
                <Plus className="size-4" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden text-sm leading-relaxed text-muted-foreground data-[state=closed]:animate-[acc-up_200ms_ease] data-[state=open]:animate-[acc-down_250ms_ease]">
            <p className="px-5 pb-5">{f.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
