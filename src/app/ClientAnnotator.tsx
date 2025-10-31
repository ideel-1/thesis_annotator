"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CommentOverlay from "@/components/CommentOverlay";
import OwnerPanel from "@/components/OwnerPanel";
import BoardOverlay from "@/components/BoardOverlay";
import ReviewerNotes from "@/components/ReviewerNotes";
import OnboardingModal from "@/components/OnboardingModal";
import ContextCardsClient from "@/components/ContextCardsClient";
import CommunicationCardsClient from "@/components/CommunicationCardsClient";


type ReviewerStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "valid"; label: string; canComment: boolean }
  | { state: "invalid" };

  export function ReviewerCompleteToggle({
    token,
    canEdit,
  }: {
    token: string | null;
    canEdit: boolean;
  }) {
    const [complete, setComplete] = useState<boolean | null>(null);
  
    // Fetch existing completion state on mount
    useEffect(() => {
      if (!token || !canEdit) return;
      (async () => {
        const { data, error } = await supabase.rpc("review_complete_get", { p_token: token });
        if (error) {
          console.error("review_complete_get error:", error);
          return;
        }
        setComplete(data?.[0]?.review_complete ?? false);
      })();
    }, [token, canEdit]);

  
    // Handler to toggle and save
    async function toggle() {
      if (!token || !canEdit) return;
      const newVal = !complete;
      setComplete(newVal);
      const { error } = await supabase.rpc("review_complete_toggle", {
        p_token: token,
        p_value: newVal,
      });
      if (error) {
        console.error("review_complete_toggle error:", error);
        // revert if failed
        setComplete(!newVal);
      }
    }
  
    if (!canEdit) return null;
  
    return (
      <label className="flex items-center gap-1 cursor-pointer select-none text-sm font-normal pl-20 pr-20">
        <span>Mark as done</span>
        <input
          type="checkbox"
          className="w-4 h-4 rounded cursor-pointer border border-white/60 bg-white/20 accent-white"
          checked={!!complete}
          onChange={toggle}
        />
      </label>
    );
  }

  function LegendPanel() {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white/80 backdrop-blur shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-4 text-sm text-neutral-700 leading-[1.4] flex flex-wrap gap-x-6 gap-y-3">
        {/* 3 = extensively */}
        <div className="flex items-start gap-2 min-w-[12rem]">
          <span className="mt-1 block w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <div className="text-[13px] leading-[1.4] text-neutral-800">
            talked about extensively
          </div>
        </div>
  
        {/* 2 = mentioned */}
        <div className="flex items-start gap-2 min-w-[12rem]">
          <span className="mt-1 block w-2.5 h-2.5 rounded-full bg-[#facc15]" />
          <div className="text-[13px] leading-[1.4] text-neutral-800">
            mentioned
          </div>
        </div>
  
        {/* 1 = surfaced rarely */}
        <div className="flex items-start gap-2 min-w-[12rem]">
          <span className="mt-1 block w-2.5 h-2.5 rounded-full bg-[#9ca3af]" />
          <div className="text-[13px] leading-[1.4] text-neutral-800">
            talked about sparsely or did not
          </div>
        </div>
      </div>
    );
  }

