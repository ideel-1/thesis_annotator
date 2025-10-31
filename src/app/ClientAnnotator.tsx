"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import CommentOverlay from "@/components/CommentOverlay";
import BoardOverlay from "@/components/BoardOverlay";
import ReviewerNotes from "@/components/ReviewerNotes";

import ContextSection from "@/components/ContextSection";
import ContentSection from "@/components/ContentSection";
import CommunicationSection from "@/components/CommunicationSection";
import SynthesisBox from "@/components/SynthesisBox";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ReviewerStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "valid"; label: string; canComment: boolean }
  | { state: "invalid" };

type SliderKey = string; // e.g. "context::org_position"

type SliderState = {
  value: number;
  saving: boolean;
  updatedAt: number;
};

/* -------------------------------------------------------------------------- */
/*                         Mark-as-done checkbox widget                        */
/* -------------------------------------------------------------------------- */

function ReviewerCompleteToggle({
  token,
  canEdit,
}: {
  token: string | null;
  canEdit: boolean;
}) {
  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token || !canEdit) return;
    (async () => {
      const { data, error } = await supabase.rpc("review_complete_get", {
        p_token: token,
      });
      if (error) {
        console.error("review_complete_get error:", error);
        return;
      }
      setComplete(data?.[0]?.review_complete ?? false);
    })();
  }, [token, canEdit]);

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
      setComplete(!newVal);
    }
  }

  if (!canEdit) return null;

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-normal">
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

/* -------------------------------------------------------------------------- */
/*                                   Banner                                   */
/* -------------------------------------------------------------------------- */

