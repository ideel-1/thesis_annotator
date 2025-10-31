"use client";

type SliderView = {
  value: number;
  saving: boolean;
};

type SlidersMap = Record<string, SliderView>;

type ContextSectionProps = {
  sliders: SlidersMap;
  onChange: (sectionKey: string, itemKey: string, nextVal: number) => void;
};

function ImportanceSliderControlled({
  value,
  saving,
  labelLeft,
  labelRight,
  onChange,
}: {
  value: number;
  saving: boolean;
  labelLeft: string;
  labelRight: string;
  onChange: (nextVal: number) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between text-[11px] text-neutral-500 mb-1">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value ?? 50}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neutral-900"
      />

      <div className="text-[11px] text-neutral-400 text-right mt-1 tabular-nums">
        {saving ? "Saving…" : "Saved"}
      </div>
    </div>
  );
}

function Block({
  index,
  title,
  bullets,
  sectionKey,
  itemKey,
  sliders,
  onChange,
}: {
  index: number;
  title: string;
  bullets: string[];
  sectionKey: string; // "context"
  itemKey: string; // "org_position"
  sliders: SlidersMap;
  onChange: (sectionKey: string, itemKey: string, nextVal: number) => void;
}) {
  const sliderId = `${sectionKey}::${itemKey}`;
  const sliderState = sliders[sliderId] || { value: 50, saving: false };

  return (
    <section className="flex gap-4 w-full">
      {/* index number */}
      <div className="shrink-0">
        <div className="text-4xl font-semibold text-neutral-300 leading-none tabular-nums">
          {index.toString().padStart(2, "0")}
        </div>
      </div>

      {/* card */}
      <div className="flex-1">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
          <h3 className="text-base font-semibold text-neutral-900 mb-3">
            {title}
          </h3>

          <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-700 leading-relaxed">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <ImportanceSliderControlled
            value={sliderState.value}
            saving={sliderState.saving}
            labelLeft="Not relevant"
            labelRight="Need to understand very well"
            onChange={(nextVal) => onChange(sectionKey, itemKey, nextVal)}
          />
        </div>
      </div>
    </section>
  );
}

export default function ContextSection({ sliders, onChange }: ContextSectionProps) {
  return (
    <div className="flex flex-col gap-10">
      <Block
        index={1}
        title="Organizational Position of Design"
        bullets={[
          "Centralized teams offer coherence and scale but risk isolation.",
          "Embedded models gain proximity yet can fragment.",
          "Executive access varies (often no Chief Design Officer), which shapes whether design enters strategy or remains delivery-focused.",
          "Under-resourcing (for example: one designer to dozens of developers) can further limit influence.",
        ]}
        sectionKey="context"
        itemKey="org_position"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={2}
        title="Purpose of Advocacy Work"
        bullets={[
          "Advocacy is everyday work to pull design upstream toward problem framing.",
          "Leaders shift perception from 'making things pretty' toward customer evidence and better decision-making.",
          "The job is to enlarge design’s formal mandate in the organization.",
        ]}
        sectionKey="context"
        itemKey="advocacy_work"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={3}
        title="Internal Stakeholders and Audiences"
        bullets={[
          "Executives, peer leads, and middle managers respond to different arguments.",
          "Finance-heavy leadership expects risk/impact framing; middle layers sometimes shortcut research or copy competitors.",
          "Receptivity depends heavily on prior exposure to design.",
        ]}
        sectionKey="context"
        itemKey="stakeholders"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={4}
        title="Constraints and Enablers"
        bullets={[
          "Barriers: hierarchy, siloed structures, inertia, and scarce resources.",
          "Enablers: executive sponsorship, rising literacy, and visible delivery wins that create credibility.",
          "Allies (for example PMs or engineering leads) can legitimize design’s strategic role.",
        ]}
        sectionKey="context"
        itemKey="constraints_enablers"
        sliders={sliders}
        onChange={onChange}
      />
    </div>
  );
}
