import type { CSSProperties, ReactNode } from "react";

/**
 * The big "BIOACADEMY" word under the footer (portfolio-template style), with small animals living on it:
 * swallows and a butterfly flying above, a chameleon walking along the letter tops, a snail on the D,
 * a bat hanging from the E and a spider on its thread from the C. Vector drawings animated with CSS
 * (transform only) — they stay still for visitors who prefer reduced motion.
 */

const PAPER = "#f5f4f0";
const origin = (x: number, y: number): CSSProperties => ({ transformBox: "view-box", transformOrigin: `${x}px ${y}px` });

/** Barn swallow seen from above: long swept wings, deeply forked tail streamers. */
function Swallow({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={style} aria-hidden>
      <g className="fw-flap" style={origin(68, 40)}>
        <path d="M71 37.6c-1.6-7.6-6.4-15.4-13.2-22.2C51.6 9.2 45 5.2 37.6 2.6c8.6 6.6 14.8 13.6 19.4 21 3 4.8 5 9.4 6.2 14Z" />
        <path d="M71 42.4c-1.6 7.6-6.4 15.4-13.2 22.2-6.2 6.2-12.8 10.2-20.2 12.8 8.6-6.6 14.8-13.6 19.4-21 3-4.8 5-9.4 6.2-14Z" />
        <path d="M66 35.6C60 26 52 17 42 9.6M64 37C57.4 29 50 22 41.6 16.4M66 44.4C60 54 52 63 42 70.4M64 43C57.4 51 50 58 41.6 63.6" fill="none" stroke={PAPER} strokeWidth=".55" opacity=".35" />
      </g>
      <path d="M49 38.6c-9-1.8-19-5.6-35-11.1 12 5.9 20 9.3 26 11.7-5 .4-5 1.2 0 1.6-6 2.4-14 5.8-26 11.7 16-5.5 26-9.3 35-11.1Z" />
      <path d="M47 38.2c8-1.8 19-2.6 28-2 5 .3 9 1.4 12.5 3 1.1.5 1.1 1.1 0 1.6-3.5 1.6-7.5 2.7-12.5 3-9 .6-20-.2-28-2Z" />
      <path d="m87.4 39.4 3.6.6-3.6.6Z" />
      <path d="M58 40h22" stroke={PAPER} strokeWidth=".6" opacity=".25" />
    </svg>
  );
}

/** A monarch-like butterfly from above: veined fore- and hindwings, spotted margins, clubbed antennae. */
function Butterfly({ className, style }: { className?: string; style?: CSSProperties }) {
  const fore = "M48 30C42 22 34 12 22 7 14 4 6 5 4 9c-1 4 2 9 6 13 6 6 16 11 26 13 6 1 10 0 12-2Z";
  const hind = "M48 36c-6 1-14 4-20 10-5 5-7 12-4 17 3 4 9 4 14 0 4-4 7-11 9-18 1-4 1.5-7 1-9Z";
  const veins = "M47 31C38 22 26 12 12 8M46.6 32.4C36 27 24 22 8 16M46 33.6C36 31 24 29 12 24M47.4 37.6C40 44 33 52 28 61M47.6 39C43 47 40 55 37 62";
  const spots = [[8, 10], [13, 8.4], [6.6, 15], [26, 59], [30, 63], [24, 54]];
  const side = (
    <>
      <path d={fore} />
      <path d={hind} opacity=".88" />
      <path d={veins} fill="none" stroke={PAPER} strokeWidth=".6" opacity=".38" />
      {spots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" fill={PAPER} opacity=".7" />
      ))}
    </>
  );
  return (
    <svg viewBox="0 0 100 80" className={className} style={style} aria-hidden>
      <g className="fw-flutter" style={origin(50, 34)}>
        {side}
        <g transform="translate(100 0) scale(-1 1)">{side}</g>
      </g>
      <ellipse cx="50" cy="33" rx="2.4" ry="5.8" />
      <ellipse cx="50" cy="46.5" rx="1.8" ry="9" />
      <circle cx="50" cy="25.8" r="2.3" />
      <path d="M49.2 24.2c-1.4-5-3.6-9-6.8-11.6M50.8 24.2c1.4-5 3.6-9 6.8-11.6" fill="none" stroke="currentColor" strokeWidth=".7" strokeLinecap="round" />
      <circle cx="42.4" cy="12.6" r="1" />
      <circle cx="57.6" cy="12.6" r="1" />
    </svg>
  );
}