export default function ClientAnnotator() {
  const params = useSearchParams();
  const tokenRaw = params.get("token");
  const token = tokenRaw?.trim() ?? null;   // <- normalize once
  const [reviewer, setReviewer] = useState<ReviewerStatus>({ state: token ? "loading" : "idle" });
  const notesVisible = reviewer.state === "valid";
  const [showHelp, setShowHelp] = useState(false);
  const [contextMount, setContextMount] = useState<HTMLElement | null>(null);
  const [commMount, setCommMount] = useState<HTMLElement | null>(null);
  const [appearanceByTheme, setAppearanceByTheme] = useState<Record<string, number>>({});
  const [boardMount, setBoardMount] = useState<HTMLElement | null>(null);
  const [contextCardsMount, setContextCardsMount] = useState<HTMLElement | null>(null);
  const [communicationCardsMount, setCommunicationCardsMount] = useState<HTMLElement | null>(null);



  useEffect(() => {
    setBoardMount(document.getElementById("board-mount"));
  }, []);

  useEffect(() => {
    setContextMount(document.getElementById("appearance-context-mount"));
    setCommMount(document.getElementById("appearance-communication-mount"));
    setContextCardsMount(document.getElementById("context-cards-mount"));
    setCommunicationCardsMount(document.getElementById("communication-cards-mount"));
  }, []);

  useEffect(() => {
    // When the context / communication cards have been portaled into the DOM,
    // force apply `in-view` to any `.reveal` cards that are already on screen.
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );
  
    for (const el of reveals) {
      const r = el.getBoundingClientRect();
      const inViewport =
        r.top < window.innerHeight * 0.9 && // same threshold you use in observer if any
        r.bottom > 0;
  
      if (inViewport) {
        el.classList.add("in-view");
      }
    }
  }, [contextCardsMount, communicationCardsMount]);
  
  

  useEffect(() => {
    (async () => {
      if (!token) return;
  
      const { data, error } = await supabase.rpc("theme_appearance_for_reviewer", {
        p_token: token,
      });
  
      if (error) {
        console.error("theme_appearance_for_reviewer fetch error:", error);
        return;
      }
  
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.item_key) map[row.item_key] = row.appearance;
      }
      setAppearanceByTheme(map);
    })();
  }, [token]);
  
  


  // validate token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setReviewer({ state: "idle" });
        return;
      }
      setReviewer({ state: "loading" });
      const { data, error } = await supabase.rpc("validate_reviewer_token_text", {
        p_token: token!.trim(),
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
  }, [token]);

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

  // When reviewer becomes valid, open modal if not seen for this label
  useEffect(() => {
    if (reviewer.state !== "valid") return;
    const k = `annotator:onboarding:v1:${reviewer.label}`;
    const seen = typeof window !== "undefined" ? localStorage.getItem(k) : "seen";
    if (!seen) setShowHelp(true);
  }, [reviewer]);

  const markSeenAndClose = () => {
    if (reviewer.state === "valid") {
      const k = `annotator:onboarding:v1:${reviewer.label}`;
      localStorage.setItem(k, "seen");
    }
    setShowHelp(false);
  };

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

  function Banner({
    reviewer,
    token,
    onOpenHelp,
  }: {
    reviewer: ReviewerStatus;
    token: string | null;
    onOpenHelp: () => void;
  }) {
    const [complete, setComplete] = useState<boolean | null>(null);
    const canEdit = reviewer.state === "valid" && reviewer.canComment;
  
    // Fetch current completion
    useEffect(() => {
      if (!token || reviewer.state !== "valid") return;
      (async () => {
        const { data, error } = await supabase.rpc("review_complete_get", { p_token: token });
        if (error) {
          console.error("review_complete_get error:", error);
          return;
        }
        setComplete(data?.[0]?.review_complete ?? false);
      })();
    }, [token, reviewer]);
  
    // Toggle handler
    const toggle = async () => {
      if (!token || reviewer.state !== "valid") return;
      const newVal = !complete;
      setComplete(newVal);
      const { error } = await supabase.rpc("review_complete_toggle", {
        p_token: token,
        p_value: newVal,
      });
      if (error) console.error("review_complete_toggle error:", error);
    };
  
    // Loading state
    if (reviewer.state === "loading")
      return (
        <div className="fixed top-0 inset-x-0 z-40 bg-neutral-900 text-white text-center py-2 text-sm">
          Validating reviewer link…
        </div>
      );
  
    // Invalid or public view
    if (reviewer.state === "invalid")
      return (
        <div className="fixed top-0 inset-x-0 z-40 bg-red-600 text-white text-center py-2 text-sm">
          Invalid or expired link — view-only
        </div>
      );
    if (reviewer.state === "idle")
      return (
        <div className="fixed top-0 inset-x-0 z-40 bg-neutral-100 text-neutral-700 text-center py-2 text-sm">
          Public view — comments disabled
        </div>
      );
  
    // Reviewer valid
    return (
      <div
        className={`fixed top-0 inset-x-0 z-100 flex items-center justify-center gap-4 py-3 text-sm ${
          canEdit ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
        }`}
      >
        <span>
          Reviewer <strong>{reviewer.label}</strong> - {" "}
          {canEdit ? "commenting enabled" : "view-only (commenting disabled)"}
        </span>

        <ReviewerCompleteToggle token={token} canEdit={canEdit} />

        {canEdit && (
          <button
            onClick={onOpenHelp}
            className="flex items-center cursor-pointer gap-1 text-sm font-normal rounded-md border border-white/40 bg-white/20 px-2 py-0.5 hover:bg-white/30"
            title="How to work with this page:"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9.09 9a3 3 0 115.82 1c0 2-3 2-3 4" />
              <path d="M12 17h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Help :D
          </button>
        )}
      </div>
    );
  }
  

  const commentingEnabled = reviewer.state === "valid" && reviewer.canComment;

  return (
    <>
      <Banner reviewer={reviewer} token={token} onOpenHelp={() => setShowHelp(true)} />


      {contextCardsMount &&
        createPortal(
          <ContextCardsClient appearanceByTheme={appearanceByTheme} />, 
          contextCardsMount
        )}

      {communicationCardsMount &&
        createPortal(
          <CommunicationCardsClient appearanceByTheme={appearanceByTheme} />,
          communicationCardsMount
      )}


      {/* New: Board (edit if token & canComment; otherwise read-only) */}
        {boardMount
      ? createPortal(
          <BoardOverlay token={token} canEdit={reviewer.state === "valid" && reviewer.canComment} appearanceByTheme={appearanceByTheme} />,
          boardMount
      ) : null}

      {/* NEW: per-reviewer interview notes */}
      <ReviewerNotes token={token} visible={notesVisible} />

      {commentingEnabled ? 
        <CommentOverlay reviewerLabel={reviewer.label} token={token!}/> : null}
      <OwnerPanel />

      {/* Onboarding modal with embedded video + quick tips */}
      <OnboardingModal open={showHelp} onClose={markSeenAndClose} title="Welcome!">
        <div>
          {/* Video 
          <div className="w-full col-span-2">
            <video
              className="w-full rounded-xl border border-neutral-200 shadow"
              controls
              playsInline
              poster="/videos/annotator-intro-poster.jpg"
            >
              <source src="/videos/annotator-intro.webm" type="video/webm" />
              <source src="/videos/annotator-intro.mp4" type="video/mp4" />
              <track
                kind="captions"
                srcLang="en"
                src="/videos/annotator-intro.vtt"
                label="English"
                default
              />
              Your browser does not support the video tag.
            </video>
          </div>
           Key steps */} 
          <div className="space-y-3 text-[16px] leading-7 text-neutral-800">
          <p>Thank you for taking the time to review this work.</p>
          <p>This page is interactive. You can leave comments directly on the content.</p>
          <p>I’d love you to weave in comments as you move through the text: note what you align with, what you disagree with, and what you feel might be missing. Your feedback will help me refine and strengthen the argument further.</p>
          <br></br>
          <p><strong>Right-click</strong> anywhere to create a comment.</p>
          <p><strong>Drag</strong> the comment to reposition, and use the minus icon to <strong>collapse</strong>.</p>
          <p>Edits auto-save. Use the top-left toggle to switch between <strong>Edit</strong> and <strong>View</strong> mode.</p>
          <p>When you have gone through the entire page and feel you are finished, please press the <strong>Mark as done</strong> button in the top menu to let me know you're done.</p>
          <p>Your notes are linked to your reviewer token and are visible only to you and the author.</p>
          </div>
        </div>
      </OnboardingModal>
    </>
  );
  
}
