"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addKnownReviewerCode, getReviewerLabel, getSessionFromUrlOrStorage } from "../lib/session";
import { supabase } from "../lib/supabaseClient";


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

export default function CommentOverlay() {
  const layerRef = useRef<HTMLDivElement>(null);

  // --- session / code ---
  const [code, setCode] = useState<string | null>(null);

  // --- editing mode (ON by default) ---
  const [editing, setEditing] = useState<boolean>(true);

  // --- state ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState<{ xPct: number; yPct: number; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const storeKey = useMemo(() => (code ? `thesis-comments-${code}` : null), [code]);

  // init session
  useEffect(() => {
    const s = getSessionFromUrlOrStorage();
    if (s?.code) {
      setCode(s.code);
      addKnownReviewerCode(s.code);
      const welcomeKey = `welcome-shown-${s.code}`;
      if (!localStorage.getItem(welcomeKey)) {
        setToast(
          `Welcome. Your comments will be stored under your reviewer ID (${getReviewerLabel(s.code) ?? s.code}). Your notes are visible to the author; not to other reviewers.`
        );
        localStorage.setItem(welcomeKey, "1");
        setTimeout(() => setToast(null), 4200);
      }
    } else {
      setCode("guest");
    }
  }, []);

  // Load from Supabase
useEffect(() => {
    if (!code) return;
    const load = async () => {
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
    };
    load();
  }, [code]);

  // Sync to Supabase
useEffect(() => {
    if (!code || comments.length === 0) return;
  
    const sync = async () => {
      // Upsert (insert or update) each comment
      for (const c of comments) {
        await supabase.from("comments").upsert({
          id: c.id,
          reviewer_code: code,
          num: c.num,
          x_pct: c.xPct,
          y_pct: c.yPct,
          text: c.text,
          collapsed: c.collapsed,
          created_at: new Date(c.createdAt).toISOString(),
          updated_at: new Date(c.updatedAt).toISOString(),
        });
      }
    };
    sync();
  }, [comments, code]);

  // next number
  const nextNum = useMemo(
    () => comments.reduce((m, c) => Math.max(m, c.num || 0), 0) + 1,
    [comments]
  );

  // Intercept right-click globally when editing
useEffect(() => {
    if (!editing) return;
  
    function onCtx(e: MouseEvent) {
      // If the user right-clicks on an existing comment box, do nothing
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-comment-box]")) return;
  
      // Otherwise: prevent the native menu and place a draft
      e.preventDefault();
  
      const el = layerRef.current;
      if (!el) return;
  
      const rect = el.getBoundingClientRect();
      // clientX/clientY are viewport-based, rect.* is also viewport-based
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
  
      setDraft({ xPct: Math.max(0, Math.min(100, xPct)), yPct: Math.max(0, Math.min(100, yPct)), text: "" });
    }
  
    // Capture early so nothing else shows the menu
    window.addEventListener("contextmenu", onCtx, { capture: true });
    return () => window.removeEventListener("contextmenu", onCtx, { capture: true } as any);
  }, [editing]);
  

  // save draft (✓ or Enter)
  const saveDraft = useCallback(() => {
    if (!draft) return;
    const c: Comment = {
      id: crypto.randomUUID(),
      num: nextNum,
      xPct: draft.xPct,
      yPct: draft.yPct,
      text: draft.text.trim(),
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setComments(cs => [...cs, c]);
    setDraft(null);
    setToast("✓ Comment saved");
    setTimeout(() => setToast(null), 1200);
  }, [draft, nextNum]);

  const createEmptyBox = useCallback(() => {
    if (!draft) return;
    const c: Comment = {
      id: crypto.randomUUID(),
      num: nextNum,
      xPct: draft.xPct,
      yPct: draft.yPct,
      text: "",
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setComments(cs => [...cs, c]);
    setDraft(null);
  }, [draft, nextNum]);

  // drag (only when editing)
  function startDrag(e: React.PointerEvent, id: string) {
    if (!editing) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const el = layerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const current = comments.find(c => c.id === id);
    if (!current) return;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const nx = clamp(current.xPct + (dx / rect.width) * 100);
      const ny = clamp(current.yPct + (dy / rect.height) * 100);
      setComments(cs => cs.map(c => (c.id === id ? { ...c, xPct: nx, yPct: ny, updatedAt: Date.now() } : c)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const updateText = (id: string, text: string) =>
    editing
      ? setComments(cs => cs.map(c => (c.id === id ? { ...c, text, updatedAt: Date.now() } : c)))
      : null;

  const toggleCollapse = (id: string) =>
    editing
      ? setComments(cs => cs.map(c => (c.id === id ? { ...c, collapsed: !c.collapsed } : c)))
      : null;

  const deleteComment = (id: string) => {
    if (!editing) return;
    if (!confirm("Delete comment?")) return;
    setComments(cs => cs.filter(c => c.id !== id));
    setToast("Deleted");
    setTimeout(() => setToast(null), 900);
  };

  // ===== RENDER =====
  return (
    <>
      {/* Editing toggle (top-left) */}
      <button
        onClick={() => setEditing(e => !e)}
        className="fixed z-[80] top-3 left-3 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-1.5 shadow text-sm"
        title={editing ? "Quit editing mode" : "Enter editing mode"}
      >
        {editing ? "Quit editing mode" : "Enter editing mode"}
      </button>

      {/* toast */}
      {toast && (
        <div className="fixed z-[70] bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-neutral-300 bg-white text-neutral-900 px-3 py-2 shadow">
          <div className="text-sm">{toast}</div>
        </div>
      )}

      {/* PAGE-ANCHORED overlay */}
      <div
        ref={layerRef}
        className="absolute inset-0 z-40 pointer-events-none"
      />

      {/* Draft mini input (only when editing) */}
      {editing && draft && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{ left: `${draft.xPct}%`, top: `${draft.yPct}%`, transform: "translate(-4px, -24px)" }}
        >
          <div className="w-[280px] rounded-xl border border-neutral-300 bg-white text-neutral-900 p-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <input
                autoFocus
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.text.trim()) saveDraft();
                    else createEmptyBox();
                  }
                }}
                placeholder="Add a comment… (Enter to add)"
                className="flex-1 bg-transparent outline-none text-sm placeholder-neutral-500"
              />
              <button
                disabled={!draft.text.trim()}
                onClick={saveDraft}
                className="text-sm disabled:opacity-40"
                aria-label="Save"
                title="Save"
              >
                ✓
              </button>
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
        />
      ))}
    </>
  );
}

