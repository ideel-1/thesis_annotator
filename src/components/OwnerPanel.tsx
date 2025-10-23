"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getReviewerLabel,
  getReviewerLabels,
  listAllReviewerCodes,
  setReviewerLabel,
} from "../lib/session";

export default function OwnerPanel() {
  // show when ?owner=1
  const [enabled, setEnabled] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const u = new URL(window.location.href);
    const isOwner = u.searchParams.get("owner") === "1";
    setEnabled(isOwner);
    if (isOwner) {
      const found = listAllReviewerCodes();
      setCodes(found);
      if (found[0]) setSelected(found[0]);
    }
  }, []);

  const label = useMemo(() => (selected ? getReviewerLabel(selected) ?? "" : ""), [selected]);

  if (!enabled) return null;

  function saveLabel() {
    setReviewerLabel(selected, (document.getElementById("label-input") as HTMLInputElement)?.value || "");
    alert("Label saved");
  }

  function exportJSON() {
    if (!selected) return;
    const raw = localStorage.getItem(`thesis-comments-${selected}`) || "[]";
    download(`comments-${selected}.json`, raw);
  }

  function exportCSV() {
    if (!selected) return;
    const raw = localStorage.getItem(`thesis-comments-${selected}`) || "[]";
    try {
      const arr = JSON.parse(raw) as any[];
      const rows = [
        ["id", "code", "label", "xPct", "yPct", "text", "createdAt", "updatedAt"].join(","),
        ...arr.map((c) =>
          [
            c.id,
            selected,
            getReviewerLabel(selected) ?? "",
            c.xPct,
            c.yPct,
            JSON.stringify(c.text).replaceAll(",", ";"),
            c.createdAt,
            c.updatedAt,
          ].join(",")
        ),
      ].join("\n");
      download(`comments-${selected}.csv`, rows);
    } catch {
      alert("Nothing to export");
    }
  }

  return (
    <div className="fixed z-[70] top-3 left-1/2 -translate-x-1/2 rounded-xl border border-neutral-300 bg-white text-neutral-900 px-4 py-2 shadow flex items-center gap-3">
      <div className="text-xs font-medium">Owner</div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="text-sm bg-transparent border border-neutral-300 rounded px-2 py-1"
      >
        {codes.length === 0 && <option value="">No reviewers yet</option>}
        {codes.map((c) => (
          <option key={c} value={c}>
            {c} {getReviewerLabel(c) ? `— ${getReviewerLabel(c)}` : ""}
          </option>
        ))}
      </select>
      <input
        id="label-input"
        defaultValue={label}
        placeholder="Add label e.g., INT4"
        className="text-sm bg-transparent border border-neutral-300 rounded px-2 py-1"
      />
      <button onClick={saveLabel} className="text-sm underline">Save Label</button>
      <button onClick={exportJSON} className="text-sm underline">Export JSON</button>
      <button onClick={exportCSV} className="text-sm underline">Export CSV</button>
    </div>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
