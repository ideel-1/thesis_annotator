/* -------------------------------NOT REALLY NEEDED-------------------------------------- */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Comment = {
  id: string;
  num: number;
  xPct: number; // 0-100 of full-page width
  yPct: number; // 0-100 of full-page height
  text: string;
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
};

type CommentOverlayProps = {
  reviewerLabel?: string; // e.g. "INT4"
  token: string;
  /** Optional CSS selector of the section that should show/accept comments (e.g., "section#content"). */
  scopeSelector?: string;
};

const clampPct = (v: number) => Math.max(0, Math.min(100, v));

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

export default function CommentOverlay({
  reviewerLabel,
  token,
  scopeSelector,
}: CommentOverlayProps) {
  /* ----------------------- page measurement / canvas ----------------------- */

  const [docHeight, setDocHeight] = useState<number>(0);
  const [scopeEl, setScopeEl] = useState<HTMLElement | null>(null);
  const [scopeBounds, setScopeBounds] = useState<{ top: number; bottom: number } | null>(null); 

  const measurePage = useCallback(() => {
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const width = document.documentElement.clientWidth;
    return { width, height: fullHeight };
  }, []);

  useEffect(() => {
    function measureAndStore() {
      const { height } = measurePage();
      setDocHeight(height);
    }
    measureAndStore();
    window.addEventListener("resize", measureAndStore);
    window.addEventListener("load", measureAndStore);
    return () => {
      window.removeEventListener("resize", measureAndStore);
      window.removeEventListener("load", measureAndStore);
    };
  }, [measurePage]);

  /* ------------------------------ scope bounds ----------------------------- */

  const [scopeTop, setScopeTop] = useState(0);
  const [scopeBottom, setScopeBottom] = useState(Infinity);

  const measureScope = useCallback(() => {
    if (!scopeSelector) {
      setScopeTop(0);
      setScopeBottom(Infinity);
      return;
    }
    const el = document.querySelector(scopeSelector) as HTMLElement | null;
    if (!el) {
      setScopeTop(0);
      setScopeBottom(Infinity);
      return;
    }
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const bottom = rect.bottom + window.scrollY;
    setScopeTop(top);
    setScopeBottom(bottom);
  }, [scopeSelector]);

  useEffect(() => {
    function measureAll() {
      const { height } = measurePage();
      setDocHeight(height);
  
      if (scopeEl) {
        const rect = scopeEl.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = rect.bottom + window.scrollY;
        setScopeBounds({ top, bottom });
      } else {
        setScopeBounds(null);
      }
    }
  
    measureAll();
    window.addEventListener("resize", measureAll);
    window.addEventListener("load", measureAll);
    return () => {
      window.removeEventListener("resize", measureAll);
      window.removeEventListener("load", measureAll);
    };
  }, [measurePage, scopeEl]);

  function isInScope(yPct: number): boolean {
    if (!scopeBounds) return true; // no scope => show all
    const { height } = measurePage();
    const yPx = (yPct / 100) * height;
    return yPx >= scopeBounds.top && yPx <= scopeBounds.bottom;
  }
  

  useEffect(() => {
    measureScope();
    window.addEventListener("resize", measureScope);
    window.addEventListener("scroll", measureScope, { passive: true });
    return () => {
      window.removeEventListener("resize", measureScope);
      window.removeEventListener("scroll", measureScope);
    };
  }, [measureScope]);

  /* ---------------------------- local state ---------------------------- */

  const draftInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState<{ xPct: number; yPct: number; text: string } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [savingTextIds, setSavingTextIds] = useState<Set<string>>(new Set());
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const saveTimers = useRef<Record<string, number | NodeJS.Timeout>>({});

  /* --------------------------- bootstrap reviewer --------------------------- */

  useEffect(() => {
    if (!reviewerLabel) setCode("guest");
    else setCode(reviewerLabel);
  }, [reviewerLabel]);

  /* ----------------------------- load comments ----------------------------- */

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("comments_list", { p_token: token });
      if (error) {
        console.error("comments_list error", error);
        return;
      }
      if (data) {
        setComments(
          data.map((d: any) => ({
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
  }, [token]);

  /* ------------------------------ supabase io ------------------------------ */

  async function insertOrUpdateOnServer(c: Comment, isInsert: boolean) {
    const { data, error } = await supabase.rpc("comment_upsert", {
      p_token: token,
      p_id: isInsert ? null : c.id,
      p_x_pct: c.xPct,
      p_y_pct: c.yPct,
      p_text: c.text,
      p_collapsed: c.collapsed,
      p_num: c.num,
    });
    if (error) throw error;
    return data;
  }

  function queueSave(id: string, reason: "text" | "position" | "collapse") {
    const existingTimer = saveTimers.current[id];
    if (existingTimer) clearTimeout(existingTimer as number);

    if (reason === "text") {
      setSavingTextIds((prev) => new Set(prev).add(id));
    }

    saveTimers.current[id] = setTimeout(async () => {
      const latest = comments.find((c) => c.id === id);
      if (!latest) {
        delete saveTimers.current[id];
        return;
      }

      try {
        const rowData = await insertOrUpdateOnServer(latest, false);
        const row = Array.isArray(rowData) ? rowData[0] : rowData;

        setSavedAt((s) => ({ ...s, [id]: Date.now() }));

        // Only update metadata (num, updatedAt). Keep our xPct/yPct/text.
        if (row) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    num: row.num ?? c.num,
                    updatedAt: row.updated_at
                      ? new Date(row.updated_at).getTime()
                      : c.updatedAt,
                  }
                : c
            )
          );
        }
      } catch (e) {
        console.error("save failed:", e);
        setToast("Save failed");
        setTimeout(() => setToast(null), 2000);
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
    }, 300);
  }

  /* --------------------------- draft creation --------------------------- */

  const getNextNum = (list: Comment[]) =>
    list.reduce((m, c) => Math.max(m, c.num || 0), 0) + 1;

  const saveDraft = useCallback(() => {
    if (!draft) return;

    const tempId = crypto.randomUUID();
    const temp: Comment = {
      id: tempId,
      num: getNextNum(comments),
      xPct: draft.xPct,
      yPct: draft.yPct,
      text: draft.text.trim(),
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // optimistic local add
    setComments((prev) => [...prev, temp]);
    setDraft(null);
    setToast("Comment saved");
    setTimeout(() => setToast(null), 2000);

    (async () => {
      try {
        const rowData = await insertOrUpdateOnServer(temp, true);
        const row = Array.isArray(rowData) ? rowData[0] : rowData;
        if (row) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === tempId
                ? {
                    ...c,
                    id: row.id,
                    num: row.num,
                    xPct: row.x_pct ?? c.xPct,
                    yPct: row.y_pct ?? c.yPct,
                    createdAt: new Date(row.created_at).getTime(),
                    updatedAt: new Date(row.updated_at).getTime(),
                  }
                : c
            )
          );
          setSavedAt((s) => ({ ...s, [row.id]: Date.now() }));
        }
      } catch (e) {
        console.error("insert failed:", e);
        setToast("Error saving");
        setTimeout(() => setToast(null), 2000);
      }
    })();
  }, [draft, comments, token]);

  // Right-click to start draft. Only inside scope (if provided).
  useEffect(() => {
    if (!editing) return;
  
    function onCtx(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
  
      // If we have a scope element, ignore right-clicks outside it
      if (scopeEl && target && !scopeEl.contains(target)) return;
  
      // Also ignore right-clicks on an existing comment
      if (target && target.closest("[data-comment-box]")) return;
  
      e.preventDefault();
  
      const { width, height } = measurePage();
      const pageX = e.clientX + window.scrollX;
      const pageY = e.clientY + window.scrollY;
  
      // If scoped, clamp Y into the section’s pixel range so drafts are always inside
      const yPxClamped = scopeBounds
        ? Math.max(scopeBounds.top, Math.min(scopeBounds.bottom, pageY))
        : pageY;
  
      const xPct = clampPct((pageX / width) * 100);
      const yPct = clampPct((yPxClamped / height) * 100);
  
      setDraft({ xPct, yPct, text: "" });
    }
  
    window.addEventListener("contextmenu", onCtx, { capture: true });
    return () => {
      window.removeEventListener("contextmenu", onCtx, { capture: true } as any);
    };
  }, [editing, measurePage, scopeEl, scopeBounds]);

  /* ----------------------------- delete flow ----------------------------- */

  function askDelete(id: string) {
    setConfirmingDeleteId(id);
  }

  async function confirmDelete(id: string) {
    try {
      const { error } = await supabase.rpc("comment_delete", {
        p_token: token,
        p_id: id,
      });
      if (error) throw error;

      setComments((cs) => cs.filter((c) => c.id !== id));
      setToast("Comment deleted");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      console.error("Delete failed", err);
      setToast("Error deleting comment");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setConfirmingDeleteId(null);
    }
  }

  /* ------------------------------- dragging ------------------------------- */

  function startDrag(e: React.PointerEvent, id: string) {
    if (!editing) return;

    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "button") return;

    const pin = comments.find((c) => c.id === id);
    if (!pin) return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const startXPct = pin.xPct;
    const startYPct = pin.yPct;

    const startClientX = e.clientX + window.scrollX;
    const startClientY = e.clientY + window.scrollY;

    function onMove(ev: PointerEvent) {
      const { width } = measurePage();

      const dxPx = ev.clientX + window.scrollX - startClientX;
      const dyPx = ev.clientY + window.scrollY - startClientY;

      const nextXPct = clampPct(startXPct + (dxPx / width) * 100);
      const nextYPct = clampPct(startYPct + (dyPx / docHeight) * 100);

      setComments((cs) =>
        cs.map((c) =>
          c.id === id
            ? {
                ...c,
                xPct: nextXPct,
                yPct: nextYPct,
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      queueSave(id, "position");
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ------------------------------- updates ------------------------------- */

  const updateText = (id: string, text: string) => {
    if (!editing) return;
    setComments((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              text,
              updatedAt: Date.now(),
            }
          : c
      )
    );
    queueSave(id, "text");
  };

  const toggleCollapse = (id: string) => {
    if (!editing) return;
    setComments((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              collapsed: !c.collapsed,
              updatedAt: Date.now(),
            }
          : c
      )
    );
    queueSave(id, "collapse");
  };

  /* ------------------------ visibility within scope ------------------------ */

  const visibleComments = scopeBounds
  ? comments.filter(c => isInScope(c.yPct))
  : comments;


  /* -------------------------------- render -------------------------------- */

  return (
    <>
      {/* edit mode toggle */}
      <button
        onClick={() => setEditing((e) => !e)}
        className="fixed z-[80] top-14 left-3 rounded-lg border cursor-pointer border-neutral-300 bg-white text-neutral-900 px-3 py-1.5 shadow text-sm"
        title={editing ? "Quit editing mode" : "Enter editing mode"}
      >
        {editing ? "Quit editing mode" : "Enter editing mode"}
      </button>

      {/* toast */}
      {toast && (
        <div className="fixed z-[80] bottom-4 right-4 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{toast}</div>
        </div>
      )}

      {/* FULL-PAGE OVERLAY LAYER */}
      <div
        className="absolute inset-x-0 top-0 w-full pointer-events-none z-[60]"
        style={{ height: `${docHeight}px` }}
      >
        {/* draft bubble inside overlay */}
        {editing && draft && (
          <div
            className="absolute z-[75] pointer-events-auto"
            style={{
              left: `${draft.xPct}%`,
              top: `${draft.yPct}%`,
              transform: "translate(-4px, -24px)",
            }}
          >
            <div className="w-[280px] rounded-xl border border-neutral-300 bg-white text-neutral-900 p-3 shadow-lg">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs text-neutral-500">New comment</span>
                </div>

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
                  className="w-full bg-transparent outline-none text-sm leading-snug resize-none overflow-hidden placeholder-neutral-500"
                  placeholder="Write your comment..."
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

        {/* existing comments, now filtered by scope */}
        {visibleComments.map((c) => (
          <CommentBox
            key={c.id}
            c={c}
            code={code}
            editing={editing}
            onStartDrag={startDrag}
            onToggle={() => toggleCollapse(c.id)}
            onDelete={() => askDelete(c.id)}
            onText={(t) => updateText(c.id, t)}
            isSavingText={savingTextIds.has(c.id)}
            savedAt={savedAt[c.id] ?? null}
          />
        ))}
      </div>

      {/* delete confirm modal */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-neutral-200 max-w-sm w-full mx-6 p-6 text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              Delete comment?
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              This comment will be permanently removed from your reviewer session.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmingDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmDelete(confirmingDeleteId);
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

  const dragHandleClasses =
    "flex items-center gap-2 px-2 py-1 cursor-grab active:cursor-grabbing select-none";

  const wrapperClasses =
    "absolute z-[75] select-none " +
    (editing
      ? "pointer-events-auto"
      : "pointer-events-none cursor-default opacity-95");

  return (
    <div
      data-comment-box
      className={wrapperClasses}
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
          <div
            className={dragHandleClasses}
            onPointerDown={(e) => onStartDrag(e, c.id)}
            title={`Comment #${c.num}${
              code && code !== "guest" ? ` - ${code}` : ""
            }`}
            style={{ padding: "6px 8px" }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-violet-600 shrink-0" />
            <span className="text-xs font-medium">{`Comment #${c.num}`}</span>
          </div>
        </div>
      ) : (
        <div className="w-[340px] max-w-[84vw] rounded-xl border border-neutral-300 bg-white text-neutral-900 shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between px-3 py-1">
            <div
              className={dragHandleClasses}
              onPointerDown={(e) => onStartDrag(e, c.id)}
              title="Drag comment"
              style={{ marginLeft: "-8px", marginRight: "4px" }}
            >
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
          </div>

          {/* body */}
          <div className="px-3 pb-3">
            <textarea
              ref={taRef}
              value={c.text}
              onChange={(e) => onText(e.target.value)}
              readOnly={!editing}
              className={
                "w-full bg-transparent outline-none text-sm leading-snug resize-none overflow-hidden " +
                (!editing ? "opacity-80" : "")
              }
              placeholder={editing ? "Write your note…" : ""}
              rows={1}
              style={{ minHeight: "1.5rem" }}
            />

            {/* footer */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={(e) => {
                  if (!editing) return;
                  e.stopPropagation();
                  onDelete();
                }}
                className={
                  "text-xs cursor-pointer " +
                  (editing
                    ? "text-neutral-500 hover:text-red-600"
                    : "opacity-50")
                }
              >
                Delete
              </button>

              <div className="text-xs tabular-nums text-neutral-500">
                {isSavingText ? "Saving…" : savedAt ? "Saved" : ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
