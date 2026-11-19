"use client";

import * as React from "react";
import Link from "next/link";
import { RollText } from "./roll-text";

export type Viewer = { name: string; role: string } | null;

const ViewerContext = React.createContext<{ viewer: Viewer; ready: boolean }>({ viewer: null, ready: false });

/**
 * Public pages are static (cached and prefetched, so links open instantly). The only
 * per-visitor detail they show, who is signed in, is fetched here once per visit to the site.
 */
export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ viewer: Viewer; ready: boolean }>({ viewer: null, ready: false });
  React.useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: Viewer }) => alive && setState({ viewer: d.user ?? null, ready: true }))
      .catch(() => alive && setState({ viewer: null, ready: true }));
    return () => {
      alive = false;
    };
  }, []);
  return <ViewerContext.Provider value={state}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  return React.useContext(ViewerContext);
}

export function dashboardHref(viewer: Viewer) {
  return viewer?.role === "STUDENT" ? "/dashboard" : "/admin";
}

/** A link whose target and label change once we know the visitor is signed in ("@dashboard" = their dashboard). */
export function ViewerLink({
  guest,
  member,
  className,
  children,
}: {
  guest: { href: string; label: string };
  member: { href: string; label: string };
  className?: string;
  children?: React.ReactNode;
}) {
  const { viewer } = useViewer();
  const t = viewer ? member : guest;
  const href = t.href === "@dashboard" ? dashboardHref(viewer) : t.href;
  return (
    <Link href={href} className={className}>
      <RollText>{t.label}</RollText>
      {children}
    </Link>
  );
}
