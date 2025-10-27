"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Comment = {
  id: string;
  num: number;
  xPct: number;
  yPct: number;
  text: string;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
};

type CommentOverlayProps = {
  reviewerLabel?: string; // e.g. "INT4"
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

function useAutosizeTextArea<T extends HTMLTextAreaElement>() {
  const ref = useRef<T | null>(null);
  const fit = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.height = "0px";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, []);
  return { ref, fit };
}

/* -------------------------------------------------------------------------- */
/*                            Component main body                              */
/* -------------------------------------------------------------------------- */

export default function CommentOverlay({ reviewerLabel }: CommentOverlayProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);

  // --- reviewer code (e.g. "INT4") ---
  const [code, setCode] = useState<string | null>(null);

  // --- editing mode ---
  const [editing, setEditing] = useState<boolean>(true);

  // --- comments + UI ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState<{ xPct: number; yPct: number; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // --- modal for delete confirmation ---
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Per-comment saving state
  const [savingTextIds, setSavingTextIds] = useState<Set<string>>(new Set()); // show “Saving…” only for text edits
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const saveTimers = useRef<Record<string, number | NodeJS.Timeout>>({});

  // Latest comments ref for debounced saves
  const commentsRef = useRef<Comment[]>([]);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  const storeKey = useMemo(() => (code ? `thesis-comments-${code}` : null), [code]);

  /* --------------------------- reviewer initialization --------------------------- */

  useEffect(() => {
    if (!reviewerLabel) {
      setCode("guest"); // Public (no token) = read-only guest
      return;
    }
    setCode(reviewerLabel);
    const welcomeKey = `welcome-shown-${reviewerLabel}`;
    if (!localStorage.getItem(welcomeKey)) {
      setToast(
        `Welcome. Your comments will be stored under your reviewer ID (${reviewerLabel}). Your notes are visible to the author; not to other reviewers.`
      );
      localStorage.setItem(welcomeKey, "1");
      setTimeout(() => setToast(null), 4200);
    }
  }, [reviewerLabel]);

  /* --------------------------------- loading ---------------------------------- */

  // Load from Supabase (for this reviewer)
  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("reviewer_code", code)
        .order("num", { ascending: true });

      if (data) {
        setComments(
          data.map((d) => ({
            id: d.id,
            num: d.num,
            xPct: d.x_pct,
            yPct: d.y_pct,
            text: d.text || "",
            collapsed: d.collapsed,
            createdAt: new Date(d.created_at).getTime(),
            updatedAt: new Date(d.updated_at).getTime(),
          }))
        );
      }
    })();
  }, [code]);

  /* ---------------------------- per-comment saving ----------------------------- */

  // reason: "text" | "position" | "collapse"
  function queueSave(id: string, reason: "text" | "position" | "collapse") {
    // clear existing timer
    const t = saveTimers.current[id];
    if (t) clearTimeout(t as number);

    // Only show “Saving…” for text edits
    if (reason === "text") {
      setSavingTextIds((prev) => new Set(prev).add(id));
    }

    saveTimers.current[id] = setTimeout(async () => {
      const item = commentsRef.current.find((c) => c.id === id);
      if (!item || !code) {
        if (reason === "text") {
          setSavingTextIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        return;
      }

      try {
        await supabase.from("comments").upsert({
          id: item.id,
          reviewer_code: code,
          num: item.num,
          x_pct: item.xPct,
          y_pct: item.yPct,
          text: item.text,
          collapsed: item.collapsed,
          created_at: new Date(item.createdAt).toISOString(),
          updated_at: new Date(item.updatedAt).toISOString(),
        });
        setSavedAt((prev) => ({ ...prev, [id]: Date.now() }));
      } finally {
        if (reason === "text") {
          setSavingTextIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        delete saveTimers.current[id];
      }
    }, 400); // debounce per id
  }

  /* ------------------------------ draft autofocus ------------------------------ */

  useEffect(() => {
    if (!draft) return;
    requestAnimationFrame(() => {
      const el = draftInputRef.current;
      if (el) {
        el.focus();
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    });
  }, [draft]);

  /* ------------------------- right-click to place draft ------------------------ */

  useEffect(() => {
    if (!editing) return;

    function onCtx(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-comment-box]")) return;

      e.preventDefault();

      const el = layerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      setDraft({
        xPct: Math.max(0, Math.min(100, xPct)),
        yPct: Math.max(0, Math.min(100, yPct)),
        text: "",
      });
    }

    window.addEventListener("contextmenu", onCtx, { capture: true });
    return () => window.removeEventListener("contextmenu", onCtx, { capture: true } as any);
  }, [editing]);

  /* ------------------------------- add comments ------------------------------- */

  const getNextNum = (list: Comment[]) => list.reduce((m, c) => Math.max(m, c.num || 0), 0) + 1;

  const saveDraft = useCallback(() => {
    if (!draft) return;
    const newId = crypto.randomUUID();
    setComments((prev) => {
      const c: Comment = {
        id: newId,
        num: getNextNum(prev),
        xPct: draft.xPct,
        yPct: draft.yPct,
        text: draft.text.trim(),
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return [...prev, c];
    });
    setDraft(null);
    setToast("Comment saved");
    setTimeout(() => setToast(null), 2000);
    queueSave(newId, "text"); // initial save counts as text edit
  }, [draft]);

  const createEmptyBox = useCallback(() => {
    if (!draft) return;
    const newId = crypto.randomUUID();
    setComments((prev) => {
      const c: Comment = {
        id: newId,
        num: getNextNum(prev),
        xPct: draft.xPct,
        yPct: draft.yPct,
        text: "",
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return [...prev, c];
    });
    setDraft(null);
    queueSave(newId, "position");
  }, [draft]);

  /* --------------------------------- editing --------------------------------- */

  function startDrag(e: React.PointerEvent, id: string) {
    if (!editing) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const el = layerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const current = comments.find((c) => c.id === id);
    if (!current) return;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nx = clamp(current.xPct + (dx / rect.width) * 100);
      const ny = clamp(current.yPct + (dy / rect.height) * 100);
      setComments((cs) => cs.map((c) => (c.id === id ? { ...c, xPct: nx, yPct: ny, updatedAt: Date.now() } : c)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      queueSave(id, "position"); // save when drag ends
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const updateText = (id: string, text: string) => {
    if (!editing) return;
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, text, updatedAt: Date.now() } : c)));
    queueSave(id, "text");
  };

  const toggleCollapse = (id: string) => {
    if (!editing) return;
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, collapsed: !c.collapsed, updatedAt: Date.now() } : c)));
    queueSave(id, "collapse"); // persist collapse, but won’t show “Saving…”
  };

  const deleteComment = async (id: string) => {
    if (!editing) return;
    const c = comments.find((cm) => cm.id === id);
    if (!c) return;
    setDeleteTarget(id); // open modal; actual delete in modal button
  };

  /* ---------------------------------- render --------------------------------- */

  return (
    <>
      {/* Editing toggle (top-left) */}
      <button
        onClick={() => setEditing((e) => !e)}
        className="fixed z-[80] top-3 left-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-1.5 shadow text-sm"
        title={editing ? "Quit editing mode" : "Enter editing mode"}
      >
        {editing ? "Quit editing mode" : "Enter editing mode"}
      </button>

      {/* toast */}
      {toast && (
        <div className="fixed z-[70] bottom-4 right-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{toast}</div>
        </div>
      )}

      {/* PAGE-ANCHORED overlay */}
      <div ref={layerRef} className="absolute inset-0 z-40 pointer-events-none" />

      {/* Draft mini input (only when editing) */}
      {editing && draft && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{ left: `${draft.xPct}%`, top: `${draft.yPct}%`, transform: "translate(-4px, -24px)" }}
        >
          <div className="w-[280px] rounded-xl border border-neutral-300 bg-white text-neutral-900 p-3 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-xs text-neutral-500">New comment</span>
              </div>

              {/* multi-line draft textarea */}
              <textarea
                ref={draftInputRef}
                value={draft.text}
                onChange={(e) => {
                  setDraft({ ...draft, text: e.target.value });
                  const el = draftInputRef.current;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
                onKeyDown={(e) => {
                  // Enter inserts newline; no submit
                  if (e.key === "Enter") return;
                }}
                placeholder="Write your comment..."
                className="w-full bg-transparent outline-none text-sm leading-snug resize-none overflow-hidden placeholder-neutral-500"
                rows={1}
                style={{ minHeight: "1.5rem" }}
              />

              <div className="flex justify-end">
                <button
                  disabled={!draft.text.trim()}
                  onClick={saveDraft}
                  className="text-sm px-2 py-1 rounded-md border border-neutral-200 hover:bg-neutral-100 cursor-pointer disabled:opacity-40"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments (view-only when editing=false) */}
      {comments.map((c) => (
        <CommentBox
          key={c.id}
          c={c}
          code={code}
          editing={editing}
          onStartDrag={startDrag}
          onToggle={() => toggleCollapse(c.id)}
          onDelete={() => deleteComment(c.id)}
          onText={(t) => updateText(c.id, t)}
          isSavingText={savingTextIds.has(c.id)}
          savedAt={savedAt[c.id] ?? null}
        />
      ))}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-neutral-200 max-w-sm w-full mx-6 p-6 text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Delete comment?</h3>
            <p className="text-sm text-neutral-600 mb-6">This comment will be permanently removed from your reviewer session.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteTarget) return;
                  try {
                    await supabase.from("comments").delete().eq("id", deleteTarget);
                    setComments((cs) => cs.filter((c) => c.id !== deleteTarget));
                    setToast("Comment deleted");
                    setTimeout(() => setToast(null), 1500);
                  } catch (err) {
                    console.error("Delete failed", err);
                    setToast("Error deleting comment");
                    setTimeout(() => setToast(null), 2000);
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================ CommentBox ================================ */

function CommentBox({
  c,
  code,
  editing,
  onStartDrag,
  onToggle,
  onDelete,
  onText,
  isSavingText,
  savedAt,
}: {
  c: Comment;
  code: string | null;
  editing: boolean;
  onStartDrag: (e: React.PointerEvent, id: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onText: (t: string) => void;
  isSavingText: boolean;
  savedAt: number | null;
}) {
  const { ref: taRef, fit } = useAutosizeTextArea<HTMLTextAreaElement>();
  useEffect(() => {
    fit();
  }, [c.text, fit]);

  const label = code === "guest" ? "" : code;

  const containerBase =
    "absolute z-50 select-none " + (editing ? "pointer-events-auto" : "pointer-events-none cursor-default opacity-95");

  const dragAreaClasses = "flex items-center gap-2 px-2 py-1 cursor-grab active:cursor-grabbing select-none";

  return (
    <div
      data-comment-box
      className={containerBase}
      style={{
        left: `${c.xPct}%`,
        top: `${c.yPct}%`,
        transform: "translate(-4px, -24px)",
      }}
    >
      {c.collapsed ? (
        <div
          className="rounded-full border border-neutral-300 bg-white text-neutral-900 shadow"
          onClick={(e) => {
            if (!editing) return;
            e.stopPropagation();
            onToggle();
          }}
        >
          <div className={dragAreaClasses} onPointerDown={(e) => onStartDrag(e, c.id)} style={{ padding: "6px 8px" }} title={`Comment #${c.num}${label ? ` — ${label}` : ""}`}>
            <div className="w-3.5 h-3.5 rounded-full bg-violet-600 shrink-0" />
            <span className="text-xs font-medium">{`Comment #${c.num}`}</span>
          </div>
        </div>
      ) : (
        <div className="w-[340px] max-w-[84vw] rounded-xl border border-neutral-300 bg-white text-neutral-900 shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className={dragAreaClasses} onPointerDown={(e) => onStartDrag(e, c.id)} title="Drag comment" style={{ marginLeft: "-8px", marginRight: "4px" }}>
              <div className="w-4 h-4 rounded-full bg-violet-600" />
              <div className="text-xs text-neutral-600">{`Comment #${c.num}`}</div>
            </div>
            <button
              onClick={(e) => {
                if (!editing) return;
                e.stopPropagation();
                onToggle();
              }}
              className="relative px-2 py-1 text-neutral-500 hover:text-neutral-800 cursor-pointer"
              title="Collapse"
              aria-label="Collapse"
              style={{ padding: "8px" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>

          {/* body */}
          <div className="px-3 pb-3">
            <textarea
              ref={taRef}
              value={c.text}
              onChange={(e) => onText(e.target.value)}
              readOnly={!editing}
              className={"w-full bg-transparent outline-none text-sm leading-snug resize-none " + (!editing ? "opacity-80" : "")}
              placeholder={editing ? "Write your note…" : ""}
              rows={1}
              autoFocus={editing && !c.collapsed}
            />

            {/* footer */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={(e) => {
                  if (!editing) return;
                  e.stopPropagation();
                  onDelete();
                }}
                className={"text-xs cursor-pointer " + (editing ? "text-neutral-500 hover:text-red-600" : "opacity-50")}
              >
                Delete
              </button>

              {/* per-comment status (text edits only) */}
              <div className="text-xs tabular-nums text-neutral-500">{isSavingText ? "Saving…" : savedAt ? "Saved" : ""}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
