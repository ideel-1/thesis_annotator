"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type BoardItemKey =
  | "customer"
  | "integrator"
  | "differentiator"
  | "strategic"
  | "consistency"
  | "culture"
  | "creativity";

type Zone = "core" | "secondary" | "supporting" | "unused"; // kept to satisfy RPC signature

type BoardRow = {
  id?: string;
  item_key: BoardItemKey;
  xPct: number; // 0..100 of board width
  yPct: number; // 0..100 of board height
  zone: Zone;   // not used for behavior; sent to RPC unchanged
  collapsed: boolean;
  updatedAt?: number;
};

type BoardOverlayProps = {
  token?: string | null; // token enables saving
  canEdit: boolean;      // gate by reviewer.canComment
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* Initial layout (visual only). Supabase data overrides on load. */
const DEFAULTS: Record<BoardItemKey, Omit<BoardRow, "item_key">> = {
  // CORE (left column)
  customer:     { xPct: 15, yPct: 16, zone: "core",       collapsed: false },
  integrator:   { xPct: 34, yPct: 30, zone: "core",       collapsed: false },
  // SECONDARY (right column)
  differentiator:{ xPct: 66, yPct: 12, zone: "secondary",  collapsed: false },
  strategic:    { xPct: 84, yPct: 28, zone: "secondary",  collapsed: false },
  // SUPPORTING (bottom, 2/3 width)
  consistency:  { xPct: 14, yPct: 76, zone: "supporting", collapsed: false },
  creativity:   { xPct: 33, yPct: 80, zone: "supporting", collapsed: false },
  culture:      { xPct: 52, yPct: 84, zone: "supporting", collapsed: false },
};

const LABELS: Record<BoardItemKey, string> = {
  customer: "Design as Connection to Customer",
  integrator: "Design as Integrator & Efficiency Enabler",
  differentiator: "Design as Differentiator & Quality Standard",
  strategic: "Design as Strategic Lens & Vision Caster",
  consistency: "Consistency through Design Systems",
  culture: "Culture Change and Evangelism",
  creativity: "Creativity as a Sustaining Resource",
};

/* -------------------------------------------------------------------------- */
/*                              Public component                              */
/* -------------------------------------------------------------------------- */

export default function BoardOverlay({ token, canEdit }: BoardOverlayProps) {
  // full-width breakout (escapes centered page container)
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <BoardSurface token={token} canEdit={canEdit} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Board surface                                */
/* -------------------------------------------------------------------------- */

function BoardSurface({ token, canEdit }: BoardOverlayProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  // backdrop zones (purely visual)
  const coreRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const supportingRef = useRef<HTMLDivElement>(null);
  const unusedRef = useRef<HTMLDivElement>(null);

  // rows state (seed with defaults)
  const [rows, setRows] = useState<Record<BoardItemKey, BoardRow>>(() => {
    const init: any = {};
    (Object.keys(DEFAULTS) as BoardItemKey[]).forEach((k) => {
      init[k] = { item_key: k, ...DEFAULTS[k] };
    });
    return init;
  });

  // keep a ref in sync to avoid stale closures in debounced saves
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // toast
  const [toast, setToast] = useState<string | null>(null);

  // per-item debounce timers
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // fixed height works well with your backdrop (400 + 400 + 300 + gaps)
  const BOARD_HEIGHT = 780;

  /* ------------------------------- load layout ------------------------------ */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("board_list", { p_token: token });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("board_list error:", error);
        return;
      }
      if (data?.length) {
        setRows((prev) => {
          const copy = { ...prev };
          for (const r of data as any[]) {
            const k = r.item_key as BoardItemKey;
            if (!k) continue;
            copy[k] = {
              item_key: k,
              id: r.id,
              xPct: r.x_pct,
              yPct: r.y_pct,
              zone: (r.zone ?? prev[k]?.zone ?? DEFAULTS[k].zone) as Zone, // preserve if present
              collapsed: !!r.collapsed,
              updatedAt: new Date(r.updated_at).getTime(),
            };
          }
          return copy;
        });
      }
    })();
  }, [token]);

  /* --------------------------------- save ---------------------------------- */
  function queueSave(key: BoardItemKey) {
    const t = timers.current[key];
    if (t) clearTimeout(t);
    timers.current[key] = setTimeout(async () => {
      if (!token) return;
      const r = rowsRef.current[key]; // use the latest state
      try {
        const { error } = await supabase.rpc("board_upsert", {
          p_token: token,
          p_item_key: key,
          p_x_pct: r.xPct,
          p_y_pct: r.yPct,
          p_zone: r.zone,           // unchanged; visual only
          p_collapsed: r.collapsed,
        });
        if (error) throw error;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("board_upsert failed", e);
        setToast("Save failed");
        setTimeout(() => setToast(null), 1600);
      } finally {
        delete timers.current[key];
      }
    }, 350);
  }

  /* -------------------------------- dragging -------------------------------- */
  function startDrag(e: React.PointerEvent, key: BoardItemKey) {
    if (!canEdit) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const startItem = rowsRef.current[key];

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const nx = clamp(startItem.xPct + (dx / rect.width) * 100);
      const ny = clamp(startItem.yPct + (dy / rect.height) * 100);
      setRows((r) => ({ ...r, [key]: { ...r[key], xPct: nx, yPct: ny } }));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      queueSave(key); // persist new xPct/yPct
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleCollapse(key: BoardItemKey) {
    if (!canEdit) return;
    setRows((r) => ({ ...r, [key]: { ...r[key], collapsed: !r[key].collapsed } }));
    queueSave(key);
  }

  /* --------------------------------- render -------------------------------- */

  return (
    <>
      {toast && (
        <div className="fixed z-[70] bottom-4 right-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{toast}</div>
        </div>
      )}

      {/* BOARD SURFACE — full width, clean */}
      <div ref={surfaceRef} className="relative w-screen" style={{ height: BOARD_HEIGHT }}>
        {/* Backdrop zones (visual only; do not intercept pointer) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 md:px-10">
            {/* CORE */}
            <div ref={coreRef} className="rounded-2xl border-4 border-black bg-neutral-900 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Core lens
              </div>
              <div className="rounded-lg bg-neutral-100 h-[400px]" />
            </div>

            {/* SECONDARY */}
            <div ref={secondaryRef} className="rounded-2xl border-4 border-black bg-neutral-900 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Secondary lens
              </div>
              <div className="rounded-lg bg-neutral-100 h-[400px]" />
            </div>
          </div>

          {/* SUPPORTING + UNUSED */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-10 mt-6">
            <div
              ref={supportingRef}
              className="rounded-2xl border-4 border-black bg-neutral-900 p-4 md:col-span-2"
            >
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Supporting themes
              </div>
              <div className="rounded-lg bg-neutral-100 h-[300px]" />
            </div>

            <div ref={unusedRef} className="rounded-2xl border-4 border-black bg-neutral-900 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Unused
              </div>
              <div className="rounded-lg bg-neutral-100 h-[300px]" />
            </div>
          </div>
        </div>

        {/* DRAGGABLE CARDS */}
        {(Object.keys(rows) as BoardItemKey[]).map((k) => {
          const r = rows[k];
          return (
            <div
              key={k}
              className={
                "absolute z-10 " +
                (canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-95")
              }
              style={{
                left: `${r.xPct}%`,
                top: `${r.yPct}%`,
                transform: "translate(-40%, -24px)",
              }}
              onPointerDown={(e) => startDrag(e, k)}
            >
              {r.collapsed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(k);
                  }}
                  className="rounded-full border border-neutral-300 bg-white shadow px-3 py-1 text-xs"
                  title={LABELS[k]}
                >
                  {LABELS[k].split(" ")[0]}
                </button>
              ) : (
                <div className="w-[360px] max-w-[84vw] rounded-xl border border-neutral-200 bg-white shadow p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-neutral-900">{LABELS[k]}</h4>
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(k);
                        }}
                        className="text-neutral-500 hover:text-neutral-800"
                        title="Collapse"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Read-only bullet content per card */}
                  {(() => {
                    switch (k) {
                      case "customer":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]">
                            <li>Design positions itself as the organization’s voice of the customer.</li>
                            <li>Research, journey maps, and direct user exposure correct internal bias and de-risk bets.</li>
                            <li>Leaders gain confidence they are doing the right thing for customers and the business.</li>
                          </ul>
                        );
                      case "integrator":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]">
                            <li>Design acts as the glue bridging silos and aligning product, engineering, and business.</li>
                            <li>Early testing and prototyping prevent rework, saving time and money.</li>
                            <li>The claim resonates with stakeholders focused on speed, ROI, and execution risk.</li>
                          </ul>
                        );
                      case "differentiator":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]"> 
                            <li>Design elevates experience quality and brand trust when features converge.</li>
                            <li>Consistency in high quality contributes to market-relevant outcomes.</li>
                            <li>Some contexts avoid this lens when markets are less competitive or to avoid reducing design to aesthetics.</li>
                          </ul>
                        );
                      case "strategic":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]">
                            <li>With credibility, design contributes to upstream framing and futures work.</li>
                            <li>Rapid prototyping informs strategy and option creation.</li>
                            <li>This typically happens in more mature contexts after prior wins earn strategic access.</li>
                          </ul>
                        );
                      case "consistency":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]">
                            <li>
                              Shared standards and systems create coherence at scale, reduce ambiguity, and compound trust
                              over time - often becoming a subtle, durable differentiator.
                            </li>
                          </ul>
                        );
                      case "culture":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]"> 
                            <li>
                              Design talks, internal cases, and applying design to internal processes keep practices from
                              regressing amid turnover and legacy habits.
                            </li>
                          </ul>
                        );
                      case "creativity":
                        return (
                          <ul className="mt-3 space-y-2 list-disc pl-5 space-y-2 text-sm text-neutral-700 tracking-[0.01em]">
                            <li>
                              Some leaders emphasize designers’ unique capacity to envision non-obvious possibilities, tying
                              design to innovation.
                            </li>
                          </ul>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
