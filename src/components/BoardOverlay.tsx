/* -------------------------------NOT REALLY NEEDED-------------------------------------- */

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
};

/**
 * Reviewer-created board card
 */
type BoardNote = {
  id: string;
  xPct: number;
  yPct: number;
  title: string;
  body: string;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* -------------------------------------------------------------------------- */
/*                          Default themed board items                        */
/* -------------------------------------------------------------------------- */

const DEFAULTS: Record<BoardItemKey, Omit<BoardRow, "item_key">> = {
  customer: { xPct: 20, yPct: 20, zone: "core", collapsed: false },
  integrator: { xPct: 40, yPct: 28, zone: "core", collapsed: false },

  differentiator: { xPct: 60, yPct: 20, zone: "secondary", collapsed: false },
  strategic: { xPct: 80, yPct: 28, zone: "secondary", collapsed: false },

  consistency: { xPct: 30, yPct: 70, zone: "supporting", collapsed: false },
  creativity: { xPct: 50, yPct: 78, zone: "supporting", collapsed: false },
  culture: { xPct: 70, yPct: 72, zone: "supporting", collapsed: false },
};

const LABELS: Record<BoardItemKey, string> = {
  customer: "Connection to Customer",
  integrator: "Integration / Efficiency",
  differentiator: "Differentiation / Quality",
  strategic: "Strategic Lens / Foresight",
  consistency: "Consistency & Scale",
  culture: "Culture / Evangelism",
  creativity: "Creativity as Resource",
};

/* -------------------------------------------------------------------------- */
/*                      Reviewer-created editable board cards                 */
/* -------------------------------------------------------------------------- */

function ReviewerBoardCard({
  note,
  canEdit,
  isSaving,
  savedAt,
  onStartDrag,
  onTitleChange,
  onToggleCollapse,
  onDelete,
}: {
  note: BoardNote;
  canEdit: boolean;
  isSaving: boolean;
  savedAt: number | undefined;
  onStartDrag: (e: React.PointerEvent, id: string) => void;
  onTitleChange: (id: string, t: string) => void;
  onToggleCollapse: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  // Collapsed pill style (unchanged)
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
          className="rounded-full border border-neutral-300 bg-white shadow px-4 pt-1.5 pb-1 text-[13px] text-neutral-800 font-semibold"
          title={note.title || "Your card"}
        >
          {note.title ? note.title.slice(0, 32) : "Your card"}
        </button>
      </div>
    );
  }

  // Expanded card, simplified: title only + footer (delete / saved)
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
      <div className="w-[220px] max-w-[84vw] rounded-xl border border-neutral-200 bg-white shadow p-4">
        {/* header / title row */}
        <div className="flex items-start justify-between gap-3">
          {canEdit ? (
            <input
              className="font-semibold text-neutral-900 w-full bg-transparent outline-none text-[14px] leading-snug"
              value={note.title}
              placeholder="Untitled"
              onChange={(e) => onTitleChange(note.id, e.target.value)}
            />
          ) : (
            <h4 className="font-semibold text-neutral-900 text-[14px] leading-snug">
              {note.title || "Untitled"}
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

        {/* footer */}
        <div className="mt-4 flex items-center justify-between">
          {canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="text-[11px] text-neutral-500 hover:text-red-600 cursor-pointer"
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
/*                            Default Themed Label Card                        */
/* -------------------------------------------------------------------------- */

function ThemeCard({
  row,
  label,
  canEdit,
  onStartDrag,
}: {
  row: BoardRow;
  label: string;
  canEdit: boolean;
  onStartDrag: (e: React.PointerEvent, key: BoardItemKey) => void;
}) {
  return (
    <div
      className={
        "absolute z-10 " +
        (canEdit
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default opacity-95")
      }
      style={{
        left: `${row.xPct}%`,
        top: `${row.yPct}%`,
        transform: "translate(-40%, -24px)",
      }}
      onPointerDown={(e) => onStartDrag(e, row.item_key)}
    >
      <div className="rounded-full border border-neutral-300 bg-white shadow px-4 py-2 text-[13px] text-neutral-800 font-semibold whitespace-nowrap">
        {label}
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
}: BoardOverlayProps) {
  return (
    <div className="w-full max-w-[950px]">
      <BoardSurface token={token} canEdit={canEdit} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                BoardSurface                                 */
/* -------------------------------------------------------------------------- */

function BoardSurface({ token, canEdit }: BoardOverlayProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<Record<BoardItemKey, BoardRow>>(() => {
    const init: Record<BoardItemKey, BoardRow> = {} as any;
    (Object.keys(DEFAULTS) as BoardItemKey[]).forEach((k) => {
      init[k] = { item_key: k, ...DEFAULTS[k] };
    });
    return init;
  });
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [notes, setNotes] = useState<BoardNote[]>([]);
  const [savingNoteIds, setSavingNoteIds] = useState<Set<string>>(new Set());
  const [noteSavedAt, setNoteSavedAt] = useState<Record<string, number>>({});

  const [toast, setToast] = useState<string | null>(null);
  const [noteToast, setNoteToast] = useState<string | null>(null);

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
              zone: (r.zone ?? prev[k]?.zone ?? DEFAULTS[k].zone) as Zone,
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

  function queueSaveNote(id: string, reason: "title" | "position" | "collapse") {
    const t = noteTimers.current[id];
    if (t) clearTimeout(t);

    if (reason === "title") {
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
          p_body: n.body, // still send body even though we don't render it
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
        if (reason === "title") {
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
      title: "New theme",
      body: "", // no bullet body anymore
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
                createdAt: new Date(saved.out_created_at).getTime(),
                updatedAt: new Date(saved.out_updated_at).getTime(),
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
        n.id === id ? { ...n, title, updatedAt: Date.now() } : n
      )
    );
    queueSaveNote(id, "title");
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
      const { error } = await supabase.rpc("board_notes_delete", {
        p_token: token,
        p_id: id,
      });
      if (error) throw error;

      setNotes((list) => list.filter((n) => n.id !== id));
      setNoteToast("Card deleted");
      setTimeout(() => setNoteToast(null), 1500);
    } catch (e) {
      console.error("board_notes_delete failed", e);
      setNoteToast("Error deleting");
      setTimeout(() => setNoteToast(null), 2000);
    }
  }

  /* ------------------------------ dragging -------------------------------- */

  function startDragThemed(e: React.PointerEvent, key: BoardItemKey) {
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
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      queueSave(key);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startDragNote(e: React.PointerEvent, id: string) {
    if (!canEdit) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const current = notes.find((n) => n.id === id);
    if (!current) return;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nx = clamp(current.xPct + (dx / rect.width) * 100);
      const ny = clamp(current.yPct + (dy / rect.height) * 100);
      setNotes((list) =>
        list.map((n) =>
          n.id === id
            ? {
                ...n,
                xPct: nx,
                yPct: ny,
                updatedAt: Date.now(),
              }
            : n
        )
      );
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      queueSaveNote(id, "position");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* -------------------------------- render --------------------------------- */

  return (
    <div className="relative w-full">
      {/* surface frame */}
      <div
        ref={surfaceRef}
        className="relative w-full h-[600px] bg-white overflow-hidden"
      >
        {/* ---------- background zones (underlay) ---------- */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 z-0 pointer-events-none select-none text-[11px] leading-snug">
          {/* Core lens */}
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-inner p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-700 mb-1">
              Core lens
            </div>
            <div className="text-[11px] text-neutral-500">
              What you would lead with first.
            </div>
          </div>

          {/* Secondary lens */}
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-inner p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-700 mb-1">
              Secondary lens
            </div>
            <div className="text-[11px] text-neutral-500">
              Still strong, usually needs context.
            </div>
          </div>

          {/* Supporting themes */}
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-inner p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-700 mb-1">
              Supporting themes
            </div>
            <div className="text-[11px] text-neutral-500">
              Proof points that reinforce the main story.
            </div>
          </div>

          {/* Unused / Parking lot */}
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-50/70 shadow-inner p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-700 mb-1">
                  Unused
                </div>
                <div className="text-[11px] text-neutral-500">
                  Interesting, but maybe not core yet.
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ---------- end background zones ---------- */}

        {/* Themed chips (default items) */}
        {(Object.keys(rows) as BoardItemKey[]).map((key) => (
          <ThemeCard
            key={key}
            row={rows[key]}
            label={LABELS[key]}
            canEdit={canEdit}
            onStartDrag={startDragThemed}
          />
        ))}

        {/* Reviewer-created cards (editable notes) */}
        {notes.map((note) => (
          <ReviewerBoardCard
            key={note.id}
            note={note}
            canEdit={canEdit}
            isSaving={savingNoteIds.has(note.id)}
            savedAt={noteSavedAt[note.id]}
            onStartDrag={startDragNote}
            onTitleChange={updateNoteTitle}
            onToggleCollapse={toggleNoteCollapse}
            onDelete={deleteNote}
          />
        ))}

        {/* Add-card button */}
        {canEdit ? (
          <button
            onClick={createNewNote}
            className="absolute bottom-2 right-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-[13px] px-3 py-1.5 shadow-sm"
          >
            + Add theme
          </button>
        ) : null}
      </div>

      {/* toasts */}
      {toast && (
        <div className="absolute -bottom-8 right-0 text-xs text-neutral-600">
          {toast}
        </div>
      )}
      {noteToast && (
        <div className="absolute -bottom-8 left-0 text-xs text-neutral-600">
          {noteToast}
        </div>
      )}
    </div>
  );
}
