"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppearanceBadge } from "@/components/AppearanceBadge";

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

type Zone = "core" | "secondary" | "supporting" | "unused";

type BoardRow = {
  id?: string;
  item_key: BoardItemKey;
  xPct: number;
  yPct: number;
  zone: Zone;
  collapsed: boolean;
  updatedAt?: number;
};

type BoardOverlayProps = {
  token?: string | null;
  canEdit: boolean;
  appearanceByTheme?: Record<string, number>;
};

/**
 * Reviewer-created board card
 */
type BoardNote = {
  id: string;
  xPct: number;
  yPct: number;
  title: string;
  body: string; // multiline bullets text
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* -------------------------------------------------------------------------- */
/*                          Default themed board items                        */
/* -------------------------------------------------------------------------- */

const DEFAULTS: Record<BoardItemKey, Omit<BoardRow, "item_key">> = {
  // CORE (left column)
  customer: { xPct: 15, yPct: 16, zone: "core", collapsed: false },
  integrator: { xPct: 34, yPct: 30, zone: "core", collapsed: false },
  // SECONDARY (right column)
  differentiator: { xPct: 66, yPct: 12, zone: "secondary", collapsed: false },
  strategic: { xPct: 84, yPct: 28, zone: "secondary", collapsed: false },
  // SUPPORTING (bottom, 2/3 width)
  consistency: { xPct: 14, yPct: 76, zone: "supporting", collapsed: false },
  creativity: { xPct: 33, yPct: 80, zone: "supporting", collapsed: false },
  culture: { xPct: 52, yPct: 84, zone: "supporting", collapsed: false },
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
/*                      Reviewer-created editable board card                  */
/* -------------------------------------------------------------------------- */

function ReviewerBoardCard({
  note,
  canEdit,
  isSaving,
  savedAt,
  onStartDrag,
  onTitleChange,
  onBodyChange,
  onToggleCollapse,
  onDelete,
}: {
  note: {
    id: string;
    xPct: number;
    yPct: number;
    title: string;
    body: string;
    collapsed: boolean;
  };
  canEdit: boolean;
  isSaving: boolean;
  savedAt: number | undefined;
  onStartDrag: (e: React.PointerEvent, id: string) => void;
  onTitleChange: (id: string, t: string) => void;
  onBodyChange: (id: string, t: string) => void;
  onToggleCollapse: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  // collapsed "chip"
  if (note.collapsed) {
    return (
      <div
        className={
          "absolute z-20 " +
          (canEdit
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default opacity-95")
        }
        style={{
          left: `${note.xPct}%`,
          top: `${note.yPct}%`,
          transform: "translate(-40%, -24px)",
        }}
        onPointerDown={(e) => onStartDrag(e, note.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canEdit) onToggleCollapse(note.id);
          }}
          className="rounded-full border border-neutral-300 bg-white shadow px-4 pt-1.5 pb-1 text-md text-neutral-800 font-semibold"
          title={note.title || "Reviewer card"}
        >
          {note.title
            ? note.title.slice(0, 28)
            : "Your card"}
        </button>
      </div>
    );
  }

  // expanded full board-style card
  return (
    <div
      className={
        "absolute z-20 " +
        (canEdit
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default opacity-95")
      }
      style={{
        left: `${note.xPct}%`,
        top: `${note.yPct}%`,
        transform: "translate(-40%, -24px)",
      }}
      onPointerDown={(e) => onStartDrag(e, note.id)}
    >
      <div className="w-[300px] max-w-[84vw] rounded-xl border border-neutral-200 bg-white shadow p-4">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          {canEdit ? (
            <input
              className="font-semibold text-neutral-900 w-full bg-transparent outline-none text-[15px] leading-snug"
              value={note.title}
              placeholder="Untitled value argument"
              onChange={(e) => onTitleChange(note.id, e.target.value)}
            />
          ) : (
            <h4 className="font-semibold text-neutral-900">
              {note.title || "Untitled value argument"}
            </h4>
          )}

          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(note.id);
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

        {/* body / bullets */}
        <div className="mt-3 text-sm text-neutral-700 tracking-[0.01em]">
          {canEdit ? (
            <textarea
              className="w-full bg-transparent outline-none text-sm leading-snug resize-none"
              placeholder={"• Bullet point 1\n• Bullet point 2"}
              value={note.body}
              rows={4}
              onChange={(e) => onBodyChange(note.id, e.target.value)}
            />
          ) : (
            <ul className="space-y-2 list-disc pl-5">
              {note.body
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line, idx) => (
                  <li key={idx}>
                    {line.replace(/^•\s?/, "")}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* footer */}
        <div className="mt-4 flex items-center justify-between">
          {canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="text-xs text-neutral-500 hover:text-red-600 cursor-pointer"
            >
              Delete
            </button>
          ) : (
            <span className="text-[11px] text-neutral-400">
              Reviewer card
            </span>
          )}

          <div className="text-[11px] tabular-nums text-neutral-500">
            {isSaving ? "Saving…" : savedAt ? "Saved" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Public wrapper                                 */
/* -------------------------------------------------------------------------- */

export default function BoardOverlay({
  token,
  canEdit,
  appearanceByTheme,
}: BoardOverlayProps) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <BoardSurface
        token={token}
        canEdit={canEdit}
        appearanceByTheme={appearanceByTheme}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                BoardSurface                                 */
/* -------------------------------------------------------------------------- */

function BoardSurface({
  token,
  canEdit,
  appearanceByTheme,
}: BoardOverlayProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  // purely visual zone refs
  const coreRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const supportingRef = useRef<HTMLDivElement>(null);
  const unusedRef = useRef<HTMLDivElement>(null);

  // canonical rows
  const [rows, setRows] = useState<Record<BoardItemKey, BoardRow>>(() => {
    const init: any = {};
    (Object.keys(DEFAULTS) as BoardItemKey[]).forEach((k) => {
      init[k] = { item_key: k, ...DEFAULTS[k] };
    });
    return init;
  });

  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // reviewer-created notes/cards
  const [notes, setNotes] = useState<BoardNote[]>([]);
  const [noteToast, setNoteToast] = useState<string | null>(null);

  const [savingNoteIds, setSavingNoteIds] = useState<Set<string>>(new Set());
  const [noteSavedAt, setNoteSavedAt] = useState<Record<string, number>>({});
  const noteTimers = useRef<Record<string, number | NodeJS.Timeout>>({});

  const BOARD_HEIGHT = 780;

  /* ---------------------- Load canonical themed rows ---------------------- */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("board_list", {
        p_token: token,
      });
      if (error) {
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
              zone:
                (r.zone ??
                  prev[k]?.zone ??
                  DEFAULTS[k].zone) as Zone,
              collapsed: !!r.collapsed,
              updatedAt: new Date(r.updated_at).getTime(),
            };
          }
          return copy;
        });
      }
    })();
  }, [token]);

  /* ---------------------- Load reviewer-created notes --------------------- */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("board_notes_list", {
        p_token: token,
      });
      if (error) {
        console.error("board_notes_list error:", error);
        return;
      }
      if (data) {
        setNotes(
          data.map((row: any) => ({
            id: row.id,
            xPct: row.x_pct,
            yPct: row.y_pct,
            title: row.title || "",
            body: row.body || "",
            collapsed: row.collapsed,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
          }))
        );
      }
    })();
  }, [token]);

  /* ------------------------ Save canonical themed rows -------------------- */
  function queueSave(key: BoardItemKey) {
    const t = timers.current[key];
    if (t) clearTimeout(t);
    timers.current[key] = setTimeout(async () => {
      if (!token) return;
      const r = rowsRef.current[key];
      try {
        const { error } = await supabase.rpc("board_upsert", {
          p_token: token,
          p_item_key: key,
          p_x_pct: r.xPct,
          p_y_pct: r.yPct,
          p_zone: r.zone,
          p_collapsed: r.collapsed,
        });
        if (error) throw error;
      } catch (e) {
        console.error("board_upsert failed", e);
        setToast("Save failed");
        setTimeout(() => setToast(null), 1600);
      } finally {
        delete timers.current[key];
      }
    }, 350);
  }

  /* ------------------------ Save reviewer notes/cards --------------------- */

  function queueSaveNote(
    id: string,
    reason: "title" | "body" | "position" | "collapse"
  ) {
    const t = noteTimers.current[id];
    if (t) clearTimeout(t as number);

    if (reason === "title" || reason === "body") {
      setSavingNoteIds((prev) => new Set(prev).add(id));
    }

    noteTimers.current[id] = setTimeout(async () => {
      const n = notes.find((nn) => nn.id === id);
      if (!n || !token) return;

      try {
        const { error } = await supabase.rpc("board_notes_upsert", {
          p_token: token,
          p_id: n.id, // UPDATE
          p_x_pct: n.xPct,
          p_y_pct: n.yPct,
          p_title: n.title,
          p_body: n.body,
          p_collapsed: n.collapsed,
          p_reviewer_label: null,
        });
        if (error) throw error;

        setNoteSavedAt((s) => ({ ...s, [n.id]: Date.now() }));
      } catch (e) {
        console.error("board_notes_upsert update failed", e);
        setNoteToast("Save failed");
        setTimeout(() => setNoteToast(null), 1600);
      } finally {
        if (reason === "title" || reason === "body") {
          setSavingNoteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        delete noteTimers.current[id];
      }
    }, 400);
  }

  async function createNewNote() {
    if (!token || !canEdit) return;

    const draftX = 50;
    const draftY = 50;
    const tempId = crypto.randomUUID();

    const temp: BoardNote = {
      id: tempId,
      xPct: draftX,
      yPct: draftY,
      title: "Your title",
      body: "• Bullet point 1\n• Bullet point 2",
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [...prev, temp]);

    try {
      const { data, error } = await supabase.rpc("board_notes_upsert", {
        p_token: token,
        p_id: null, // INSERT
        p_x_pct: draftX,
        p_y_pct: draftY,
        p_title: temp.title,
        p_body: temp.body,
        p_collapsed: false,
        p_reviewer_label: null,
      });
      if (error) throw error;

      const saved = Array.isArray(data) ? data[0] : data;

      setNotes((prev) =>
        prev.map((n) =>
          n.id === tempId
            ? {
                ...n,
                id: saved.out_id,
                xPct: saved.out_x_pct,
                yPct: saved.out_y_pct,
                title: saved.out_title || "",
                body: saved.out_body || "",
                collapsed: saved.out_collapsed,
                createdAt: new Date(
                  saved.out_created_at
                ).getTime(),
                updatedAt: new Date(
                  saved.out_updated_at
                ).getTime(),
              }
            : n
        )
      );

      setNoteSavedAt((s) => ({
        ...s,
        [saved.out_id]: Date.now(),
      }));
      setNoteToast("Card added");
      setTimeout(() => setNoteToast(null), 1500);
    } catch (e) {
      console.error("board_notes_upsert insert failed", e);
      setNoteToast("Error adding card");
      setTimeout(() => setNoteToast(null), 2000);
    }
  }

  function updateNoteTitle(id: string, title: string) {
    if (!canEdit) return;
    setNotes((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              title,
              updatedAt: Date.now(),
            }
          : n
      )
    );
    queueSaveNote(id, "title");
  }

  function updateNoteBody(id: string, body: string) {
    if (!canEdit) return;
    setNotes((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              body,
              updatedAt: Date.now(),
            }
          : n
      )
    );
    queueSaveNote(id, "body");
  }

  function toggleNoteCollapse(id: string) {
    if (!canEdit) return;
    setNotes((list) =>
      list.map((n) =>
        n.id === id
          ? {
              ...n,
              collapsed: !n.collapsed,
              updatedAt: Date.now(),
            }
          : n
      )
    );
    queueSaveNote(id, "collapse");
  }

  async function deleteNote(id: string) {
    if (!token || !canEdit) return;
    try {
      const { error } = await supabase.rpc(
        "board_notes_delete",
        {
          p_token: token,
          p_id: id,
        }
      );
      if (error) throw error;

      setNotes((list) =>
        list.filter((n) => n.id !== id)
      );
      setNoteToast("Card deleted");
      setTimeout(() => setNoteToast(null), 1500);
    } catch (e) {
      console.error("board_notes_delete failed", e);
      setNoteToast("Error deleting");
      setTimeout(() => setNoteToast(null), 2000);
    }
  }

  /* ------------------------------ dragging -------------------------------- */

  function startDrag(
    e: React.PointerEvent,
    key: BoardItemKey
  ) {
    if (!canEdit) return;
    (e.target as HTMLElement).setPointerCapture?.(
      e.pointerId
    );

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const startItem = rowsRef.current[key];

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const nx = clamp(
        startItem.xPct + (dx / rect.width) * 100
      );
      const ny = clamp(
        startItem.yPct + (dy / rect.height) * 100
      );
      setRows((r) => ({
        ...r,
        [key]: {
          ...r[key],
          xPct: nx,
          yPct: ny,
        },
      }));
    };

    const onUp = () => {
      window.removeEventListener(
        "pointermove",
        onMove
      );
      window.removeEventListener(
        "pointerup",
        onUp
      );
      queueSave(key);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startDragNote(
    e: React.PointerEvent,
    id: string
  ) {
    if (!canEdit) return;
    (e.target as HTMLElement).setPointerCapture?.(
      e.pointerId
    );

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const startItem = notes.find(
      (n) => n.id === id
    );
    if (!startItem) return;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const nx = clamp(
        startItem.xPct + (dx / rect.width) * 100
      );
      const ny = clamp(
        startItem.yPct + (dy / rect.height) * 100
      );
      setNotes((list) =>
        list.map((n) =>
          n.id === id
            ? { ...n, xPct: nx, yPct: ny }
            : n
        )
      );
    };

    const onUp = () => {
      window.removeEventListener(
        "pointermove",
        onMove
      );
      window.removeEventListener(
        "pointerup",
        onUp
      );
      queueSaveNote(id, "position");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* toast for canonical cards */}
      {toast && (
        <div className="fixed z-[70] bottom-4 right-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{toast}</div>
        </div>
      )}

      {/* toast for reviewer cards */}
      {noteToast && (
        <div className="fixed z-[70] bottom-20 right-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{noteToast}</div>
        </div>
      )}

      {/* BOARD SURFACE */}
      <div
        ref={surfaceRef}
        className="relative w-screen"
        style={{ height: BOARD_HEIGHT }}
      >
        {/* backdrop zones */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 md:px-10">
            {/* CORE */}
            <div
              ref={coreRef}
              className="rounded-2xl border-4 border-black bg-neutral-900 p-4"
            >
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Core lens
              </div>
              <div className="rounded-lg bg-neutral-100 h-[400px]" />
            </div>

            {/* SECONDARY */}
            <div
              ref={secondaryRef}
              className="rounded-2xl border-4 border-black bg-neutral-900 p-4"
            >
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

            <div
              ref={unusedRef}
              className="rounded-2xl border-4 border-black bg-neutral-900 p-4"
            >
              <div className="text-xs uppercase tracking-wide text-neutral-300 mb-2">
                Unused
              </div>
              <div className="rounded-lg bg-neutral-100 h-[300px]" />
            </div>
          </div>
        </div>

        {/* canonical themed cards */}
        {(Object.keys(rows) as BoardItemKey[]).map((k) => {
          const r = rows[k];
          return (
            <div
              key={k}
              className={
                "absolute z-10 " +
                (canEdit
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default opacity-95")
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
                    if (!canEdit) return;
                    setRows((curr) => ({
                      ...curr,
                      [k]: {
                        ...curr[k],
                        collapsed: !curr[k].collapsed,
                      },
                    }));
                    queueSave(k);
                  }}
                  className="rounded-full border border-neutral-300 bg-white shadow px-4 pt-1.5 pb-1 text-md text-neutral-800 font-semibold"
                  title={LABELS[k]}
                >
                  {LABELS[k]
                    .replace(/^Design\s+as\s+/i, "")
                    .replace(/^Design\s+/i, "")
                    .replace(/&/g, "and")
                    .split(" ")[0]
                    .slice(0, 20)}
                </button>
              ) : (
                <div className="w-[300px] max-w-[84vw] rounded-xl border border-neutral-200 bg-white shadow p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-neutral-900">
                      {LABELS[k]}
                    </h4>

                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRows((curr) => ({
                            ...curr,
                            [k]: {
                              ...curr[k],
                              collapsed: !curr[k].collapsed,
                            },
                          }));
                          queueSave(k);
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

                  {/* value bullets + appearance badge */}
                  {(() => {
                    switch (k) {
                      case "customer":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Design positions itself as the organization’s
                                voice of the customer.
                              </li>
                              <li>
                                Research, journey maps, and direct user exposure
                                correct internal bias and de-risk bets.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "integrator":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Design acts as the glue bridging silos and
                                aligning product, engineering, and business.
                              </li>
                              <li>
                                Early testing and prototyping prevent rework,
                                saving time and money.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "differentiator":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Design can elevate experience quality, brand
                                trust, and the overall user experience.
                              </li>
                              <li>
                                Some contexts avoid this lens when markets are
                                less competitive or to avoid reducing design to
                                aesthetics.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "strategic":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                With credibility, design can contributes to
                                upstream framing and futures work.
                              </li>
                              <li>
                                This typically happens in more mature contexts
                                after prior wins earn strategic access.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "consistency":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Shared standards and systems create coherence at
                                scale, reduce ambiguity, and compound trust over
                                time - often becoming a subtle, durable
                                differentiator.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "culture":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Design talks, internal cases, and applying
                                design to internal processes keep practices from
                                regressing amid turnover and legacy habits.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
                        );
                      case "creativity":
                        return (
                          <>
                            <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700 tracking-[0.01em]">
                              <li>
                                Some leaders emphasize designers’ unique
                                capacity to envision non-obvious possibilities,
                                tying design to innovation.
                              </li>
                            </ul>
                            <AppearanceBadge
                              level={appearanceByTheme?.[k]}
                            />
                          </>
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

        {/* reviewer-created editable cards */}
        {notes.map((note) => (
          <ReviewerBoardCard
            key={note.id}
            note={note}
            canEdit={canEdit}
            isSaving={savingNoteIds.has(note.id)}
            savedAt={noteSavedAt[note.id]}
            onStartDrag={startDragNote}
            onTitleChange={updateNoteTitle}
            onBodyChange={updateNoteBody}
            onToggleCollapse={toggleNoteCollapse}
            onDelete={deleteNote}
          />
        ))}

        {canEdit && (
            <button
              onClick={createNewNote}
              className="absolute right-14 bottom-[-60] z-30 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-1.5 shadow text-sm cursor-pointer"
              title="Add your own card to the board"
            >
              + Add another card
            </button>
          )}
      </div>
    </>
  );
}
