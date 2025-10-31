"use client";

import React from "react";
import { AppearanceBadge } from "@/components/AppearanceBadge";

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
  title,
  children,
  appearance,
}: {
  side: "left" | "right";
  title: string;
  children: React.ReactNode;
  appearance?: number;
}) {
  const pointerCommon =
    "absolute top-1/2 -translate-y-1/2 w-6 h-6 rotate-45 bg-white ring-1 ring-black/5 shadow-[6px_6px_20px_rgba(0,0,0,0.06)]";

  return (
    <div
      className={` relative min-h-[340px] flex items-center ${
        side === "left" ? "justify-start" : "justify-end"
      }`}
    >
      <div className="relative rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur p-8 w-[380px]">
        <span
          className={`${pointerCommon} ${
            side === "left" ? "-right-3" : "-left-3"
          }`}
        />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        <div className="text-sm text-neutral-700 leading-[1.85] tracking-[0.01em]">
          {children}
        </div>

        <AppearanceBadge level={appearance} />
      </div>
    </div>
  );
}

export default function CommunicationCardsClient({
  appearanceByTheme,
}: {
  appearanceByTheme: Record<string, number>;
}) {
  return (
    <>
      <Card
        side="left"
        title='Tangible Demonstration: "Show, Don’t Tell"'
        appearance={appearanceByTheme["show_dont_tell"]}
      >
        <BulletList
          items={[
            "Persuasion starts with visible results: demos, quick examples, vision designs.",
            "Concrete artifacts shift discussion from opinion to evidence.",
            "Demonstrations accelerate influence.",
          ]}
        />
      </Card>

      <Card
        side="right"
        title="Prototypes and Artifacts"
        appearance={appearanceByTheme["prototypes"]}
      >
        <BulletList
          items={[
            "Mock-ups, journey maps, customer videos become shared references.",
            "They align teams, reduce ambiguity, and de-risk investment.",
            "Even rough models invite concrete feedback.",
          ]}
        />
      </Card>

      <Card
        side="left"
        title="Translating Design into Business"
        appearance={appearanceByTheme["translation"]}
      >
        <BulletList
          items={[
            "Leaders mirror stakeholder vocabulary: revenue, efficiency, risk, ROI.",
            "Avoid design jargon; tie outcomes to metrics and timelines stakeholders already track.",
          ]}
        />
      </Card>

      <Card
        side="right"
        title="Metrics and External Legitimacy"
        appearance={appearanceByTheme["metrics"]}
      >
        <BulletList
          items={[
            "Use numbers, benchmarks, comparables to substantiate claims.",
            "Metrics drive prioritization and funding attention.",
          ]}
        />
      </Card>

      <Card
        side="left"
        title="Participation and Small Wins"
        appearance={appearanceByTheme["small_wins"]}
      >
        <BulletList
          items={[
            "Bring skeptics into pilots, co-testing, workshops.",
            "Hands-on exposure builds empathy and produces incremental wins people retell.",
          ]}
        />
      </Card>

      <Card
        side="right"
        title="Sustained Advocacy and Repetition"
        appearance={appearanceByTheme["repetition"]}
      >
        <BulletList
          items={[
            "Credibility compounds through cadence and repetition.",
            "Champions across levels retell the story; design becomes normalized.",
          ]}
        />
      </Card>
    </>
  );
}
