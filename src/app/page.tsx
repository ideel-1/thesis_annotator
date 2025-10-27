import React, { Suspense } from "react";
import ClientAnnotator from "./ClientAnnotator"; 

function FlowSVG({
  className,
  viewBoxHeight,
  pathD,
  style,
}: {
  className?: string;
  viewBoxHeight: number;
  pathD: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 800 ${viewBoxHeight}`}
      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className ?? ''}`}
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
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
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
  width = 'w-[380px]',
  title,
  children,
  className,
}: {
  side: 'left' | 'right';
  width?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pointerCommon =
    'absolute top-1/2 -translate-y-1/2 w-6 h-6 rotate-45 bg-white ring-1 ring-black/5 shadow-[6px_6px_20px_rgba(0,0,0,0.06)]';
  return (
    <div
      className={`reveal absolute ${side === 'left' ? 'left-[8%]' : 'right-[8%]'} ${width} ${className ?? ''}`}
    >
      <div className="relative rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur p-8">
        <span className={`${pointerCommon} ${side === 'left' ? '-right-3' : '-left-3'}`} />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">{children}</div>
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
      <section id="overview" className="mx-auto max-w-6xl px-6 pt-24 pb-32" >
        <h1 className="text-6xl font-semibold tracking-loose mb-26 mt-10 text-center">
          Master Thesis: defining the value argument for design
        </h1>

        {/* Mount point for reviewer instructions */}
        <div
          id="reviewer-instructions-mount"
          className="max-w-3xl mx-auto mb-12"
        />

        {/* After the instruction card */}
      <div className="relative max-w-6xl mx-auto px-6 mt-20 mb-10">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-3 text-xs tracking-wide text-neutral-600">
          Content begins below
        </span>
      </div>
        <div className="max-w-3xl mx-auto bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 mb-20">
          <h2 className="text-xl font-medium text-neutral-900 mb-4">
            Throughline
          </h2>
          <p className="text-neutral-700 text-lg leading-[1.85] tracking-[0.01em]">
            Design leaders act as translators who, within their given
            organizational context, continually convert design efforts into
            credible value claims and then into persuasive practices that secure
            and sustain design’s legitimacy over time.
            <br />
            <br />
            This takes place through three aspects of design advocacy:
          </p>
        </div>

        <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto text-center">
          {/* 1 */}
          <a href="#context" className="group flex flex-col items-center">
            <span className="mb-2 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              1
            </span>
            <h3 className="text-lg font-medium mb-4">
              Organizational
              <br />
              context
            </h3>
            {/* simple mountain icon */}
            <img
              src="/icons/mountain.svg"
              alt="Organizational context"
              className="w-12 h-12 opacity-90 transition group-hover:scale-110"
            />
          </a>

          {/* 2 */}
          <a href="#what" className="group flex flex-col items-center">
            <span className="mb-2 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              2
            </span>
            <h3 className="text-lg font-medium mb-4">
              Advocacy
              <br />
              content
            </h3>
            {/* prism-ish icon */}
            <img
              src="/icons/lens.svg"
              alt="Organizational context"
              className="w-12 h-12 opacity-90 transition group-hover:scale-110"
            />
          </a>

          {/* 3 */}
          <a href="#how" className="group flex flex-col items-center">
            <span className="mb-2 rounded-full px-2.5 py-0.5 text-sm bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              3
            </span>
            <h3 className="text-lg font-medium mb-4">
              Communication
              <br />
              tactics
            </h3>
            {/* chat bubble */}
            <img
              src="/icons/bubble.svg"
              alt="Organizational context"
              className="w-12 h-12 opacity-90 transition group-hover:scale-110"
            />
          </a>
        </div>
      </section>

      {/* ------------------------ CONTEXT ------------------------ */}
      <section id="context" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title & subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-16">
            1. Organizational context
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            In this chapter, I explain the context of advocacy: why it happens
            in the first place, and within what circumstances.
            <br />
            <br />
            Advocacy begins with power geometry. Where design sits (embedded vs.
            centralized; close vs. distant from decision forums) determines
            which arguments are audible. Resourcing, leadership turnover, and
            literacy asymmetries create friction that advocacy must keep in mind
            and absorb.
            <br />
            <br />
            Practically, leaders first perform their own organizational
            ethnography: who owns the budget, who decides who gets to work and
            who doesn’t. The early goal is to locate leverage such as
            supporters, tackle burning issues, and identify points design can
            use later.
            <br />
            <br />
            Context often becomes input: change it and the advocacy problem
            changes.
          </p>
        </div>

        {/* After Context intro */}
        <div id="notes-context-mount" className="max-w-4xl mx-auto mb-10" />

        {/* Flow line */}
        <FlowSVG
          className="w-[900px] h-[2300px]"
          viewBoxHeight={2300}
          pathD={`M450 400
                   C400 480, 300 600, 430 850
                   C560 1100, 260 1250, 400 1500
                   C560 1750, 240 1950, 400 2150`}
          style={{ top: "calc(250px + var(--context-notes-offset, 0px))"}}
        />

        {/* Four subchapters */}
        <div className="relative min-h-[450px] flex items-center">
  <Card side="left" title="Organizational Position of Design">
    <BulletList
      items={[
        "Design’s structural placement conditions advocacy.",
        "Centralized teams offer coherence and scale but risk isolation.",
        "Embedded models gain proximity yet can fragment.",
        "Seniority and executive access vary (often no Chief Design Officer), shaping whether design enters strategy or remains delivery-focused.",
        "Under-resourcing (e.g., one designer to dozens of developers) can further marginalize influence."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[450px] flex items-center">
  <Card side="right" title="Nature of Advocacy Work">
    <BulletList
      items={[
        "Advocacy appears as everyday work that expands design from execution toward upstream problem framing.",
        "Leaders mature the function amid uneven literacy, reframing design from “making things pretty” to stewarding customer knowledge and improving decisions.",
        "The purpose of advocacy is proactive role-making: moving design upstream while building organizational understanding of its broader scope."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[450px] flex items-center">
  <Card side="left" title="Internal Stakeholders and Audiences">
    <BulletList
      items={[
        "Audiences include executives, peer leads, and middle managers with diverse priors.",
        "At board level, finance/metrics often dominate; middle management may favor copying competitors or skipping research.",
        "Literacy varies by department, shaping receptivity.",
        "Positive exposure to good design creates allies; absence of exposure sustains stereotypes."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[450px] flex items-center">
  <Card side="right" title="Constraints and Enablers">
    <BulletList
      items={[
        "Barriers include legacy hierarchies, siloed structures, mindset inertia, and scarce resources.",
        "Enablers include executive sponsorship, rising design literacy, and process changes that integrate design.",
        "Success stories tied to KPIs build legitimacy.",
        "Over time, these forces can elevate design’s standing and open earlier involvement."
      ]}
    />
  </Card>
</div>

        {/* Handoff to Content */}
        <div className="text-center max-w-4xl mx-auto mt-40">
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            Having understood some of the why and in what context design
            advocacy happens, we turn to the core value arguments which design
            leaders use:
          </p>
        </div>
      </section>

      {/* ------------------------ CONTENT ------------------------ */}
      <section id="what" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title and subtitle (your adjusted copy) */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-16">
            2. Advocacy content
          </h2>
          <p className="text-left text-neutral-800 leading-[1.85] tracking-[0.01em] text-xl">
            The “what” of advocacy is a portfolio of lenses that can be
            recombined: customer connection, integration/efficiency,
            differentiation/quality, and strategic lensing.
            <br />
            <br />
            The customer is most often at the center of the argument. Integration
            follows, promising tighter delivery loops, efficiency and less
            re-work.
            <br />
            <br />
            In low-literacy pockets, design is often framed as a way to
            differentiate the product from other companies, and as design gets
            closer to strategic level influence, the same work can also be
            framed as option creation and foresight.
          </p>
        </div>

        {/* After Content intro */}
        <div id="notes-content-mount" className="max-w-4xl mx-auto mb-10" />
        
        <div className="text-center max-w-4xl mx-auto mb-16 mt-16">
          <p className="text-left text-neutral-800 leading-[1.85] tracking-[0.01em] text-xl">
            <strong>The following board represents how much different lenses
              appear inside the interviews. Please drag and drop, and add comments if 
              you feel like the board should be organized in a different way.
            </strong>
          </p>
        </div>
        {/* Chapter 2 — Draggable Board */}
        <div id="board-mount" className="max-w-5xl mx-auto px-2 mt-6" />


        
      </section>

      {/* ------------------------ COMMUNICATION ------------------------ */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title + subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-semibold text-neutral-900 mb-16 mt-20">
            Communication tactics
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-xl">
            Persuasion rests on executional communication: <strong>“the how” </strong> of
            advocacy.
            <br />
            <br />
            Leaders prefer to “show, not tell”, using artifacts/prototypes and
            translating design concepts into business language (KPIs, ROI,
            efficiency), emphasizing metrics and external legitimacy (data and
            benchmarks).
            <br />
            <br />
            They also highlight participation and small wins, using sustained
            repetition (cadence, showcases, allies) to help bring design
            forward.
            <br />
            <br />
            These practices convert abstract claims into evidence stakeholders
            recognize, allowing credibility to accumulate across layers of the
            organization.
          </p>
        </div>
        {/* After Communication intro */}
        <div id="notes-communication-mount" className="max-w-4xl mx-auto mb-10" />  

        {/* Throughline weaving 6 items (tighter spacing) */}
        <FlowSVG
          className="w-[900px] h-[2200px]"
          viewBoxHeight={2400}
          pathD={`M450 380
                   C400 520, 300 680, 430 860
                   C560 1040, 260 1220, 400 1400
                   C560 1580, 260 1760, 400 1940
                   C560 2120, 260 2220, 450 2450`}
          style={{ top: "calc(250px + var(--communication-notes-offset, 0px))" }} // NEW
        />

<div className="relative min-h-[340px] flex items-center">
  <Card side="left" title='Tangible Demonstration: “Show, Don’t Tell”'>
    <BulletList
      items={[
        "Persuasion starts with visible results: small demos, quick examples, and vision designs.",
        "Concrete artifacts shift conversations from opinion to evidence.",
        "Demonstrations accelerate influence."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[340px] flex items-center">
  <Card side="right" title="Prototypes and Artifacts">
    <BulletList
      items={[
        "Mock-ups, journey maps, and customer videos serve as shared references.",
        "They align teams, reduce ambiguity, and de-risk investment.",
        "Even rough models invite concrete feedback and validation."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[340px] flex items-center">
  <Card side="left" title="Translating Design into Business">
    <BulletList
      items={[
        "Leaders mirror stakeholders’ vocabulary: revenue, efficiency, risk, ROI.",
        "Avoid design jargon; connect outcomes to existing metrics and decision horizons."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[340px] flex items-center">
  <Card side="right" title="Metrics and External Legitimacy">
    <BulletList
      items={[
        "Arguments are substantiated with quantitative indicators and benchmarks.",
        "Numbers are essential for attention, prioritization, and resource decisions."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[340px] flex items-center">
  <Card side="left" title="Participation and Small Wins">
    <BulletList
      items={[
        "Co-testing, workshops, and pilots invite skeptics into the process.",
        "Hands-on exposure builds empathy and produces incremental wins that travel."
      ]}
    />
  </Card>
</div>

<div className="relative min-h-[340px] flex items-center">
  <Card side="right" title="Sustained Advocacy and Repetition">
    <BulletList
      items={[
        "Credibility compounds through cadence: repeating messages and showcasing outcomes.",
        "Cultivating ambassadors across levels keeps design visible and normalizes practices."
      ]}
    />
  </Card>
</div>

        
        

        {/* Synthesis (no line here) */}
        <div className="text-center max-w-4xl mx-auto mt-10">
          <h4 className="italic text-4xl font-medium text-neutral-800 mb-16">Synthesis</h4>
          <p className="text-left text-neutral-800 leading-[1.85] tracking-[0.01em] text-xl">
            For design leaders, advocacy is a system with three responsibilities.
            <br />
            <br />
            <strong>First,</strong> diagnose context continuously: track where
            decisions are made, which metrics matter this quarter, and where
            literacy is changing.
            <br />
            <br />
            <strong>Second,</strong> allocate value lenses deliberately: pick
            the lens that serves the current forum’s incentives, and support it
            with the minimum viable evidence stack (demo → user proof →
            metric).
            <br />
            <br />
            <strong>Third,</strong> let the wins leave a trail. 
            Each successful demo, small talk or conversation helps
            reinforce that design really does bring value. And over time,
            these traces accumulate: standards cohere, numbers reappear
            in reviews, stories are retold by non-designers, and the the
            organization sometimes shifts.
            <br />
            <br />
            In that narrative, design stops arguing for its place because the
            place is already woven into how the company remembers, measures, and
            decides.
          </p>
        </div>
        {/* Before/after Synthesis (choose location) */}
        <div id="notes-synthesis-mount" className="max-w-4xl mx-auto mt-16 mb-10" />
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 pb-12 text-xs text-neutral-500 text-center">
        © {new Date().getFullYear()} - Thesis findings; Radovan Lamac
      </footer>

      
    </main>
  );
}
