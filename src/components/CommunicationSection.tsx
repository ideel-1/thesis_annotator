"use client";

import { useRef, useState, useEffect } from "react";
import ThemeCommentPanel from "./ThemeCommentPanel";
import { supabase } from "@/lib/supabaseClient";

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
            labelLeft="Not convincing"
            labelRight="Highly effective"
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

export default function CommunicationSection({
  sliders,
  onChange,
  token,
  canComment,
  containerRef,
  columnRef,
}: Props) {
  return (
    <div className="flex flex-col gap-10">
      <Block
        index={1}
        title='Tangible Demonstration ("Show, Don’t Tell")'
        bullets={[
          "Visible results trump theory: demos and quick examples.",
          "Concrete artifacts shift debate from opinion to evidence.",
          "Executives react faster to what they can see.",
        ]}
        sectionKey="comm"
        itemKey="show_dont_tell"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={2}
        title="Prototypes and Shared Artifacts"
        bullets={[
          "Mocks and maps become shared references that align teams.",
          "They reduce ambiguity and de-risk investment decisions.",
          "Even rough prototypes invite concrete feedback.",
        ]}
        sectionKey="comm"
        itemKey="prototypes"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={3}
        title="Translate Design into Business Terms"
        bullets={[
          "Use terms already respected: revenue, risk, efficiency, reputation.",
          "Avoid design jargon; make it a business point.",
          "Often required to access budget and prioritization forums.",
        ]}
        sectionKey="comm"
        itemKey="translation"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={4}
        title="Metrics & Evidence"
        bullets={[
          "Pair qualitative stories with credible metrics and baselines.",
          "Define success criteria early; avoid vanity KPIs.",
          "Instrument experiments to generate decision-grade signals.",
        ]}
        sectionKey="comm"
        itemKey="metrics"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={5}
        title="Sequencing & Small Wins"
        bullets={[
          "Earn permission with fast, low-risk improvements.",
          "Sequence bets so each step unlocks the next forum.",
          "Expose progress at decision rhythms leadership already uses.",
        ]}
        sectionKey="comm"
        itemKey="small_wins"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
      <Block
        index={6}
        title="Repetition & Consistency"
        bullets={[
          "Repeat the same framing across forums and roles.",
          "Make advocates in other functions repeat your story.",
          "Advocacy is iterative; consistency builds credibility.",
        ]}
        sectionKey="comm"
        itemKey="repetition"
        sliders={sliders}
        onChange={onChange}
        token={token}
        canComment={canComment}
        containerRef={containerRef}
        columnRef={columnRef}
      />
    </div>
  );
}
