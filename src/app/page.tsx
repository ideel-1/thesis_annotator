import React, { Suspense } from "react";
import ClientAnnotator from "./ClientAnnotator";
import { AppearanceBadge } from "@/components/AppearanceBadge";

function FlowSVG({ className, viewBoxHeight, pathD, style }: {
  className?: string;
  viewBoxHeight: number;
  pathD: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 800 ${viewBoxHeight}`}
      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className ?? ""}`}
      fill="none"
      style={style}
    >
      <defs>
        <linearGradient id="flowStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#a3a3a3" />
        </linearGradient>
        <linearGradient id="fadeMask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="82%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <mask id="maskEnd">
          <rect width="100%" height="100%" fill="url(#fadeMask)" />
        </mask>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path
            d="M0,0 L10,5 L0,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </marker>
      </defs>
      <path
        d={pathD}
        stroke="url(#flowStroke)"
        strokeWidth="2"
        strokeDasharray="10 8"
        strokeLinecap="round"
        fill="none"
        mask="url(#maskEnd)"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Card({
  side,
  width = "w-[380px]",
  title,
  children,
  appearance,
  className,
}: {
  side: "left" | "right";
  width?: string;
  title: string;
  children: React.ReactNode;
  appearance?: number;
  className?: string;
}) {
  const pointerCommon =
    "absolute top-1/2 -translate-y-1/2 w-6 h-6 rotate-45 bg-white ring-1 ring-black/5 shadow-[6px_6px_20px_rgba(0,0,0,0.06)]";

  return (
    <div
      className={`reveal absolute ${side === "left" ? "left-[8%]" : "right-[8%]"} ${width} ${
        className ?? ""
      }`}
    >
      <div className="relative rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur p-8">
        <span
          className={`${pointerCommon} ${side === "left" ? "-right-3" : "-left-3"}`}
        />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
          {children}
        </div>

        {/* new indicator */}
        <AppearanceBadge level={appearance} />
      </div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function Page() {
  return (
    <main className="relative bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_60%)] text-neutral-900 overflow-x-hidden">
      {/* Mount all client-side logic (token validation, overlays) */}
      <Suspense fallback={null}>
        <ClientAnnotator />
      </Suspense>

      {/* sticky right-rail progress */}
      <nav
        id="progress"
        className="fixed right-6 top-24 space-y-3 text-sm z-30"
        aria-label="Chapter progress"
      >
        <a
          href="#overview"
          className="block opacity-60 data-[active=true]:opacity-100 transition"
        >
          Overview
        </a>
        <a
          href="#context"
          className="block opacity-60 data-[active=true]:opacity-100 transition"
        >
          1. Context
        </a>
        <a
          href="#what"
          className="block opacity-60 data-[active=true]:opacity-100 transition"
        >
          2. Content
        </a>
        <a
          href="#how"
          className="block opacity-60 data-[active=true]:opacity-100 transition"
        >
          3. Communication
        </a>
      </nav>

      {/* ------------------------ OVERVIEW ------------------------ */}
      <section id="overview" className="mx-auto max-w-6xl px-6 pt-24 pb-32">
        <h1 className="text-6xl font-semibold tracking-loose mb-26 mt-10 text-center">
          Master Thesis: defining the value argument for design
        </h1>

        {/* reviewer instructions mount if needed
        <div id="reviewer-instructions-mount" className="max-w-3xl mx-auto mb-12" />
        */}

        <div className="max-w-3xl mx-auto bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] mb-20 p-8">
          <p className="text-neutral-900 text-xl leading-[1.85] tracking-[0.01em]">
            Having now gone through the interviews, I see design advocacy as
            driven by three core factors.
            <br />
            <br />
            There is a interdependency between organizational context, the
            content of the value argument, and the use of communication tactics
            to help convey design’s value better.
            <br />
            <br />
            I structure this page thus in those three 'C' chapters:
          </p>
        </div>

        <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto text-center mb-20">
          <a href="#context" className="group flex flex-col items-center">
            <span className="mb-8 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              1
            </span>
            <h3 className="text-2xl font-medium mb-4">Context</h3>
          </a>

          <a href="#what" className="group flex flex-col items-center">
            <span className="mb-8 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              2
            </span>
            <h3 className="text-2xl font-medium mb-4">Content</h3>
          </a>

          <a href="#how" className="group flex flex-col items-center">
            <span className="mb-8 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              3
            </span>
            <h3 className="text-2xl font-medium mb-4">Communication</h3>
          </a>
        </div>
        {/* ------------------------ APPEARANCE EXPLAINER ------------------------ */}
      <div className="max-w-3xl mx-auto mb-30 mt-40 text-center text-lg text-neutral-700">
        <p className="italic mb-4 mt-40 text-[18px] font-medium text-neutral-900">
          Before we proceed to the sections, I will be labeling each theme with the following labels, representative of how much you talked about them during our interview:
        </p>
        <div className="flex items-center justify-center gap-6 text-[13px] text-neutral-700">
          <div className="flex items-center gap-2 text-lg">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500" />
            <span>extensively</span>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-orange-400" />
            <span>mentioned</span>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-yellow-400" />
            <span>sparsely or did not</span>
          </div>
        </div>
      </div>
      </section>

    
      {/* ------------------------ CONTEXT ------------------------ */}
      <section id="context" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title & subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
            1. Organizational context
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            Based on the findings, advocacy depends on where design sits in an
            organization. Whether it is centralized or embedded and close or far
            from decision-makers, changes which arguments are heard.
            <br />
            <br />
            Limits in resources, shifting leaders, and gaps in design
            understanding also shape the situation. Good design leaders start by
            learning how the organization works, who controls budgets,
            decisions, and influence.
            <br />
            <br />
            By finding allies and key issues, they can plan where to act. And
            when the context changes, the advocacy challenge changes too.
          </p>
        </div>

        {/* legend mount (PLACE THIS ONCE, DO NOT COMMENT OUT) */}
        <div className="max-w-4xl mx-auto mb-16">
          <div id="appearance-context-mount" />
        </div>

        {/* optional reviewer notes mount
        <div id="notes-context-mount" className="max-w-4xl mx-auto mb-10" />
        */}

        {/* Flow line */}
        <FlowSVG
          className="w-[900px] h-[2300px]"
          viewBoxHeight={2300}
          pathD={`M450 400
                   C400 480, 300 600, 430 850
                   C560 1100, 260 1250, 400 1500
                   C560 1750, 240 1950, 400 2150`}
          style={{
            top: "100px",
          }}
        />

        {/* Four subchapters (rendered client-side via portal) */}
        <div id="context-cards-mount" className="relative" />


        {/* Handoff to Content */}
        <div className="text-center max-w-4xl mx-auto mt-16">
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            Having understood some of the why and in what context design
            advocacy happens, we turn to the core value arguments which design
            leaders use:
          </p>
        </div>
      </section>

      {/* ------------------------ CONTENT ------------------------ */}
      <section id="what" className="relative mx-auto max-w-6xl px-6 pb-28 mt-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-16">
            2. Advocacy content
          </h2>
          <p className="text-left text-neutral-800 leading-[1.85] tracking-[0.01em] text-xl">
            In this chapter, I present some of the value arguments that were
            brought up during interviews. Feel free to rearrange them, add a new
            lens, or comment!
            <br />
            <br />
            From research, the customer lens appears most used. Integration
            follows, promising tighter delivery loops, efficiency and less
            re-work.
            <br />
            <br />
            The use of the differentiator and strategy lens argument depends on
            the context, in low-literacy pockets, design is often framed as a
            way to differentiate the product from other companies, and as design
            gets closer to strategic level influence, the same work can also be
            framed as option creation and foresight.
          </p>
        </div>

        {/* optional reviewer notes / board */}
        {/*
        <div id="notes-content-mount" className="max-w-4xl mx-auto mb-10" />

        */}
        <div id="board-mount" className="max-w-5xl mx-auto px-2 mt-6" />
      </section>

      {/* ------------------------ COMMUNICATION ------------------------ */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title + subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-6 mt-20">
            Communication tactics
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            In this chapter, I look at how leaders take those value arguments
            and communicate them across the board. I highlight strategies, tips
            and helpful ideas to keep in mind when advocating for design.
            <br />
            <br />
            Of course, not all of these will be usable in every company, and I’d
            love to hear if there are some things that do or don’t align with
            the way you communicate about design inside yours.
          </p>
        </div>

        {/* legend mount (PLACE THIS ONCE, DO NOT DUPLICATE ID) */}
        <div className="max-w-4xl mx-auto mb-16">
          <div id="appearance-communication-mount" />
        </div>

        {/* optional reviewer notes */}
        {/*
        <div id="notes-communication-mount" className="max-w-4xl mx-auto mb-10" />
        */}

        {/* Throughline cards */}
        <FlowSVG
          className="w-[900px] h-[2200px]"
          viewBoxHeight={2400}
          pathD={`M450 380
                   C400 520, 300 680, 430 860
                   C560 1040, 260 1220, 400 1400
                   C560 1580, 260 1760, 400 1940
                   C560 2120, 260 2220, 450 2450`}
          style={{
            top: "10px",
          }}
        />

        {/* Tactic cards (rendered client-side via portal) */}
        <div id="communication-cards-mount" className="relative" />

        {/* Synthesis */}
        <div className="text-center max-w-4xl mx-auto mt-10">
          <h4 className="italic text-4xl font-medium text-neutral-800 mb-16">
            Synthesis
          </h4>
          <p className="text-left text-neutral-800 leading-[1.85] tracking-[0.01em] text-xl">
            Lastly, I summarize how I see design advocacy and its three core
            aspects interrelating.
            <br />
            <br />
            <strong>First,</strong> diagnose context continuously: track where
            decisions are made, which metrics matter, and where literacy is
            changing.
            <br />
            <br />
            <strong>Second,</strong> choose value lenses deliberately: pick the
            lens that serves the current forum’s incentives, and support it with
            the minimum viable evidence stack (demo → user proof → metric).
            <br />
            <br />
            <strong>Third,</strong> let the wins leave a trail. Over time,
            demos, small talk and conversations accumulate: standards cohere,
            numbers reappear in reviews, stories are retold by non-designers,
            and the organization can shift.
            <br />
            <br />
            In that narrative, design stops arguing for its place because its
            place is already woven into how the company remembers, measures, and
            decides.
          </p>
        </div>

        {/* optional synthesis notes
        <div id="notes-synthesis-mount" className="max-w-4xl mx-auto mt-16 mb-10" />
        */}
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 pb-12 text-xs text-neutral-500 text-center">
        © {new Date().getFullYear()} - Thesis findings; Radovan Lamac
      </footer>
    </main>
  );
}
