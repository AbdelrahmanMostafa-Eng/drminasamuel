"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { MonitorSmartphone } from "lucide-react";

const MESSAGES: Record<string, { title: string; body: string }> = {
  NEW_DEVICE: {
    title: "Signed in on another device",
    body: "Your account was just used to sign in on a different device, so this one has been signed out. Each account works on one device at a time.",
  },
  ADMIN: { title: "You've been signed out", body: "An administrator ended this session. Please sign in again." },
  SUSPENDED: { title: "Account paused", body: "This account has been suspended. Contact the Bioacademy team on WhatsApp." },
  PASSWORD_CHANGED: { title: "Password changed", body: "Your password was changed, so please sign in again." },
  EXPIRED: { title: "Session expired", body: "Please sign in again to continue." },
  NONE: { title: "Signed out", body: "Please sign in again to continue." },
};

/**
 * One-device rule, client half: a light heartbeat (every 15s + on focus) that
 * detects when this device's session was revoked by a newer login and kicks it out.
 */
export function SessionGuard() {
  const [reason, setReason] = React.useState<string | null>(null);
  React.useEffect(() => {
    let stopped = false;
    async function check() {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/auth/ping", { cache: "no-store" });
        if (r.status === 401) {
          const j = await r.json().catch(() => ({}));
          stopped = true;
          setReason(j.reason ?? "NONE");
          setTimeout(() => window.location.assign(`/login?reason=${j.reason ?? "NONE"}`), 4500);
        }
      } catch {
        /* offline — try later */
      }
    }
    const iv = setInterval(check, 15000);
    const onVis = () => check();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      stopped = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);
  const msg = reason ? (MESSAGES[reason] ?? MESSAGES.NONE!) : null;
  return (
    <AnimatePresence>
      {msg && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[#111]/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lift"
          >
            <div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl border border-border text-foreground/70">
              <MonitorSmartphone className="size-6" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-light tracking-tight">{msg.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{msg.body}</p>
            <button
              onClick={() => window.location.assign(`/login?reason=${reason}`)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-85"
            >
              Go to sign in
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
