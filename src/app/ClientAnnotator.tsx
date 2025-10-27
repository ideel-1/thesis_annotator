"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CommentOverlay from "@/components/CommentOverlay";
import OwnerPanel from "@/components/OwnerPanel";
import BoardOverlay from "@/components/BoardOverlay";
import ReviewerNotes from "@/components/ReviewerNotes";



type ReviewerStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "valid"; label: string; canComment: boolean }
  | { state: "invalid" };

function InstructionCard() {
  return (
    <div className="max-w-3xl mx-auto mb-10">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_60px_-20px_rgba(16,185,129,0.45),0_10px_30px_-10px_rgba(0,0,0,0.08)]">
        <span className="absolute left-0 top-0 h-full w-1.5 bg-emerald-400/80" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <img src="/icons/info-icon.svg" alt="How to review" className="w-4 h-4 opacity-90" />
            <h2 className="text-lg font-medium text-neutral-900">How to add to this page</h2>
          </div>
          <div className="space-y-3 text-[16px] leading-7 font-normal text-neutral-800">
            <p>
              This page is interactive. Leave comments directly on the content:
              <strong> right-click anywhere</strong> to create a comment box. Drag to reposition, collapse to minimize,
              or delete from the box controls.
            </p>
            <p>
              Your notes are <strong>linked to your reviewer token</strong> and are visible only to you and the author.
              Use the toggle in the top-left to switch between editing and reading modes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientAnnotator() {
  const params = useSearchParams();
  const tokenRaw = params.get("token");
  const [reviewer, setReviewer] = useState<ReviewerStatus>({ state: tokenRaw ? "loading" : "idle" });
  const [mountEl, setMountEl] = useState<HTMLElement | null>(null);
  const notesVisible = reviewer.state === "valid";
  
  const [boardMount, setBoardMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setBoardMount(document.getElementById("board-mount"));
  }, []);

  // mount point for instructions card
  useEffect(() => {
    setMountEl(document.getElementById("reviewer-instructions-mount"));
  }, []);

  // validate token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenRaw) {
        setReviewer({ state: "idle" });
        return;
      }
      setReviewer({ state: "loading" });
      const { data, error } = await supabase.rpc("validate_reviewer_token_text", {
        p_token: tokenRaw!.trim(),
      });
      if (cancelled) return;
      
      if (error) {
        console.error("validate_reviewer_token_text error:", error);
        setReviewer({ state: "invalid" });
        return;
      }
      if (!data?.length) {
        setReviewer({ state: "invalid" });
        return;
      }
      const row = data[0];
      setReviewer({ state: "valid", label: row.label, canComment: !!row.can_comment });
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenRaw]);

  // scroll reveal (move here so it's client-only)
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function useFlowOffset({
    sectionId,
    mountId,
    cssVar,
    deps = [],
  }: {
    sectionId: string;
    mountId: string;
    cssVar: string;
    deps?: React.DependencyList;
  }) {
    useEffect(() => {
      if (typeof window === "undefined" || typeof document === "undefined") return;
  
      const section = document.getElementById(sectionId);
      const mount = document.getElementById(mountId);
      if (!section || !mount) {
        // Uncomment for debugging:
        // console.warn(`useFlowOffset: missing element(s)`, { sectionId, mountId, section, mount });
        return;
      }
  
      const apply = () => {
        // Use offsetHeight for layout height (includes padding)
        const h = mount.offsetHeight || 0;
        section.style.setProperty(cssVar, `${h}px`);
        // Uncomment for debugging:
        // console.log(`[flow-offset] ${cssVar} = ${h}px on #${sectionId}`);
      };
  
      // Initial measure (next frame helps after layout/paint)
      const raf = requestAnimationFrame(apply);
  
      // Observe the mount’s size changes (content/quotes arriving later)
      let ro: ResizeObserver | null = null;
      if ("ResizeObserver" in window) {
        ro = new ResizeObserver(apply);
        ro.observe(mount);
      }
  
      // Fallback: also recalc on window resize
      window.addEventListener("resize", apply);
  
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", apply);
        if (ro) ro.disconnect();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
  }
  
  
  // Offset the CONTEXT flow by the height of the context notes card
  useFlowOffset({
    sectionId: "context",
    mountId: "notes-context-mount",
    cssVar: "--context-notes-offset",
    deps: [notesVisible],
  });
  
  // Offset the COMMUNICATION flow similarly
  useFlowOffset({
    sectionId: "how", // your section id for Communication (in your code it's "how")
    mountId: "notes-communication-mount",
    cssVar: "--communication-notes-offset",
    deps: [notesVisible],
  });

  const Banner = () => {
    if (reviewer.state === "loading")
      return <div className="fixed top-0 inset-x-0 z-40 bg-neutral-900 text-white text-center py-2 text-sm">Validating reviewer link…</div>;
    if (reviewer.state === "valid")
      return reviewer.canComment ? (
        <div className="fixed top-0 inset-x-0 z-40 bg-emerald-600 text-white text-center py-2 text-sm">
          Reviewer {reviewer.label} — commenting enabled
        </div>
      ) : (
        <div className="fixed top-0 inset-x-0 z-40 bg-amber-500 text-black text-center py-2 text-sm">
          Reviewer {reviewer.label} — view-only (commenting disabled)
        </div>
      );
    if (reviewer.state === "invalid")
      return <div className="fixed top-0 inset-x-0 z-40 bg-red-600 text-white text-center py-2 text-sm">Invalid or expired link — view-only</div>;
    return <div className="fixed top-0 inset-x-0 z-40 bg-neutral-100 text-neutral-700 text-center py-2 text-sm">Public view — comments disabled</div>;
  };

  const commentingEnabled = reviewer.state === "valid" && reviewer.canComment;

  return (
    <>
      <Banner />
      {commentingEnabled && mountEl ? createPortal(<InstructionCard />, mountEl) : null}

      {/* New: Board (edit if token & canComment; otherwise read-only) */}
        {boardMount
      ? createPortal(
          <BoardOverlay token={tokenRaw} canEdit={reviewer.state === "valid" && reviewer.canComment} />,
          boardMount
      ) : null}

      {/* NEW: per-reviewer interview notes */}
      <ReviewerNotes token={tokenRaw} visible={notesVisible} />

      {commentingEnabled ? 
        <CommentOverlay reviewerLabel={reviewer.label} token={tokenRaw!}/> : null}
      <OwnerPanel />
    </>
  );
  
}
