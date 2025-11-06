"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

type PanelRow = {
  id: string;
  reviewer_token: string;
  section_key: string;
  item_key: string;
  title: string;
  text: string;
  collapsed: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  token: string;
  sectionKey: string;
  itemKey: string;
  /** Absolutely positioned INSIDE this container (must be relative, overflow-visible, with right padding gutter) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The inner .max-w-2xl column; panel pops out to its right */
  columnRef: React.RefObject<HTMLDivElement | null>;
  /** The card element this panel aligns to (top edge alignment) */
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  widthPx?: number;
  alignBottom?: boolean; // NEW
  onSaved?: (text: string) => void;
  onDeleted?: () => void;
  onCollapsedChange?: (collapsed: boolean, text: string) => void;
};

export default function ThemeCommentPanel({
  token,
  sectionKey,
  itemKey,
  containerRef,
  columnRef,
  anchorRef,
  onClose,
  widthPx = 360,
  alignBottom = true,
  onSaved,
  onDeleted,
  onCollapsedChange,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  // after: const panelRef = useRef<HTMLDivElement | null>(null);
const [panelHeight, setPanelHeight] = useState(0);

  // Keep height in sync with real DOM
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const measure = () => setPanelHeight(el.offsetHeight);
    measure(); // initial

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const [row, setRow] = useState<PanelRow | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [justSavedAt, setJustSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  const GAP = 16;
  const MARGIN = 8;

  const compute = () => {
    const container = containerRef.current as HTMLElement | null;
    const anchor = anchorRef.current as HTMLElement | null;
    const panel = panelRef.current as HTMLElement | null;
    if (!container || !anchor) return;

    const cr = container.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();

    const scrollTop = container.scrollTop || 0;
    const scrollLeft = container.scrollLeft || 0;

    const w = panel?.offsetWidth ?? widthPx;
    const h = panel?.offsetHeight ?? panelHeight; // if you keep panelHeight state, else fallback 0

    // --- LEFT: default to the right of the anchor (container coords)
    let left = (ar.right - cr.left) + scrollLeft + GAP;

    // Convert to absolute (document) to test overflow against the viewport
    const containerAbsLeft = cr.left + window.scrollX;
    const panelAbsLeft = containerAbsLeft + left - scrollLeft;
    const panelAbsRight = panelAbsLeft + w + MARGIN;
    const viewportAbsLeft = window.scrollX;
    const viewportAbsRight = window.scrollX + window.innerWidth;

    // Flip to the LEFT of the anchor only if overflowing viewport right
    if (panelAbsRight > viewportAbsRight) {
      left = (ar.left - cr.left) + scrollLeft - GAP - w;

      // If that flip would push it past the viewport's left edge, nudge right
      const flippedAbsLeft = containerAbsLeft + left - scrollLeft - MARGIN;
      if (flippedAbsLeft < viewportAbsLeft) {
        left += (viewportAbsLeft - flippedAbsLeft);
      }
    }

    // Minimal clamp so we don't hug the container's absolute left too tightly
    left = Math.max(MARGIN, left);

    // --- TOP: bottom-align to anchor; clamp not to go above anchor top
    let top = (ar.bottom - cr.top) + scrollTop - h;
    const minTop = (ar.top - cr.top) + scrollTop;
    top = alignBottom ? Math.max(top, minTop) : minTop;

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    compute();
  }, []);

  useEffect(() => {
    // Recompute on resize of key elements
    const ro = new ResizeObserver(() => compute());
    if (panelRef.current) ro.observe(panelRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    if (columnRef.current) ro.observe(columnRef.current);
    if (anchorRef.current) ro.observe(anchorRef.current);

    // Window scroll & resize can change rects; recompute
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // If container itself is scrollable, listen to it too
    const c = containerRef.current;
    if (c) c.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (c) c.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!coords) {
      const raf = requestAnimationFrame(() => compute());
      return () => cancelAnimationFrame(raf);
    }
  }, [coords]);

  // load/create
  useEffect(() => {
    let dead = false;
    (async () => {
      const { data, error } = await supabase.rpc("theme_panel_get", {
        p_token: token,
        p_section_key: sectionKey,
        p_item_key: itemKey,
      });
      if (error) {
        console.error("theme_panel_get error", error);
        return;
      }
      const r = Array.isArray(data) ? data[0] : data;
      if (!dead && r) {
        setRow(r);
        setDraft(r.text ?? "");
        // Position after first content paint to avoid 0x0 sizes affecting width
        requestAnimationFrame(() => compute());
      }
    })();
    return () => {
      dead = true;
    };
  }, [token, sectionKey, itemKey]);

  // autosave text
  function queueSave(nextText: string) {
    if (!row) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("theme_panel_upsert", {
        p_token: token,
        p_section_key: sectionKey,
        p_item_key: itemKey,
        p_title: row.title ?? "Comment",
        p_text: nextText,
        p_collapsed: row.collapsed ?? false,
      });
      if (!error) {
        const r = Array.isArray(data) ? data[0] : data;
        setRow(r);
        setJustSavedAt(Date.now());
        setTimeout(() => setJustSavedAt(null), 1200);
      } else {
        console.error("theme_panel_upsert error", error);
      }
      setSaving(false);
      saveTimer.current = null;
    }, 350);
  }

  async function collapse() {
    await supabase.rpc("theme_panel_collapse", {
      p_token: token,
      p_section_key: sectionKey,
      p_item_key: itemKey,
      p_collapsed: true,
    });
    onCollapsedChange?.(true, draft);
    onClose();
  }

  async function deletePanel() {
    await supabase.rpc("theme_panel_delete", {
      p_token: token,
      p_section_key: sectionKey,
      p_item_key: itemKey,
    });
    onDeleted?.();
    onClose();
  }

  async function commitNow() {
    if (!row) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("theme_panel_upsert", {
      p_token: token,
      p_section_key: sectionKey,
      p_item_key: itemKey,
      p_title: row.title ?? "Comment",
      p_text: draft,
      p_collapsed: row.collapsed ?? false,
    });
    setSaving(false);
    if (error) {
      console.error("commitNow error", error);
      return;
    }
    const r = Array.isArray(data) ? data[0] : data;
    setRow(r);
    setJustSavedAt(Date.now());
    setTimeout(() => setJustSavedAt(null), 1200);
    onSaved?.(draft);
  }

  if (!row) return null;

  // Ensure we render inside the container to align absolute positioning with computed coords
  if (!containerRef.current) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="absolute z-30 rounded-2xl border border-neutral-200 bg-white shadow-md"
      style={{
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        width: widthPx,
        visibility: coords ? "visible" : "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="text-sm font-medium">{row.title || "Comment"}</div>
        <button onClick={collapse} className="cursor-pointer text-neutral-500 hover:text-neutral-900" title="Collapse">
          –
        </button>
      </div>

      {/* Body */}
      <div className=" text-sm p-4">
        <textarea
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            queueSave(v);
          }}
          className="w-full h-30 resize-none outline-none"
          placeholder="Type your comment…"
        />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button onClick={deletePanel} className="cursor-pointer text-[12px] text-neutral-500 hover:text-red-600">
          Delete
        </button>

        <div className="flex items-center gap-3">
          {saving ? (
            <div className="text-[12px] text-neutral-500">Saving…</div>
          ) : justSavedAt ? (
            <div className="text-[12px] text-neutral-500 opacity-80">Saved</div>
          ) : null}

          <button
            onClick={commitNow}
            className="cursor-pointer rounded-md border border-neutral-900 bg-neutral-900 px-3 py-1 text-[12px] text-white"
            title="Save now"
          >
            ✓
          </button>
        </div>
      </div>
    </div>,
    containerRef.current
  );
}