function Banner({
  reviewer,
  token,
}: {
  reviewer: ReviewerStatus;
  token: string | null;
}) {
  const [complete, setComplete] = useState<boolean | null>(null);
  const canEdit = reviewer.state === "valid" && reviewer.canComment;

  // Fetch completion state on mount if valid
  useEffect(() => {
    if (!token || reviewer.state !== "valid") return;
    (async () => {
      const { data, error } = await supabase.rpc("review_complete_get", {
        p_token: token,
      });
      if (error) {
        console.error("review_complete_get error:", error);
        return;
      }
      setComplete(data?.[0]?.review_complete ?? false);
    })();
  }, [token, reviewer]);

  // Loading banner
  if (reviewer.state === "loading") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-neutral-900 text-white text-center py-2 text-sm">
        Validating reviewer link…
      </div>
    );
  }

  // Invalid token banner
  if (reviewer.state === "invalid") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-red-600 text-white text-center py-2 text-sm">
        Invalid or expired link - view only
      </div>
    );
  }

  // Public / idle banner
  if (reviewer.state === "idle") {
    return (
      <div className="fixed top-0 inset-x-0 z-40 bg-neutral-100 text-neutral-700 text-center py-2 text-sm">
        Public view — comments disabled
      </div>
    );
  }

  // Valid reviewer banner
  return (
    <div
      className={`fixed top-0 inset-x-0 z-61 flex flex-wrap items-center justify-center gap-20 py-3 text-sm ${
        canEdit ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
      }`}
    >
      <span>
        Reviewer <strong>{reviewer.label}</strong> –{" "}
        {canEdit ? "commenting enabled" : "view-only"}
      </span>

      <ReviewerCompleteToggle token={token} canEdit={canEdit} />

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              ClientAnnotator                                */
/* -------------------------------------------------------------------------- */

export default function ClientAnnotator() {
  /* -------------------------------- routing -------------------------------- */
  const params = useSearchParams();
  const tokenRaw = params.get("token");
  const token = tokenRaw?.trim() ?? null;

  /* ---------------------------- reviewer status ---------------------------- */
  const [reviewer, setReviewer] = useState<ReviewerStatus>({
    state: token ? "loading" : "idle",
  });

  // this portal target is for the draggable board
  const [boardMount, setBoardMount] = useState<HTMLElement | null>(null);

  // contextual reviewer notes are only visible if reviewer is valid
  const notesVisible = reviewer.state === "valid";



  /* --------------------------- slider state (global) --------------------------- */

  // sliders is a map:
  //   key:  "sectionKey::itemKey"  e.g. "context::org_position"
  //   value: { value, saving, updatedAt }
  const [sliders, setSliders] = useState<Record<SliderKey, SliderState>>({});

  // debounce timers per slider
  const saveTimersRef = useRef<Record<SliderKey, number | NodeJS.Timeout>>({});

  /* ------------------------ validate reviewer token ------------------------ */
  useEffect(() => {
    if (!token) {
      setReviewer({ state: "idle" });
      return;
    }

    let cancelled = false;

    (async () => {
      setReviewer({ state: "loading" });

      // NOTE: your DB function is validate_reviewer_token_text(p_token uuid)
      // If it's named differently in DB, align here.
      const { data, error } = await supabase.rpc(
        "validate_reviewer_token_text",
        {
          p_token: token,
        }
      );

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

  /* ----------------------------- mount board div ---------------------------- */
  useEffect(() => {
    setBoardMount(document.getElementById("board-mount"));
  }, []);


  /* ---------------------- initial slider load from DB ---------------------- */
  useEffect(() => {
    if (!token) return;

    (async () => {
      const { data, error } = await supabase.rpc("sliders_list", {
        p_token: token,
      });

      if (error) {
        console.error("sliders_list error", error);
        return;
      }

      const initial: Record<SliderKey, SliderState> = {};
      if (data) {
        for (const row of data) {
          // row.section_key, row.item_key, row.value, row.updated_at
          const k = `${row.section_key}::${row.item_key}`;
          initial[k] = {
            value: Number(row.value),
            saving: false,
            updatedAt: new Date(row.updated_at).getTime(),
          };
        }
      }
      setSliders(initial);
    })();
  }, [token]);

  /* --------------------------- slider change handler --------------------------- */
  function handleSliderChange(
    sectionKey: string,
    itemKey: string,
    nextVal: number
  ) {
    const sliderId: SliderKey = `${sectionKey}::${itemKey}`;

    // optimistic local update
    setSliders((prev) => ({
      ...prev,
      [sliderId]: {
        value: nextVal,
        saving: true,
        updatedAt: Date.now(),
      },
    }));

    // debounce save so we don't spam supabase on every pixel of drag
    const existingTimer = saveTimersRef.current[sliderId];
    if (existingTimer) {
      clearTimeout(existingTimer as number);
    }

    saveTimersRef.current[sliderId] = setTimeout(async () => {
      try {
        const { error } = await supabase.rpc("slider_upsert", {
          p_token: token,
          p_section_key: sectionKey,
          p_item_key: itemKey,
          p_value: nextVal,
        });

        if (error) {
          console.error("slider_upsert error", error);

          // stop the spinner but keep the optimistic value
          setSliders((prev) => ({
            ...prev,
            [sliderId]: {
              ...(prev[sliderId] ?? {
                value: nextVal,
                updatedAt: Date.now(),
              }),
              saving: false,
            },
          }));

          return;
        }

        // success: mark saved
        setSliders((prev) => ({
          ...prev,
          [sliderId]: {
            ...(prev[sliderId] ?? {
              value: nextVal,
              updatedAt: Date.now(),
            }),
            saving: false,
            updatedAt: Date.now(),
          },
        }));
      } finally {
        delete saveTimersRef.current[sliderId];
      }
    }, 300);
  }

  /* ------------------------------ commenting ------------------------------ */

  const commentingEnabled =
    reviewer.state === "valid" && reviewer.canComment;

  /* --------------------------------- render -------------------------------- */

  return (
    <>
      {/* fixed banner at top */}
      <Banner
        reviewer={reviewer}
        token={token}
      />
  
      {/* reviewer contextual notes card (anchors itself in-page) */}
      <ReviewerNotes token={token} visible={notesVisible} />
      {/* main single-column content */}
      <main className="relative mx-auto w-full px-6 pt-24 pb-32 text-neutral-900">
        {/* ------------------------ OVERVIEW ------------------------ */}
        <h1 className="text-4xl font-semibold tracking-tight mb-16 text-center text-neutral-900">
            Master Thesis: arguing for design in larger organizations
          </h1>
        <section
          id="overview"
          className="mx-auto max-w-2xl w-full pb-16"
        >
  
          <div className="relative italic rounded-2xl border border-neutral-200 bg-emerald shadow-sm p-6 mb-12">
            {/* arrow */}
          
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            <span className="not-italic">⌘</span> Welcome & How to Comment
            </h2>

            <p className="text-neutral-800 text-base leading-relaxed mb-4">
              Thank you for taking the time to review this page. Your feedback will help
              refine how the argument for design’s value is framed and communicated.
            </p>

            <p className="text-neutral-800 text-base leading-relaxed mb-4">
              Please use the comment tool to share your thoughts as you
              read. I’m equally interested in points you agree with,
              those you disagree with, and anything that feels
              unclear, missing, or overstated.
            </p>

            <ul className="list-disc pl-5 space-y-2 text-neutral-800 text-base leading-relaxed mb-4">
              <li>
                <strong>Right-click</strong> anywhere on this page to create a comment. Press the checkmark button to confirm them.
              </li>
              <li>
                <strong>Drag</strong> comments to reposition them.
              </li>
              <li>
                Use the <strong>minus icon</strong> to collapse or hide a note once
                reviewed.
              </li>
            </ul>

            <p className="text-neutral-700 text-base leading-relaxed">
              All comments are linked to your reviewer token and are visible only to you
              and the author.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="relative max-w-6xl mx-auto mt-24 mb-20">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>

        <div className="mx-auto max-w-2xl w-full">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              Introduction
            </h2>
            <p className="text-neutral-800 text-base leading-relaxed">
              Based on interviews with design leaders, design advocacy appears to
              operate across three interdependent aspects:
            </p>
  
            <ul className="list-disc pl-5 space-y-2 text-neutral-800 text-base leading-relaxed mt-4">
              <li>
                Organizational context - where design sits structurally, who it
                reports to, and how that shapes access to strategy.
              </li>
              <li>
                Advocacy content - which value claims designers lean on to frame
                design as relevant, fundable, and legitimate.
              </li>
              <li>
                Communication tactics - how those claims are made credible and
                persuasive in the organization.
              </li>
            </ul>
              
            <p className="text-neutral-800 text-base leading-relaxed mt-4">
              In each section, you will see themes that commonly appear in actual
              practice. For each theme, please indicate how important it is in
              your current reality, leave comments where needed, and then reorder
              the lenses on the board.
            </p>
            <p className=" italic font-semibold text-neutral-800 text-base leading-relaxed mt-4">
              Of course, this page is not definitive. The above aspects are ones that 
              I have identified through going through the text, and, given your company,
               you might have a slightly or completely different approach. I'd love to hear if that is the case!
            </p>
          </div>
        {/* Divider */}
        <div className="relative max-w-6xl mx-auto mt-24 mb-20">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>
  
        {/* ------------------------ CONTEXT ------------------------ */}
        <section
          id="context"
          className="mx-auto max-w-2xl w-full"
        >       

          <header className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              1. Organizational context
            </h2>
            <p className="text-neutral-700 text-base leading-relaxed">
              Advocacy depends on where design lives in the organization, who
              controls budget, and whose problems you are allowed to shape.
              Resource levels, leadership turnover, and literacy all affect how
              credible you sound. Please review the following aspects and score
              their relevance to you. You can click anywhere on the page to leave
              a comment and drag that comment bubble if you want to attach context
              to a specific paragraph.
            </p>
            <p className="text-neutral-700 text-base leading-relaxed mt-4">
              Use the sliders to explain how much you need to look at this aspect before engaging in design advocacy.
            </p>
          </header>
  
          <ContextSection
            sliders={Object.fromEntries(
              Object.entries(sliders).map(([k, s]) => [
                k,
                { value: s.value, saving: s.saving },
              ])
            )}
            onChange={handleSliderChange}
          />
        </section>

        {/* Divider */}
        <div className="relative max-w-6xl mx-auto mt-30 mb-20">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>
  
        {/* ------------------------ CONTENT ------------------------ */}
        <section
          id="content"
          className="mx-auto max-w-2xl w-full"
        >
          <header className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              2. Advocacy content
            </h2>
  
            <p className="text-neutral-700 text-base leading-relaxed">
              These are typical value narratives design leaders use to justify why
              design matters: customer closeness, integration and efficiency,
              differentiation and quality, strategic foresight, system consistency,
              culture shift, and creativity as a resource. Please indicate how
              central each is to how you currently “sell” design internally, and
              feel free to comment where you disagree or where something is
              missing.
            </p>
  
            <p className="text-neutral-700 text-base leading-relaxed mt-4">
              After rating them, you can drag these same themes (and add your
              own) inside the prioritization board below.
            </p>
          </header>
  
          <ContentSection
            sliders={Object.fromEntries(
              Object.entries(sliders).map(([k, s]) => [
                k,
                { value: s.value, saving: s.saving },
              ])
            )}
            onChange={handleSliderChange}
          />
  
        </section>
        <section className="mt-16 mx-auto w-full max-w-[950px] px-6">
            <div className="bg-whitep-5 mb-6">
              <p className="text-neutral-800 text-base leading-relaxed mb-8">
                Final step in this chapter: drag the themes around to show which ones
                usually lead your internal pitch. You can add themes as well if you feel like any are missing.
              </p>
              {/* BoardOverlay is portaled here by ClientAnnotator */}
            <div
              id="board-mount"
              className="w-full flex items-center justify-center"
              style={{ minHeight: "600px" }}
            />
            </div>            
        </section>

        {/* Divider */}
                <div className="relative max-w-6xl mx-auto mt-30 mb-20">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>
        
        {/* ------------------------ COMMUNICATION ------------------------ */}
        <section
          id="communication"
          className="mx-auto max-w-2xl w-full"
        >
          <header className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              3. Communication tactics
            </h2>
  
            <p className="text-neutral-700 text-base leading-relaxed">
              This section focuses on how the message is delivered: prototypes and
              demos, translation into business vocabulary, strategic repetition,
              and creating small wins people retell. Please rate how actively you
              already rely on each practice. You can place comments here on which
              of these tactics you trust or reject.
            </p>
          </header>
  
          <CommunicationSection
            sliders={Object.fromEntries(
              Object.entries(sliders).map(([k, s]) => [
                k,
                { value: s.value, saving: s.saving },
              ])
            )}
            onChange={handleSliderChange}
          />
        </section>

        {/* Divider */}
        <div className="relative max-w-6xl mx-auto mt-24 mb-20">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
        </div>
  
        {/* ------------------------ SYNTHESIS ------------------------ */}
        <section
          id="synthesis"
          className="mx-auto max-w-2xl w-full pb-24"
        >
          <header className="mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              4. Synthesis
            </h2>

            <p className="text-neutral-700 text-base leading-relaxed mb-4">
              You have now seen: the organizational context that shapes advocacy,
              the value stories (content) you can lean on, and the tactics to make
              those stories land. This last step asks you to synthesize that into
              a short internal narrative.
            </p>

            <p className="text-neutral-700 text-base leading-relaxed">
              Please draft, in plain language, how you would argue for design’s
              importance in your organization right now. Imagine you are talking
              to an executive sponsor or a skeptical peer lead. Focus on what you
              would actually say. If you don't have time, bulletpoints are also ok.
            </p>
          </header>

          {/* new synthesis box */}
          <SynthesisBox
            token={notesVisible ? token : null}
            sectionKey="synthesis_main"
            canEdit={notesVisible /* or reviewer.canComment if you want lock */}
          />

          <p className="text-normal mt-8 leading-relaxed mt-3">
              Once you are finished reviewing, press the <strong>mark as done</strong> checkmark in the green top banner. Thank you for your work!
            </p>
        </section>
      </main>
  
      {/* BoardOverlay rendered into #board-mount as a portal */}
      {boardMount &&
        createPortal(
          <BoardOverlay
            token={token ?? undefined}
            canEdit={reviewer.state === "valid" && reviewer.canComment}
          />,
          boardMount
        )}
  
      {/* Floating comment overlay (right-click etc.) */}
      {commentingEnabled && reviewer.state === "valid" && token ? (
        <CommentOverlay reviewerLabel={reviewer.label} token={token} />
      ) : null}
  
    </>
  );
}
