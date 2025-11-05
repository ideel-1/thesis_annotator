"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SynthesisBoxProps = {
  token: string | null;
  sectionKey?: string;       // defaults to "synthesis_main"
  canEdit: boolean;
  label?: string;            // optional UI label
  placeholder?: string;      // optional placeholder
};

export default function SynthesisBox({
  token,
  sectionKey = "synthesis_main",
  canEdit,
  label = "Final thoughts",
  placeholder = "Write a short synthesis: what resonates, what’s missing, what you would change…",
}: SynthesisBoxProps) {
  const [text, setText] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [justSavedAt, setJustSavedAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Auto-resize the textarea to fit content
  function resize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }

  // Initial load
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.rpc("synthesis_get", {
        p_token: token,
        p_section_key: sectionKey,
      });
      if (dead) return;
      if (error) {
        console.error("synthesis_get error", error);
      } else if (Array.isArray(data) && data.length) {
        const row = data[0];
        setText(row.content ?? "");
      }
      setLoaded(true);
    })();
    return () => { dead = true; };
  }, [token, sectionKey]);

  // Resize on load/text change
  useEffect(() => { resize(); }, [text, loaded]);

  // Debounced save
  function queueSave(next: string) {
    if (!token) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setSaving(true);

    saveTimerRef.current = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("synthesis_upsert", {
        p_token: token,
        p_section_key: sectionKey,
        p_text: next,
      });
      setSaving(false);
      if (error) {
        console.error("synthesis_upsert error", error);
        return;
      }
      setJustSavedAt(Date.now());
      window.setTimeout(() => setJustSavedAt(null), 1200);
      // optional: could read returned timestamps if your RPC returns them
    }, 400);
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!canEdit) return;
    const v = e.target.value;
    setText(v);
    resize();
    queueSave(v);
  }

  return (
    <div className="bg-white">
      <label className="block text-sm font-medium text-neutral-900 mb-2">
        {label}
      </label>

      <textarea
        ref={taRef}
        className="w-full text-sm leading-relaxed text-neutral-800 border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 resize-none overflow-hidden"
        style={{ minHeight: 160 }}
        placeholder={placeholder}
        value={text}
        onChange={onChange}
        readOnly={!canEdit}
      />

      <div className="mt-2 text-[12px] text-neutral-500 h-4">
        {saving ? "Saving…" : justSavedAt ? "Saved" : null}
      </div>
    </div>
  );
}
