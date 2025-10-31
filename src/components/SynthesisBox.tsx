"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SynthesisBoxProps = {
  token: string | null;
  sectionKey: string; // e.g. "synthesis_main"
  canEdit: boolean;
};

export default function SynthesisBox({
  token,
  sectionKey,
  canEdit,
}: SynthesisBoxProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // auto-resize textarea height to fit content
  function resizeTextarea() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }

  // Load existing synthesis on mount
  useEffect(() => {
    async function load() {
      if (!token) return;
      const { data, error } = await supabase.rpc("synthesis_get", {
        p_token: token,
        p_section_key: sectionKey,
      });
      if (error) {
        console.error("synthesis_get error", error);
        return;
      }
      if (data && data.length > 0) {
        const row = data[0];
        setText(row.content || "");
        setLastSavedAt(new Date(row.updated_at).getTime());
      }
      setLoaded(true);
    }
    load();
  }, [token, sectionKey]);

  // Resize textarea whenever text changes or after load
  useEffect(() => {
    resizeTextarea();
  }, [text, loaded]);

  // Queue save to Supabase after edits
  function queueSave(nextVal: string) {
    if (!token) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    setSaving(true);

    saveTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("synthesis_upsert", {
          p_token: token,
          p_section_key: sectionKey,
          p_text: nextVal,
        });
        if (error) {
          console.error("synthesis_upsert error", error);
        } else if (data && data.length > 0) {
          const row = data[0];
          setLastSavedAt(new Date(row.out_updated_at).getTime());
        }
      } finally {
        setSaving(false);
        saveTimer.current = null;
      }
    }, 400);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!canEdit) return;
    const val = e.target.value;
    setText(val);
    resizeTextarea();
    queueSave(val);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
      <label
        htmlFor="synthesis-textarea"
        className="block text-sm font-medium text-neutral-900 mb-2"
      >
        Your narrative
      </label>

      <textarea
        id="synthesis-textarea"
        ref={taRef}
        className="w-full text-sm leading-relaxed text-neutral-800 border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 resize-none overflow-hidden"
        style={{ minHeight: "160px" }}
        placeholder={`Example opener:\n\n"Our design work protects us from building the wrong thing. It gives us early proof of what's valuable to customers, so we can focus investment where it matters. Here's why that matters for us right now..."`}
        value={text}
        onChange={handleChange}
        readOnly={!canEdit}
      />

      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          This draft helps me understand how you personally frame design inside
          your environment.
        </p>

        <div className="text-[11px] text-neutral-500 tabular-nums ml-4 whitespace-nowrap">
          {saving
            ? "Saving…"
            : lastSavedAt
            ? "Saved"
            : loaded
            ? "Saved"
            : ""}
        </div>
      </div>
    </div>
  );
}
