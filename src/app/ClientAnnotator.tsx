"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import ContextSection from "@/components/ContextSection";
import ContentSection from "@/components/ContentSection";
import CommunicationSection from "@/components/CommunicationSection";
import SynthesisBox from "@/components/SynthesisBox";

/* ----------------------------- types & helpers ---------------------------- */

type ReviewerStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "valid"; label: string; canComment: boolean }
  | { state: "invalid" };

type SliderKey = string; // "section::item"
type SliderState = { value: number; saving: boolean; updatedAt: number };

const STEPS = ["intro", "context", "content", "communication", "synthesis"] as const;
type StepId = typeof STEPS[number];

/* --------------------------------- banner --------------------------------- */

function Banner({
  reviewer,
  done,
  savingDone,
  onToggleDone,
}: {
  reviewer: ReviewerStatus;
  done: boolean;
  savingDone: boolean;
  onToggleDone: (next: boolean) => void;
}) {
  if (reviewer.state === "loading") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-neutral-900 text-white text-center py-2 text-sm">
        Validating reviewer link…
      </div>
    );
  }
  if (reviewer.state === "invalid") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-red-600 text-white text-center py-2 text-sm">
        Invalid or expired link — view only
      </div>
    );
  }
  if (reviewer.state === "idle") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-neutral-100 text-neutral-700 text-center py-2 text-sm">
        Public view — comments disabled
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 inset-x-0 z-40 py-3 px-4 flex items-center justify-center gap-6 text-sm ${
        reviewer.canComment ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
      }`}
    >
      <span>
        Reviewer <strong>{reviewer.label}</strong> -{" "}
        {reviewer.canComment ? "commenting enabled" : "view-only"}
      </span>
      {/*
      {reviewer.canComment && (
        <button
          onClick={() => onToggleDone(!done)}
          className={`rounded-md border px-2 py-0.5 text-xs ${
            done
              ? "border-white bg-white/10 text-white"
              : "border-white/50 bg-transparent text-white/90"
          }`}
        >
          {savingDone ? "Saving…" : done ? "✓ Marked done" : "Mark as done"}
        </button>
      )}
      */}
    </div>
  );
}


/* ------------------------------- page logic ------------------------------- */

export default function ClientAnnotator() {
  const params = useSearchParams();
  const tokenRaw = params.get("token");
  const token = tokenRaw?.trim() ?? null;

  // reviewer status
  const [reviewer, setReviewer] = useState<ReviewerStatus>({
    state: token ? "loading" : "idle",
  });
    // review completion state
    const [done, setDone] = useState<boolean>(false);
    const [savingDone, setSavingDone] = useState<boolean>(false);
  
    // load once
    useEffect(() => {
      if (!token) return;
      (async () => {
        const { data, error } = await supabase.rpc("review_complete_get", { p_token: token });
        if (error) {
          console.error("review_complete_get", error);
          return;
        }
        if (Array.isArray(data) && data.length) setDone(!!data[0].is_done);
      })();
    }, [token]);

    // toggle
    async function toggleDone(next: boolean) {
      if (!token) return;
      setSavingDone(true);
      const { error } = await supabase.rpc("review_complete_toggle", {
        p_token: token,
        p_value: next,
      });
      if (error) console.error("review_complete_toggle", error);
      else setDone(next);
      setSavingDone(false);
    }
  

  // step routing
  const [activeStep, setActiveStep] = useState<StepId>("intro");
  useEffect(() => {
    const s = (new URLSearchParams(window.location.search).get("step") ??
      "intro") as StepId;
    if (STEPS.includes(s)) setActiveStep(s);
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("step", activeStep);
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);
  const idx = STEPS.indexOf(activeStep);
  const goPrev = () => idx > 0 && setActiveStep(STEPS[idx - 1]);
  const goNext = () => idx < STEPS.length - 1 && setActiveStep(STEPS[idx + 1]);

  // validate reviewer token
  useEffect(() => {
    if (!token) {
      setReviewer({ state: "idle" });
      return;
    }
    let cancelled = false;
    (async () => {
      setReviewer({ state: "loading" });
      const { data, error } = await supabase.rpc("validate_reviewer_token_text", {
        p_token: token,
      });
      if (cancelled) return;
      if (error || !data?.length) {
        setReviewer({ state: "invalid" });
        return;
      }
      const row = data[0];
      setReviewer({
        state: "valid",
        label: row.label,
        canComment: !!row.can_comment,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // global slider state (debounced saves)
  const [sliders, setSliders] = useState<Record<SliderKey, SliderState>>({});
  const saveTimersRef = useRef<Record<SliderKey, number | NodeJS.Timeout>>({});

  // initial load of slider values
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("sliders_list", { p_token: token });
      if (error) {
        console.error("sliders_list error", error);
        return;
      }
      const initial: Record<SliderKey, SliderState> = {};
      for (const r of data ?? []) {
        const k = `${r.section_key}::${r.item_key}`;
        initial[k] = {
          value: Number(r.value),
          saving: false,
          updatedAt: new Date(r.updated_at).getTime(),
        };
      }
      setSliders(initial);
    })();
  }, [token]);

  function handleSliderChange(sectionKey: string, itemKey: string, nextVal: number) {
    const id: SliderKey = `${sectionKey}::${itemKey}`;
    setSliders((prev) => ({
      ...prev,
      [id]: { value: nextVal, saving: true, updatedAt: Date.now() },
    }));

    const existing = saveTimersRef.current[id];
    if (existing) clearTimeout(existing as number);

    saveTimersRef.current[id] = setTimeout(async () => {
      if (!token) return;
      try {
        const { error } = await supabase.rpc("slider_upsert", {
          p_token: token,
          p_section_key: sectionKey,
          p_item_key: itemKey,
          p_value: nextVal,
        });
        if (error) throw error;
        setSliders((prev) => ({
          ...prev,
          [id]: {
            ...(prev[id] ?? { value: nextVal, updatedAt: Date.now() }),
            saving: false,
            updatedAt: Date.now(),
          },
        }));
      } catch (e) {
        console.error("slider_upsert", e);
        setSliders((prev) => ({
          ...prev,
          [id]: { ...(prev[id] ?? { value: nextVal, updatedAt: Date.now() }), saving: false },
        }));
      } finally {
        delete saveTimersRef.current[id];
      }
    }, 300);
  }

  const commentingEnabled = reviewer.state === "valid" && reviewer.canComment;

  const contextContainerRef = useRef<HTMLDivElement | null>(null);
  const contextColumnRef = useRef<HTMLDivElement | null>(null);

  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const contentColumnRef = useRef<HTMLDivElement | null>(null);

  const commContainerRef = useRef<HTMLDivElement | null>(null);
  const commColumnRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Banner
        reviewer={reviewer}
        done={done}
        savingDone={savingDone}
        onToggleDone={toggleDone}
      />

      <main className="relative mx-auto w-full px-6 pt-24 pb-24 text-neutral-900">
        {/* INTRO */}
        {activeStep === "intro" && (
          
          <section id="intro" className="mx-auto max-w-2xl w-full">
            <h1 className="text-4xl font-bold mb-16 text-center text-neutral-900">
              Master Thesis: arguing for design in larger organizations
            </h1>

            <div className="mx-auto max-w-2xl w-full">
              <h2 className=" text-4xl font-semibold italic text-neutral-300 mb-4">
                Introduction
              </h2>
              <p className="text-neutral-800 text-base leading-relaxed mt-4">
                The purpose of this page is to understand whether the findings
                I have drawn from data are aligned with the way you see design advocacy, or if there are significant differences.
              </p>
              <p className="text-neutral-800 text-base leading-relaxed mt-4">
              This page presents three interconnected aspects of design advocacy
               drawn from interviews with design leaders:
              </p>

              <ul className="pl-5 space-y-2 text-neutral-800 text-base leading-relaxed mt-4">
                <li className="mb-4 mt-4">
                1. <strong>Organizational context</strong> (where design sits and how it accesses strategy)
                </li>
                <li className="mb-4 mt-4">
                2. <strong>Advocacy content</strong> (the value arguments used to justify design’s role)
                </li>
                <li className="mb-4 mt-4">
                3. <strong>Communication tactics</strong> (how those arguments gain credibility internally)
                </li>
              </ul>
              <p className="text-neutral-800 text-base leading-relaxed mt-4">
              Each theme reflects patterns observed in practice - please rate their relevance
               to your organization, leave comments, and reorder the lenses on the board as you see fit.
              </p>

              <p className="italic text-neutral-800 text-base leading-relaxed mt-4">
              Your feedback will help refine how design’s value is framed. 
              To comment, please right-click on any "<span className="font-medium">+ Comment</span>" button on a theme, then edit, 
              and collapse notes using the minus icon. Comments are saved under your
               reviewer token and private between you and the author.
              </p>

            </div>
            <div className="mx-auto max-w-2xl w-full">
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={goNext}
                  className="rounded-lg cursor-pointer border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white shadow-sm hover:bg-neutral-600"
                >
                  Continue
                </button>
              </div>
            </div>
          </section>
        )}

        {/* CONTEXT */}
        {activeStep === "context" && (
          <section id="context">
            <div
              ref={contextContainerRef}
              className="relative mx-auto w-full max-w-[1200px] px-0 overflow-visible"
            >
              <div ref={contextColumnRef} className="mx-auto max-w-2xl w-full">
                <div>
                  <h2 className="text-4xl font-semibold mb-8 text-center text-neutral-900">1. Organizational context</h2>
                  <p className="text-neutral-700 text-base leading-relaxed mb-4">
                    Advocacy for design is shaped by organizational reality: where design sits,
                    who controls budget, and which forums you can access. These structural 
                    conditions determine whether design shows up in upstream problem framing
                      or remains downstream delivery.
                  </p>
                  <p className="text-neutral-700 text-base leading-relaxed mb-4">
                    Resource levels, leadership turnover, and design literacy affect credibility
                    and timing. Effective leaders learn the decision architecture 
                    (who decides, on what cadence, using what evidence), map allies, 
                    and pick the right battles for the current season.
                  </p>
                  <p className="text-neutral-700 text-base leading-relaxed mb-12">
                    For each theme below, rate how important it is to understand this aspect
                    in your organization before advocating for design. Use the “+ Comment”
                      button to capture specific notes tied to a theme.
                  </p>
                </div>
                <ContextSection
                  sliders={sliders}
                  onChange={handleSliderChange}
                  token={token}
                  canComment={commentingEnabled}
                  containerRef={contextContainerRef}
                  columnRef={contextColumnRef}
                />
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button onClick={goPrev} className="rounded-lg cursor-pointer border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">
                    Back
                  </button>
                  <button onClick={goNext} className="rounded-lg cursor-pointer border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-600">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTENT */}
        {activeStep === "content" && (
          <section id="content">
            <div
              ref={contentContainerRef}
              className="relative mx-auto w-full max-w-[1200px] px-0 overflow-visible"
            >
              <div ref={contentColumnRef} className="mx-auto max-w-2xl w-full">
                <div>
                  <h2 className="text-4xl font-semibold mb-8 text-center text-neutral-900">2. Advocacy content</h2>
                  <p className="text-neutral-700 text-base leading-relaxed mb-4">
                    These themes summarize how design leaders frame the
                     value of design to make it relevant, fundable, and 
                     legitimate. In practice, leaders might mix several narrative lenses
                      at once - design as a way to understand the customer, design for integration and efficiency,
                      differentiation and quality, strategic foresight, and
                       more - depending on audience and timing.
                  </p>
                  <p className="text-neutral-700 text-base leading-relaxed mb-12">
                    Please indicate how central each theme is to how you
                     currently “sell” design internally. Add a comment
                      where a theme feels off, something is missing for your context, or you have some additional thoughts.
                  </p>
                </div>
                <ContentSection
                  sliders={sliders}
                  onChange={handleSliderChange}
                  token={token}
                  canComment={commentingEnabled}
                  containerRef={contentContainerRef}
                  columnRef={contentColumnRef}
                />
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button onClick={goPrev} className="rounded-lg cursor-pointer border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">
                    Back
                  </button>
                  <button onClick={goNext} className="rounded-lg cursor-pointer border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-600">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* COMMUNICATION */}
        {activeStep === "communication" && (
          <section id="communication">
             <div
                ref={commContainerRef}
                className="relative mx-auto w-full max-w-[1200px] px-0 overflow-visible"
              >
              <div ref={commColumnRef} className="mx-auto max-w-2xl w-full">
                <div>
                  <h2 className="text-4xl font-semibold mb-8 text-center text-neutral-900">3. Communication tactics</h2>
                  <p className="text-neutral-700 text-base leading-relaxed mb-4">
                    Credibility comes from how arguments are delivered:
                     concrete demonstrations, shared artifacts, and translation
                      into business terms. Executives tend to respond to visible
                       evidence, clear trade-offs, and alignment with existing
                        metrics, not abstract appeals.
                  </p>
                  <p className="text-neutral-700 text-base leading-relaxed mb-12">
                    Rate how effective using each communication tactic is in your
                     organization, and use comments to note where and why a 
                     tactic does or does not work with your audiences.
                  </p>
                </div>
                <CommunicationSection
                  sliders={sliders}
                  onChange={handleSliderChange}
                  token={token}
                  canComment={commentingEnabled}
                  containerRef={commContainerRef}
                  columnRef={commColumnRef}
                />
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button onClick={goPrev} className="rounded-lg cursor-pointer border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">
                    Back
                  </button>
                  <button onClick={goNext} className="rounded-lg cursor-pointer border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-600">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SYNTHESIS */}
        {activeStep === "synthesis" && (
          <section id="synthesis" className="mx-auto max-w-2xl w-full">
            {/* Header and intro text */}
            <div>
              <h2 className="text-4xl font-semibold mb-8 text-center text-neutral-900">4. Synthesis</h2>
              <p className="text-neutral-800 leading-relaxed mb-4">
                Summarize your overall view. What resonates, what feels off, and what would you
                change in the framing?
              </p>
              <p className="text-neutral-700 text-base leading-relaxed mb-4">
                For example, you could reflect on how persuasive each communication tactic feels in your organization,
                what the most common value arguments for design are, or which parts of the organizational context
                you usually emphasize most. Feel free to use bullet points.
              </p>
              <p className="text-neutral-700 text-base leading-relaxed mb-8">
                Once finished with everything, click the mark as done button to notify me you've finished the review.
              </p>
            </div>


            {/* Synthesis input */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
              <SynthesisBox
                token={token}
                canEdit={commentingEnabled}
              />
            </div>

            {/* Mark as done toggle */}
            {reviewer.state === "valid" && reviewer.canComment && (
              <div className="flex items-center justify-center mt-8">
                <button
                  type="button"
                  onClick={() => !savingDone && toggleDone(!done)}
                  disabled={savingDone}
                  aria-pressed={done}
                  aria-busy={savingDone || undefined}
                  className={[
                    "relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                    "transition-all duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    savingDone
                      ? "cursor-wait opacity-90 ring-offset-white ring-neutral-300"
                      : "cursor-pointer ring-offset-white border border-neutral-white",
                    done
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400 shadow-sm"
                      : "cursor-pointer bg-neutral-100 text-neutral-900 border border-neutral-300 hover:bg-neutral-200 focus-visible:ring-neutral-400 shadow-sm",
                  ].join(" ")}
                >

                  {/* Label */}
                  <span className={savingDone ? "select-none" : ""}>
                    {savingDone ? "Saving…" : done ? "✓ Marked done" : "Mark as done"}
                  </span>

                  {/* Success pulse halo (subtle) */}
                  {done && !savingDone && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/40 animate-[ping_0.9s_ease-out_1]"
                    />
                  )}
                </button>
              </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-4"> 
                <button onClick={goPrev} className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100" >
                   ← Back 
                </button> 
              </div>
          </section>
        )}
      </main>
    </>
  );
}
