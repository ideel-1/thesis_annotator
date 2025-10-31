"use client";

type SliderView = {
  value: number;
  saving: boolean;
};

type SlidersMap = Record<string, SliderView>;

type CommunicationSectionProps = {
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
  sectionKey: string; // "comm"
  itemKey: string; // "tangible_demo", etc.
  sliders: SlidersMap;
  onChange: (sectionKey: string, itemKey: string, nextVal: number) => void;
}) {
  const sliderId = `${sectionKey}::${itemKey}`;
  const sliderState = sliders[sliderId] || { value: 50, saving: false };

  return (
    <section className="flex gap-4 w-full">
      <div className="shrink-0">
        <div className="text-4xl font-semibold text-neutral-300 leading-none tabular-nums">
          {index.toString().padStart(2, "0")}
        </div>
      </div>

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
            labelLeft="I rarely do this"
            labelRight="I do this a lot"
            onChange={(nextVal) => onChange(sectionKey, itemKey, nextVal)}
          />
        </div>
      </div>
    </section>
  );
}

export default function CommunicationSection({
  sliders,
  onChange,
}: CommunicationSectionProps) {
  return (
    <div className="flex flex-col gap-10">
      <Block
        index={1}
        title='Tangible Demonstration ("Show, Don’t Tell")'
        bullets={[
          "Persuasion starts with visible results: demos, quick examples, vision designs.",
          "Showing something concrete shifts discussion from opinion to evidence.",
          "Executives react faster to something they can see, not a theory.",
        ]}
        sectionKey="comm"
        itemKey="tangible_demo"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={2}
        title="Prototypes and Shared Artifacts"
        bullets={[
          "Mock-ups, journey maps, and short clips of real users serve as shared reference points.",
          "They align teams, reduce ambiguity, and de-risk investment decisions.",
          "Even rough prototypes invite concrete feedback instead of abstract debate.",
        ]}
        sectionKey="comm"
        itemKey="shared_artifacts"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={3}
        title="Translate Design into Business Terms"
        bullets={[
          "Use vocabulary stakeholders already respect: revenue, efficiency, risk, reputation.",
          "Avoid design jargon; make the design point sound like a business point.",
          "This is often required to access budget and prioritization forums.",
        ]}
        sectionKey="comm"
        itemKey="business_translation"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={4}
        title="Metrics and External Legitimacy"
        bullets={[
          "Use numbers, benchmarks, and observed outcomes to substantiate claims.",
          "Data reframes design work from taste or preference to measurable performance.",
          "Numbers travel well in leadership culture.",
        ]}
        sectionKey="comm"
        itemKey="metrics_legitimacy"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={5}
        title="Participation and Small Wins"
        bullets={[
          "Bring skeptics into pilot tests or co-creation sessions.",
          "Hands-on exposure builds empathy and produces small wins people retell internally.",
          "Those stories become informal proof.",
        ]}
        sectionKey="comm"
        itemKey="participation_smallwins"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={6}
        title="Repetition Over Time"
        bullets={[
          "Leaders repeat the same core claim in multiple rooms until it sticks.",
          "It is less about inventing new arguments than about persistent framing.",
          "Advocacy is iterative, not a single 'big pitch'.",
        ]}
        sectionKey="comm"
        itemKey="repetition"
        sliders={sliders}
        onChange={onChange}
      />
    </div>
  );
}