// ===== CommentBox =====
function CommentBox({
    c,
    code,
    editing,
    onStartDrag,
    onToggle,
    onDelete,
    onText,
  }: {
    c: Comment;
    code: string | null;
    editing: boolean;
    onStartDrag: (e: React.PointerEvent, id: string) => void;
    onToggle: () => void;
    onDelete: () => void;
    onText: (t: string) => void;
  }) {
    const { ref: taRef, fit } = useAutosizeTextArea<HTMLTextAreaElement>();
    useEffect(() => {
      fit();
    }, [c.text, fit]);
  
    const label = code ? getReviewerLabel(code) ?? code : "";
  
    // Styles shared by both collapsed and expanded
    const containerBase =
      "absolute z-50 select-none " +
      (editing
        ? "pointer-events-auto"
        : "pointer-events-none cursor-default opacity-95");
  
    // Area that triggers drag (icon + label)
    const dragAreaClasses =
      "flex items-center gap-2 px-2 py-1 cursor-grab active:cursor-grabbing select-none";
  
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
          // ─────── Collapsed State ───────
          <div
            className="rounded-full border border-neutral-300 bg-white text-neutral-900 shadow"
            onClick={(e) => {
              if (!editing) return;
              e.stopPropagation();
              onToggle();
            }}
          >
            <div
              className={dragAreaClasses}
              onPointerDown={(e) => onStartDrag(e, c.id)}
              style={{ padding: "6px 8px" }}
              title={`Comment #${c.num}${label ? ` — ${label}` : ""}`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-violet-600 shrink-0" />
              <span className="text-xs font-medium">{`Comment #${c.num}`}</span>
            </div>
          </div>
        ) : (
          // ─────── Expanded State ───────
          <div className="w-[340px] max-w-[84vw] rounded-xl border border-neutral-300 bg-white text-neutral-900 shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between px-3 py-1">
              <div
                className={dragAreaClasses}
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
                className="relative px-2 py-1 text-neutral-500 hover:text-neutral-800"
                title="Collapse"
                aria-label="Collapse"
                style={{ padding: "8px" }} // larger click target
              >
                _
              </button>
            </div>
  
            {/* body */}
            <div className="px-3 pb-3">
              <textarea
                ref={taRef}
                value={c.text}
                onChange={(e) => onText(e.target.value)}
                onKeyDown={(e) => {
                  if (!editing) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                  }
                }}
                readOnly={!editing}
                className={
                  "w-full bg-transparent outline-none text-sm leading-snug resize-none " +
                  (!editing ? "opacity-80" : "")
                }
                placeholder={
                  editing
                    ? "Write your note… (Enter saves, Shift+Enter newline)"
                    : ""
                }
                rows={1}
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
                    "text-xs " +
                    (editing
                      ? "text-neutral-500 hover:text-red-600"
                      : "opacity-50")
                  }
                >
                  X Delete
                </button>
                <button
                  onClick={(e) => {
                    if (!editing) return;
                    e.stopPropagation();
                  }}
                  className={
                    "relative text-sm px-2 py-1 " +
                    (editing ? "hover:text-neutral-800" : "opacity-50")
                  }
                  title="Save"
                  aria-label="Save"
                  style={{ padding: "8px" }} // larger hit area
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
