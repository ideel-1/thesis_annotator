"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ImportanceSlider({
  token,
  themeKey,
}: {
  token: string | null;
  themeKey: string;
}) {
  const [value, setValue] = useState<number>(50); // mid default
  const saveTimer = useRef<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // load initial
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc(
        "theme_importance_get",
        {
          p_token: token,
          p_item_key: themeKey,
        }
      );
      if (error) {
        console.error("theme_importance_get error", error);
        return;
      }
      if (data && data.length && typeof data[0].importance === "number") {
        setValue(data[0].importance);
      }
    })();
  }, [token, themeKey]);

  // debounced save
  function queueSave(nextVal: number) {
    if (!token) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    setSaving(true);
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await supabase.rpc(
        "theme_importance_set",
        {
          p_token: token,
          p_item_key: themeKey,
          p_importance: nextVal,
        }
      );
      if (error) {
        console.error("theme_importance_set error", error);
      } else {
        setSavedAt(Date.now());
      }
      setSaving(false);
      saveTimer.current = null;
    }, 400);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-[13px] text-neutral-600">
        <span className="font-medium text-neutral-800">
          How important is this in your reality?
        </span>
        <span className="tabular-nums text-neutral-400">
          {saving ? "Saving…" : savedAt ? "Saved" : ""}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          setValue(v);
          queueSave(v);
        }}
        className="w-full accent-neutral-900"
      />

      <div className="flex justify-between text-[11px] text-neutral-500">
        <span>Very important</span>
        <span>Not important</span>
      </div>
    </div>
  );
}
