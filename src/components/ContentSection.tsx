"use client";

import { useRef, useState, useEffect } from "react";
import ThemeCommentPanel from "./ThemeCommentPanel";
import { supabase } from "@/lib/supabaseClient";
import BoardOverlay from "./BoardOverlay";

type SliderView = { value: number; saving: boolean };
type SlidersMap = Record<string, SliderView>;

type Props = {
  sliders: SlidersMap;
  onChange: (sectionKey: string, itemKey: string, nextVal: number) => void;
  token?: string | null;
  canComment: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  columnRef: React.RefObject<HTMLDivElement | null>;
};

function InlineSlider({
  value,
  saving,
  labelLeft,
  labelRight,
  onChange,
}: {
  value: number;
  saving: boolean;
  labelLeft: string;
  labelRight: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between text-[11px] text-neutral-500 mb-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value ?? 50}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neutral-900 cursor-grab active:cursor-grabbing"
      />
      <div className="text-[11px] text-neutral-400 text-right mt-1 tabular-nums">
        {saving ? "Saving…" : "Saved"}
      </div>
    </div>
  );
}

function Block({
  index,
  title,
  bullets,
  sectionKey,
  itemKey,
  sliders,
  onChange,
  token,
  canComment,
  containerRef,
  columnRef,
}: {
  index: number;
  title: string;
  bullets: string[];
  sectionKey: string;
  itemKey: string;
  sliders: SlidersMap;
  onChange: (sectionKey: string, itemKey: string, nextVal: number) => void;
  token?: string | null;
  canComment: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  columnRef: React.RefObject<HTMLDivElement | null>;
}) {
  const sliderId = `${sectionKey}::${itemKey}`;
  const sliderState = sliders[sliderId] || { value: 50, saving: false };

  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [hasNote, setHasNote] = useState(false);

  // --- Callbacks from ThemeCommentPanel to keep anchor button in sync
  const handleSaved = (text: string) => {
    setHasNote(!!text.trim());
  };

  const handleDeleted = async () => {
    setHasNote(false);
    setOpen(false);
  
    // Ensure future restores won’t reopen a deleted panel (defensive)
    if (token) {
      try {
        await supabase.rpc("theme_comment_panel_open_set", {
          p_token: token,
          p_section_key: sectionKey,
          p_item_key: itemKey,
          p_is_open: false,
        });
      } catch (err) {
        console.error("Failed to persist is_open=false after delete", err);
      }
    }
  };
  

  const handleCollapsedChange = async (collapsed: boolean, text: string) => {
    // Presence depends on content, not the collapsed flag
    setHasNote(!!text.trim());
  
    if (token) {
      try {
        await supabase.rpc("theme_comment_panel_open_set", {
          p_token: token,
          p_section_key: sectionKey,
          p_item_key: itemKey,
          p_is_open: collapsed ? false : true,
        });
      } catch (err) {
        console.error("Failed to persist is_open after collapse toggle", err);
      }
    }
  
    if (collapsed) setOpen(false);
  };
  

  // --- Open via red anchor button (persist is_open=true)
  const openPersisted = async () => {
    if (!token) {
      setOpen(true);
      return;
    }
    await supabase.rpc("theme_comment_panel_open_set", {
      p_token: token,
      p_section_key: sectionKey,
      p_item_key: itemKey,
      p_is_open: true,
    });
    setOpen(true);
  };

  // --- Close helper used by the panel's onClose (persist is_open=false)
  const closePanel = async () => {
    if (token) {
      await supabase.rpc("theme_comment_panel_open_set", {
        p_token: token,
        p_section_key: sectionKey,
        p_item_key: itemKey,
        p_is_open: false,
      });
    }
    setOpen(false);
  };

  // --- Initial fetch: detect presence, auto-restore if (is_open && !collapsed)
  useEffect(() => {
    let cancelled = false;
    if (!token || !canComment) return;

    (async () => {
      const { data, error } = await supabase.rpc("theme_panel_get", {
        p_token: token,
        p_section_key: sectionKey,
        p_item_key: itemKey,
      });
      if (cancelled || error) return;

      const r = Array.isArray(data) ? data[0] : data;
      const present = !!(r?.text && String(r.text).trim().length > 0);
      setHasNote(present);

      if (r?.is_open && r?.collapsed === false) {
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, canComment, sectionKey, itemKey]);

  return (
    <section className="flex gap-4 w-full">
      <div className="shrink-0">
        <div className="text-4xl font-semibold text-neutral-300/90 leading-none tabular-nums tracking-tight select-none mt-0.5">
          {index.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="relative flex-1">
      <div
        ref={cardRef}
        className="group relative rounded-xl border border-neutral-200 bg-white shadow-sm p-5
                  transition-shadow duration-150 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-[1.0625rem] font-semibold text-neutral-900 tracking-tight mb-3">{title}</h3>
        </div>

        {canComment && token ? (
          <button
            data-theme-comment-trigger
            onClick={openPersisted}
            className={`absolute top-3 -right-27.5 translate-x-2 -translate-y-2 rounded-lg px-2.5 py-1 text-sm cursor-pointer
              ${hasNote
                ? "bg-emerald-700 text-white shadow ring-1 ring-emerald-800/40"
                : "bg-black text-white shadow ring-1 ring-black hover:bg-neutral-600"}`}
            title={hasNote ? "View/edit comment" : "Add comment"}
          >
            {hasNote ? "Comment ✓" : "+ Comment"}
          </button>
        ) : null}

          <ul className="list-disc pl-5 space-y-1.5 text-[0.95rem] leading-relaxed text-neutral-800 marker:text-neutral-400">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <InlineSlider
            value={sliderState.value}
            saving={sliderState.saving}
            labelLeft="Not used"
            labelRight="Central to my advocacy"
            onChange={(v) => onChange(sectionKey, itemKey, v)}
          />
        </div>

        {open && token ? (
          <ThemeCommentPanel
            token={token}
            sectionKey={sectionKey}
            itemKey={itemKey}
            containerRef={containerRef}
            columnRef={columnRef}
            anchorRef={cardRef}
            onClose={() => setOpen(false)}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCollapsedChange={handleCollapsedChange}
          />
        ) : null}
      </div>
    </section>
  );
}

export default function ContentSection(props: Props) {
  const { sliders, onChange, token, canComment, containerRef, columnRef } = props;
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className=" text-4xl font-semibold italic text-neutral-300"> Core themes</h2>
      </div>
      <Block
        index={1}
        title="Connection to Customer"
        bullets={[
          "Represent real customer signals instead of assumptions.",
          "Ground decisions in observed behavior, not opinion.",
          "Surface unmet needs before costly builds.",
        ]}
        sectionKey="content"
        itemKey="customer"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={2}
        title="Integration / Efficiency"
        bullets={[
          "Align product, engineering, and business around a shared problem view.",
          "Reduce rework by removing ambiguity early.",
          "Accelerate delivery by avoiding building the wrong thing.",
        ]}
        sectionKey="content"
        itemKey="integrator"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={3}
        title="Differentiation / Quality"
        bullets={[
          "Create experiences competitors cannot copy easily.",
          "Shape moments that feel unique, credible, and premium.",
          "Avoid generic outcomes that erode perceived value.",
        ]}
        sectionKey="content"
        itemKey="differentiator"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={4}
        title="Strategic Lens / Foresight"
        bullets={[
          "Frame direction in human terms (not only technical/financial).",
          "Create narratives about where the product should move next.",
          "Help leadership see beyond immediate delivery.",
        ]}
        sectionKey="content"
        itemKey="strategic"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <div>
        <h2 className="text-4xl font-semibold italic text-neutral-300"> Supporting themes</h2>
      </div>
      <Block
        index={5}
        title="Consistency & Scale"
        bullets={[
          "Standards and systems reduce cognitive load and delivery variance.",
          "Scale good patterns; shrink avoidable divergence.",
          "Enable multiple teams to ship with coherence.",
        ]}
        sectionKey="content"
        itemKey="consistency"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={6}
        title="Culture / Evangelism"
        bullets={[
          "Grow organizational literacy: roadshows, brown-bags, embeds.",
          "Make customer stories travel; celebrate wins tied to outcomes.",
          "Recruit allies who can repeat the message in key rooms.",
        ]}
        sectionKey="content"
        itemKey="culture"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={7}
        title="Designer's Creativity"
        bullets={[
          "Designers have natural capability to be creative.",
          "Using creative exploration to unlock new economic paths.",
          "De-risk 'new bets' by making them tangible early.",
        ]}
        sectionKey="content"
        itemKey="creativity"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />

      {/* Prioritization Board */}
      <div className="mt-12">
        <h3 className=" text-4xl font-semibold italic text-neutral-300 mb-3">
          Prioritization Board
        </h3>
        <p className="text-neutral-700 text-md mb-3">
          Please drag the abovementioned default themes (and add your own notes) to indicate priority and grouping. Your layout autosaves. 
        </p>
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          <BoardOverlay token={token} canEdit={!!canComment} />
        </div>
      </div>
    </div>
  );
}
