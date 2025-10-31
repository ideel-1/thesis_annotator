"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

type ChapterKey = "context" | "content" | "communication" | "synthesis";

type NoteRow = {
  reviewer_label: string;
  chapter_key: ChapterKey;
  summary: string;
  quotes: string[];
  sort_order: number;
};

export default function ReviewerNotes({
  token,
  visible,
}: {
  token: string | null;
  visible: boolean;
}) {
  const [rows, setRows] = useState<NoteRow[] | null>(null);
  const [mounts, setMounts] = useState<Record<ChapterKey, HTMLElement | null>>({
    context: null,
    content: null,
    communication: null,
    synthesis: null,
  });

  // Safely resolve mount targets on client only (optional mounts)
  useEffect(() => {
    if (typeof document === "undefined") return;
    setMounts({
      context: document.getElementById("notes-context-mount"),
      content: document.getElementById("notes-content-mount"),
      communication: document.getElementById("notes-communication-mount"),
      synthesis: document.getElementById("notes-synthesis-mount"),
    });
  }, []);

  // Fetch notes for the reviewer resolved by token
  useEffect(() => {
    if (!token || !visible) return;
    const clean = token.trim(); 


    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("interview_notes_get_text", {
        p_token: clean, // FIX: use the prop, not tokenRaw
      });
      if (cancelled) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("interview_notes_get rpc error:", error);
        setRows([]);
        return;
      }

      const normalized: NoteRow[] = (data ?? []).map((d: any) => ({
        reviewer_label: d.reviewer_label,
        chapter_key: d.chapter_key as ChapterKey,
        summary: d.summary,
        quotes: Array.isArray(d.quotes) ? d.quotes : [],
        sort_order: d.sort_order ?? 0,
      }));

      setRows(normalized);

      // In ReviewerNotes, inside the effect where you call the RPC:
      const { data: who } = await supabase
      .from("reviewers")
      .select("label")
      .eq("token", clean)
      .maybeSingle();

      if (who?.label) {
      const { data: rowsDirect, error: errDirect } = await supabase
        .from("interview_notes")
        .select("reviewer_label,chapter_key,summary,quotes,sort_order,updated_at")
        .eq("reviewer_label", who.label)
        .order("sort_order", { ascending: true });

      console.log("[direct] notes", rowsDirect, errDirect);
      }


    })();

    

    return () => {
      cancelled = true;
    };
  }, [token, visible]);

  if (!visible || !rows) return null;

  const byChapter = new Map<ChapterKey, NoteRow>();
  for (const r of rows) byChapter.set(r.chapter_key, r);

  const renderCard = (chapter: ChapterKey, title: string) => {
    const row = byChapter.get(chapter);
    if (!row) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-[0_8px_30px_rgba(16,185,129,0.15)] p-6">
        <div className="text-md uppercase tracking-wide text-emerald-700 mb-1">
          What you said regarding this topic:
        </div>

        <p className="text-md leading-7 text-neutral-800 mb-3 mt-3">{row.summary}</p>
        <div className="text-md uppercase tracking-wide text-emerald-700 mb-1">
          Some quotes you mentioned:
        </div>
        {row.quotes?.length ? (
          <ul className="text-md leading-7 text-neutral-700 list-disc pl-5">
            {row.quotes.slice(0, 4).map((q, i) => (
              <li key={i} className="italic">
                &ldquo;{q}&rdquo;
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };



  return (
    <>
      {mounts.context &&
        createPortal(renderCard("context", "Organizational Context"), mounts.context)}
      {mounts.content &&
        createPortal(renderCard("content", "Advocacy Content"), mounts.content)}
      {mounts.communication &&
        createPortal(renderCard("communication", "Communication Tactics"), mounts.communication)}
      {mounts.synthesis &&
        createPortal(renderCard("synthesis", "Synthesis"), mounts.synthesis)}
    </>
    
  );
  
}