/** Veiled chameleon in profile: casque, crested back, turret eye, coiled prehensile tail, gripping feet. */
function Chameleon({ className, style }: { className?: string; style?: CSSProperties }) {
  const limb = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 160 70" className={`fw-sway ${className ?? ""}`} style={style} aria-hidden>
      {/* far-side legs */}
      <g className="fw-leg-a" style={origin(55, 46)} opacity=".42">
        <path d="M55 46 51 55.5 55.5 63" {...limb} strokeWidth="3" />
        <path d="m52 64.6 3.5-2 3.5 2" {...limb} strokeWidth="1.6" />
      </g>
      <g className="fw-leg-b" style={origin(100, 45)} opacity=".42">
        <path d="m100 45 4.6 9.5L100 62.5" {...limb} strokeWidth="3" />
        <path d="m96.6 64.2 3.4-2 3.6 2" {...limb} strokeWidth="1.6" />
      </g>
      {/* tail coil */}
      <path d="M40 42c-10 0-18 2-22 8-4 6-2 13 4 15 6 2 11-2 10-7-.5-3.5-4-5-6.5-3.5 2 .5 3.5 2 3.1 4.1-.6 2.4-3.6 3.4-6.1 2.4-3-1.4-3.5-6 .5-9.5 3.5-4.5 9.5-5.5 17-5Z" />
      {/* body with crested back */}
      <path d="M38 44c2-12 14-22 30-25 16-3 32-1 42 6 6 4 9 10 8 16-4 5-14 8-26 9-16 1-36 0-48-2-4-.7-5.5-2-6-4Z" />
      <path d="M50 26.6l2.2-3 1.4 3.2 2.4-3.6 1.4 3.4 2.6-3.8 1.4 3.6 2.8-3.8 1.4 3.6 2.8-3.6 1.4 3.4 2.8-3.4 1.4 3.2 2.6-3 1.4 3 2.4-2.6 1.2 2.8 2.2-2.2 1.2 2.6 2-1.8 1 2.4" />
      {/* casque and head */}
      <path d="M108 24c4-8 14-11 24-7 8 3 14 10 16 16 1 3-1 5-5 5.5-7 1-17 1.5-25 1.5-3-3-6-9-10-16Z" />
      <path d="M120 38c8-.5 16-1 24-1.5" fill="none" stroke={PAPER} strokeWidth=".9" opacity=".55" />
      <path d="M58 30c8-3 20-4.4 32-3.6M54 37c12-2.6 26-3.2 40-2.2M58 44c10-1 22-1.2 34-.4" fill="none" stroke={PAPER} strokeWidth=".8" opacity=".22" />
      {/* near-side legs */}
      <g className="fw-leg-b" style={origin(50, 47)}>
        <path d="M50 47 45.6 56l4.6 7.4" {...limb} strokeWidth="3.4" />
        <path d="m46.6 65 3.6-2.2 3.6 2.2" {...limb} strokeWidth="1.8" />
      </g>
      <g className="fw-leg-a" style={origin(104, 46)}>
        <path d="m104 46 4.8 9.6-4.4 7.8" {...limb} strokeWidth="3.4" />
        <path d="m100.8 65.2 3.6-2.2 3.6 2.2" {...limb} strokeWidth="1.8" />
      </g>
      {/* turret eye */}
      <circle cx="130" cy="26.6" r="5.4" />
      <circle cx="130" cy="26.6" r="4.1" fill="none" stroke={PAPER} strokeWidth=".45" opacity=".35" />
      <circle cx="130" cy="26.6" r="2.8" fill="none" stroke={PAPER} strokeWidth=".45" opacity=".3" />
      <g className="fw-eye">
        <circle cx="130.6" cy="26.3" r="1.25" fill={PAPER} opacity=".75" />
        <circle cx="130.6" cy="26.3" r=".62" />
      </g>
    </svg>
  );
}

