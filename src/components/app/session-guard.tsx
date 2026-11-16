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
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-brand-950/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            initial={{ y: 30, scale: 0.92, rotateX: 12 }}
            animate={{ y: 0, scale: 1, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-ember-300 to-ember-500 text-white shadow-[0_5px_0_0_#b94a07]">
              <MonitorSmartphone className="size-8" />
            </div>
            <h2 className="text-xl font-extrabold">{msg.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{msg.body}</p>
            <button
              onClick={() => window.location.assign(`/login?reason=${reason}`)}
              className="btn-3d btn-depth-brand mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 font-semibold text-white"
            >
              Go to sign in
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
