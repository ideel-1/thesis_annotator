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
      className={` relative min-h-[450px] flex items-center ${
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

export default function ContextCardsClient({
  appearanceByTheme,
}: {
  appearanceByTheme: Record<string, number>;
}) {
  return (
    <>
      <Card
        side="left"
        title="Organizational Position of Design"
        appearance={appearanceByTheme["org_position"]}
      >
        <BulletList
          items={[
            "Centralized teams offer coherence and scale but risk isolation.",
            "Embedded models gain proximity yet can fragment.",
            "Seniority and executive access vary (often no Chief Design Officer), shaping whether design enters strategy or remains delivery-focused.",
            "Under-resourcing (e.g., one designer to dozens of developers) can further marginalize influence.",
          ]}
        />
      </Card>

      <Card
        side="right"
        title="Nature of Advocacy Work"
        appearance={appearanceByTheme["advocacy_nature"]}
      >
        <BulletList
          items={[
            "Leaders shift perception from 'aesthetics' to customer insight and decision quality.",
            "Advocacy is everyday work to pull design upstream, toward problem framing.",
            "Advocacy expands design’s formal mandate.",
          ]}
        />
      </Card>

      <Card
        side="left"
        title="Internal Stakeholders and Audiences"
        appearance={appearanceByTheme["stakeholders"]}
      >
        <BulletList
          items={[
            "Audiences include executives, peer leads, and middle managers, each with different priors.",
            "Board-level focus is often on finance/metrics; middle management may skip research or copy competitors.",
            "Literacy varies by function, shaping receptivity.",
            "Positive exposure to design creates allies; lack of exposure sustains stereotypes.",
          ]}
        />
      </Card>

      <Card
        side="right"
        title="Constraints and Enablers"
        appearance={appearanceByTheme["constraints"]}
      >
        <BulletList
          items={[
            "Barriers: hierarchy, silos, inertia, scarce resources.",
            "Enablers: executive sponsorship, rising literacy, and process changes that integrate design.",
            "These factors can open earlier involvement and elevate design’s standing.",
          ]}
        />
      </Card>
    </>
  );
}