/** Garden snail: whorled, ribbed shell; long eye tentacles and short lower ones. */
function Snail({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 60" className={className} style={style} aria-hidden>
      <path d="M8 54c12-3 42-4 62-3.5 8 .2 14-1.5 16-5.5l2-7c1-4-1.5-6.5-4-5-2 1.5-2.5 5-3 8-1 3-4 4.5-9 5-17 1.5-42 2.5-60 5-3 .4-4.5 1.6-4 3Z" opacity=".9" />
      <path d="M14 52.6c16-1.6 40-2.4 58-2.2" fill="none" stroke={PAPER} strokeWidth=".7" opacity=".3" />
      <g className="fw-stalk" style={origin(84, 34)}>
        <path d="M85 34.5 90.5 20M83 34l2.4-14.6M87.6 40.4l5.4-2.6M86.4 41.6l4.8.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="90.8" cy="19.4" r="1.6" />
        <circle cx="85.5" cy="19.2" r="1.5" />
      </g>
      <ellipse cx="46" cy="30" rx="21" ry="19.4" />
      <path d="M46 30m-2.2 0a2.2 2.2 0 1 1 4.4 0 5 5 0 1 1-10 0 8.4 8.4 0 1 1 16.8 0 12.2 12.2 0 1 1-24.4 0 16.2 16.2 0 1 1 32.4 0" fill="none" stroke={PAPER} strokeWidth="1" opacity=".45" />
      <path d="M30 18l3 3M28 27l4 1M30 38l3.4-2M40 46l1-4M54 46l-1-4M62 38l-3.4-2M64 27l-4 1M60 16l-3 3M46 11v4" stroke={PAPER} strokeWidth=".7" opacity=".28" />
    </svg>
  );
}

/** Roosting bat hanging upside down, wings wrapped, finger bones showing through the membrane. */
function Bat({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 80" className={className} style={style} aria-hidden>
      <path d="M17 0c0 3 1 5.4 2.2 8M23 0c0 3-1 5.4-2.2 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M20 7.4c8.4 4 12.6 16.2 11.8 30.6-.8 14.4-5.6 26.4-11.8 32.4-6.2-6-11-18-11.8-32.4C7.4 23.6 11.6 11.4 20 7.4Z" />
      <path d="M20 10c-4 14-5 32-2 52M20 10c4 14 5 32 2 52M14 16c-3 14-3 30 1 42M26 16c3 14 3 30-1 42" fill="none" stroke={PAPER} strokeWidth=".6" opacity=".3" />
      <path d="m10.6 49.6-2.4 2.2 3 .4M29.4 49.6l2.4 2.2-3 .4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="20" cy="69.4" r="5.2" />
      <path d="m15.6 71.2-2.4 8.2 5.2-5.6ZM24.4 71.2l2.4 8.2-5.2-5.6Z" />
      <circle cx="18" cy="69" r=".7" fill={PAPER} opacity=".7" />
      <circle cx="22" cy="69" r=".7" fill={PAPER} opacity=".7" />
    </svg>
  );
}

