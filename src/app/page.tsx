'use client';

import { useEffect } from 'react';
import CommentOverlay from '@/components/CommentOverlay';
import OwnerPanel from '@/components/OwnerPanel';

/* ------------------------------ Helpers ------------------------------ */

function FlowSVG({
  className,
  viewBoxHeight,
  pathD,
}: {
  className?: string;
  viewBoxHeight: number;
  pathD: string;
}) {
  // A single reusable, elegant dashed path with gradient + fade + outlined arrowhead
  return (
    <svg
      viewBox={`0 0 800 ${viewBoxHeight}`}
      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className ?? ''}`}
      fill="none"
    >
      <defs>
        {/* Subtle stroke gradient */}
        <linearGradient id="flowStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#a3a3a3" />
        </linearGradient>

        {/* End fade so the line dies before the next block */}
        <linearGradient id="fadeMask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="82%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <mask id="maskEnd">
          <rect width="100%" height="100%" fill="url(#fadeMask)" />
        </mask>

        {/* Outlined chevron arrowhead (no fill) */}
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
      className={`reveal absolute ${
        side === 'left' ? 'left-[8%]' : 'right-[8%]'
      } ${width} ${className ?? ''}`}
    >
      <div className="relative rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur p-8">
        {/* notch toward the flow line */}
        <span
          className={`${pointerCommon} ${
            side === 'left' ? '-right-3' : '-left-3'
          }`}
        />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function Page() {
  // Scroll reveal + progress active state
  useEffect(() => {
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>('.reveal')
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view');
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));

    const ids = ['overview', 'context', 'what', 'how'];
    const po = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('id');
          if (!id) return;
          const link = document.querySelector<HTMLAnchorElement>(
            `#progress a[href="#${id}"]`
          );
          if (link) link.dataset.active = e.isIntersecting ? 'true' : 'false';
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) po.observe(el);
    });

    return () => {
      io.disconnect();
      po.disconnect();
    };
  }, []);

  return (
    <main className="relative bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_60%)] text-neutral-900 overflow-x-hidden">
      {/* global overlays */}
      <CommentOverlay />
      <OwnerPanel />

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
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-10 text-center">
          Master Thesis: defining the value argument for design
        </h1>

        <div className="max-w-3xl mx-auto bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 mb-20">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 transition group-hover:scale-110"
            >
              <path d="M12 2L2 22h20L12 2z" />
              <path d="M12 13l3 5H9l3-5z" />
            </svg>
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 transition group-hover:scale-110"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15 15 0 010 20" />
            </svg>
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 transition group-hover:scale-110"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="9" cy="10" r="1" />
              <circle cx="15" cy="10" r="1" />
              <path d="M8 15c1.333 1 2.667 1 4 0" />
            </svg>
          </a>
        </div>
      </section>

      {/* ------------------------ CONTEXT ------------------------ */}
      <section id="context" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title & subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-7xl font-semibold text-neutral-900 mb-16">
            Organizational context
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-2xl">
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

        {/* Flow line */}
        <FlowSVG
          className="top-[150px] w-[900px] h-[2300px]"
          viewBoxHeight={2300}
          pathD={`M450 400
                   C400 480, 300 600, 430 850
                   C560 1100, 260 1250, 400 1500
                   C560 1750, 240 1950, 400 2150`}
        />

        {/* Four subchapters */}
        <div className="relative min-h-[450px] flex items-center">
          <Card side="left" title="Organizational Position of Design">
            Design’s structural placement conditions advocacy. Centralized teams
            offer coherence and scale but risk isolation; embedded models gain
            proximity yet fragment. Seniority and executive access vary (often
            no Chief Design Officer), shaping whether design enters strategy or
            remains delivery-focused. Under-resourcing (e.g., one designer to
            dozens of developers) can further marginalize influence.
          </Card>
        </div>

        <div className="relative min-h-[450px] flex items-center">
          <Card side="right" title="Nature of Advocacy Work">
            Advocacy appears as everyday work that expands design from execution
            toward upstream problem framing. Leaders mature the function amid
            uneven literacy, reframing design from “making things pretty” to
            stewarding customer knowledge and improving decisions. It is
            proactive role-making: moving design upstream while building
            organizational understanding of its broader scope.
          </Card>
        </div>

        <div className="relative min-h-[450px] flex items-center">
          <Card side="left" title="Internal Stakeholders and Audiences">
            Audiences include executives, peer leads, and middle managers with
            diverse priors. At board level, finance/metrics often dominate;
            middle management may favor copying competitors or skipping
            research. Literacy varies by department, shaping receptivity.
            Positive exposure to good design creates allies; absence of exposure
            sustains stereotypes.
          </Card>
        </div>

        <div className="relative min-h-[450px] flex items-center">
          <Card side="right" title="Constraints and Enablers">
            Barriers include legacy hierarchies, siloed structures, mindset
            inertia, and scarce resources. Enablers include executive
            sponsorship, rising design literacy, process changes that integrate
            design, and success stories that tie work to KPIs. Over time, these
            forces can elevate design’s standing and open earlier involvement.
          </Card>
        </div>

        {/* Handoff to Content */}
        <div className="text-center max-w-4xl mx-auto mt-10">
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-3xl">
            Having understood some of the why and in what context design
            advocacy happens, we turn to the core value arguments which design
            leaders use.
          </p>
        </div>
      </section>

      {/* ------------------------ CONTENT ------------------------ */}
      <section id="what" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title and subtitle (your adjusted copy) */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-7xl font-semibold text-neutral-900 mb-16">
            Advocacy content
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-2xl">
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
            <br />
            <br />
            In this chapter, I will highlight some things you mentioned, you can
            comment on those as well.
          </p>
        </div>

        {/* Throughline for 4 items; ends before themes */}
        <FlowSVG
          className="top-[150px] w-[900px] h-[2200px]"
          viewBoxHeight={2200}
          pathD={`M450 400 
                   C400 450, 350 500, 450 750 
                   C550 1000, 250 1250, 400 1500 
                   C550 1750, 250 2000, 400 2250`}
        />

        {/* 1 */}
        <div className="relative min-h-[450px] flex items-center">
          <Card side="left" title="Design as Connection to Customer">
            The dominant value claim positions design as the organization’s
            voice of the customer. Through research, journey maps, and direct
            user exposure, design corrects internal bias and de-risks bets,
            giving leaders confidence they are “doing the right thing” for
            customers and the business.
          </Card>
        </div>

        {/* 2 */}
        <div className="relative min-h-[450px] flex items-center">
          <Card side="right" title="Design as Integrator and Efficiency Enabler">
            Design acts as “the glue” that bridges silos and aligns product,
            engineering, and business. Early testing and prototyping prevent
            rework, saving time and money while improving collaboration quality.
            The claim resonates with stakeholders focused on speed, ROI, and
            execution risk.
          </Card>
        </div>

        {/* 3 (slightly wider to echo your screenshot) */}
        <div className="relative min-h-[450px] flex items-center">
          <Card side="left" width="w-[450px]" title="Design as Differentiator and Quality Standard">
            Design elevates experience quality and brand trust, creating
            competitive advantage when features converge. Leaders stress how
            consistent high-quality contributes to market-relevant outcomes.
            Some contexts avoid this lens if the market is less competitive,
            the company is more mature, or they want to avoid positioning design
            as merely aesthetic.
          </Card>
        </div>

        {/* 4 */}
        <div className="relative min-h-[450px] flex items-center">
          <Card side="right" title="Design as Strategic Lens and Vision Caster">
            As credibility grows, design can contribute to upstream framing and
            futures work. Leaders use design’s capability to prototype ideas
            fast to inform strategy, typically in more mature contexts where
            prior wins have earned a seat in strategic dialogues.
          </Card>
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-3xl">
            The following aspects help support the four core lenses, but are
            cited less often:
          </p>
        </div>

        {/* supporting themes (no line here) */}
        <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="reveal p-6 rounded-xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h5 className="font-semibold text-lg mb-3">
              Consistency through Design Systems
            </h5>
            <p className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
              Shared standards and systems create coherence at scale, reduce
              ambiguity, and compound trust over time—often becoming a subtle,
              durable differentiator.
            </p>
          </div>
          <div className="reveal p-6 rounded-xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h5 className="font-semibold text-lg mb-3">
              Culture Change and Evangelism
            </h5>
            <p className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
              Design talks, internal cases, and applying design to internal
              processes keep practices from regressing amid turnover and legacy
              habits.
            </p>
          </div>
          <div className="reveal p-6 rounded-xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h5 className="font-semibold text-lg mb-3">
              Creativity as a Sustaining Resource
            </h5>
            <p className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
              Some leaders emphasize designers’ unique capacity to envision
              non-obvious possibilities, tying design to innovation.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------ COMMUNICATION ------------------------ */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-28">
        {/* Title + subtitle */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-7xl font-semibold text-neutral-900 mb-16">
            Communication tactics
          </h2>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-2xl">
            Persuasion rests on executional communication: “the how” of
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

        {/* Throughline weaving 6 items (tighter spacing) */}
        <FlowSVG
          className="top-[150px] w-[900px] h-[2400px]"
          viewBoxHeight={2400}
          pathD={`M450 380
                   C400 520, 300 680, 430 860
                   C560 1040, 260 1220, 400 1400
                   C560 1580, 260 1760, 400 1940
                   C560 2120, 260 2300, 400 2480`}
        />

        <div className="relative min-h-[340px] flex items-center">
          <Card side="left" title='Tangible Demonstration: “Show, Don’t Tell”'>
            Persuasion begins with visible results: small demos, quick examples,
            and “vision designs” replace abstract claims. Producing something
            concrete shifts conversations from opinion to evidence and
            accelerates influence.
          </Card>
        </div>

        <div className="relative min-h-[340px] flex items-center">
          <Card side="right" title="Prototypes and Artifacts">
            Mock-ups, journey maps, and customer videos operate as shared
            reference points that help align teams, reduce ambiguity, and
            de-risk investment. Even rough models move debates forward by
            inviting concrete feedback and user validation.
          </Card>
        </div>

        <div className="relative min-h-[340px] flex items-center">
          <Card side="left" title="Translating Design into Business">
            Leaders mirror stakeholders’ vocabulary, focusing on design’s value
            to revenue, efficiency, risk, and ROI—avoiding design jargon. The
            reframing connects outcomes to the metrics and horizons executives
            already use to decide.
          </Card>
        </div>

        <div className="relative min-h-[340px] flex items-center">
          <Card side="right" title="Metrics and External Legitimacy">
            Arguments are substantiated with quantitative indicators and
            benchmarks. Tying work to numbers is essential for attention and
            prioritization.
          </Card>
        </div>

        <div className="relative min-h-[340px] flex items-center">
          <Card side="left" title="Participation and Small Wins">
            Co-testing, workshops, and pilots invite skeptics into the process.
            Hands-on exposure turns minds, builds empathy, and creates
            incremental wins that travel across teams.
          </Card>
        </div>

        <div className="relative min-h-[340px] flex items-center">
          <Card side="right" title="Sustained Advocacy and Repetition">
            Credibility compounds through cadence: repeating key messages,
            showcasing outcomes, and cultivating ambassadors at multiple levels
            keeps design visible and normalizes practices across the
            organization.
          </Card>
        </div>

        {/* Synthesis (no line here) */}
        <div className="text-center max-w-4xl mx-auto mt-10">
          <h4 className="italic text-2xl text-neutral-800 mb-6">Synthesis</h4>
          <p className="text-left text-neutral-600 leading-[1.85] tracking-[0.01em] text-2xl">
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
            <strong>Third,</strong> let the wins leave a trail. Each successful
            demo, small talk, or conversation helps reinforce that design really
            does bring value. Over time, these traces accumulate—standards
            cohere, numbers reappear in reviews, stories are retold by
            non-designers—and the organization sometimes shifts.
            <br />
            <br />
            In that narrative, design stops arguing for its place because the
            place is already woven into how the company remembers, measures, and
            decides.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 pb-12 text-xs text-neutral-500 text-center">
        © {new Date().getFullYear()} — Thesis findings
      </footer>

      {/* Minimal CSS for scroll reveal */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.in-view {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