/** Orb-weaver spider from above: jointed legs with raised knees, patterned abdomen. */
function Spider({ className, style }: { className?: string; style?: CSSProperties }) {
  const legs = ["M26.5 16 19 6l-8 4", "M26 18.5 15 13l-10 6", "M26 21 16 24l-8 8", "M26.8 23.5 19 32l-3 12"];
  return (
    <svg viewBox="0 0 60 50" className={className} style={style} aria-hidden>
      <g className="fw-legs" style={origin(30, 22)} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {legs.map((d) => (
          <path key={d} d={d} />
        ))}
        <g transform="translate(60 0) scale(-1 1)">
          {legs.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d="M28 14.6 27 11.4M32 14.6l1-3.2" strokeWidth="1" />
      </g>
      <ellipse cx="30" cy="19.6" rx="4.6" ry="5.2" />
      <ellipse cx="30" cy="32.4" rx="7.2" ry="9.4" />
      <path d="m26 29 4 2.4 4-2.4M26.4 33.4l3.6 2.2 3.6-2.2M27.4 37.6l2.6 1.6 2.6-1.6" fill="none" stroke={PAPER} strokeWidth=".7" opacity=".42" />
    </svg>
  );
}

/** Each letter gets its own span so animals can sit on a specific letter (sizes are in em of the big word). */
function Letter({ ch, children }: { ch: string; children?: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="fw-letter">{ch}</span>
      {children}
    </span>
  );
}

/** Animal sizes scale with the word and with --fa (bigger on phones, where the word itself is small). */
const sz = (w: number, h: number): CSSProperties => ({ width: `calc(${w}em * var(--fa))`, height: `calc(${h}em * var(--fa))` });

export function FooterWordmark() {
  return (
    <div className="pointer-events-none relative select-none overflow-hidden" aria-hidden>
      <div className="fw-stage mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="relative">
          {/* flying zone above the letters */}
          <div className="fw-fly-a absolute top-[0.04em]">
            <div className="fw-bob">
              <Swallow className="block fill-current text-foreground/75" style={sz(0.2, 0.133)} />
            </div>
          </div>
          <div className="fw-fly-b absolute top-[0.2em]">
            <div className="fw-bob" style={{ animationDelay: "-1.4s" }}>
              <Swallow className="block fill-current text-foreground/55" style={sz(0.14, 0.093)} />
            </div>
          </div>
          <div className="absolute right-[3%] top-[0.02em]">
            <div className="fw-wander">
              <Butterfly className="block fill-current text-foreground/70" style={sz(0.15, 0.12)} />
            </div>
          </div>

          <div className="fw-word">
            {/* a chameleon strolls along the tops of B-I-O-A */}
            <div className="fw-walk absolute" style={{ top: "calc(var(--cap) - 0.122em * var(--fa))" }}>
              <Chameleon className="block fill-current text-foreground/80" style={sz(0.3, 0.131)} />
            </div>
            <Letter ch="B" />
            <Letter ch="I" />
            <Letter ch="O" />
            <Letter ch="A" />
            <Letter ch="C">
              <span className="absolute left-[0.5em] top-[calc(var(--cap)+0.035em)] block">
                <span className="fw-thread block h-[0.26em] w-px bg-foreground/35" />
                <span className="fw-spider absolute top-[0.235em] block" style={{ left: "calc(-0.04em * var(--fa))" }}>
                  <Spider className="block fill-current text-foreground/80" style={sz(0.08, 0.067)} />
                </span>
              </span>
            </Letter>
            <Letter ch="A" />
            <Letter ch="D">
              <span className="fw-crawl absolute block" style={{ top: "calc(var(--cap) - 0.085em * var(--fa))" }}>
                <Snail className="block fill-current text-foreground/75" style={sz(0.14, 0.084)} />
              </span>
            </Letter>
            <Letter ch="E">
              <span className="fw-swing absolute block" style={{ left: "calc(0.45em - 0.035em * var(--fa))", top: "calc(var(--cap) + 0.03em)" }}>
                <Bat className="block fill-current text-foreground/80" style={sz(0.07, 0.14)} />
              </span>
            </Letter>
            <Letter ch="M" />
            <Letter ch="Y" />
          </div>
        </div>
      </div>
    </div>
  );
}
