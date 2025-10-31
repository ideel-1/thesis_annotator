"use client";

type SliderView = {
  value: number;
  saving: boolean;
};

type SlidersMap = Record<string, SliderView>;

type ContentSectionProps = {
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
  sectionKey: string; // "content"
  itemKey: string; // "customer_connection", etc.
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
            labelLeft="Low priority for me"
            labelRight="Central to my pitch"
            onChange={(nextVal) => onChange(sectionKey, itemKey, nextVal)}
          />
        </div>
      </div>
    </section>
  );
}

export default function ContentSection({ sliders, onChange }: ContentSectionProps) {
  return (
    <div className="flex flex-col gap-10">
      <Block
        index={1}
        title="Connection to Customer"
        bullets={[
          "We represent the real customer, not an internal assumption.",
          "We reduce guesswork by grounding decisions in observed behavior, not opinion.",
          "We surface unmet needs early, before costly build decisions.",
        ]}
        sectionKey="content"
        itemKey="customer_connection"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={2}
        title="Integration / Efficiency"
        bullets={[
          "We align product, engineering, and business around a shared view of the problem.",
          "We reduce rework by clarifying scope and removing ambiguity early.",
          "We accelerate delivery because teams stop building the wrong thing.",
        ]}
        sectionKey="content"
        itemKey="integration_efficiency"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={3}
        title="Differentiation / Quality"
        bullets={[
          "We create product quality and experience that competitors cannot easily copy.",
          "We shape moments that make the offer feel unique, credible, and premium.",
          "We help avoid 'generic' outcomes that erode perceived value.",
        ]}
        sectionKey="content"
        itemKey="differentiation_quality"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={4}
        title="Strategic Lens / Foresight"
        bullets={[
          "We frame direction in human terms instead of only technical or financial terms.",
          "We create narratives about where the product/service should move next.",
          "We help leadership see beyond immediate delivery into future positioning.",
        ]}
        sectionKey="content"
        itemKey="strategic_lens"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={5}
        title="Consistency & Scale"
        bullets={[
          "We create reusable patterns, guidelines, systems - less chaos, less drift.",
          "We make it possible to ship faster while looking and behaving coherent.",
          "We protect brand credibility across touchpoints.",
        ]}
        sectionKey="content"
        itemKey="consistency_scale"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={6}
        title="Culture / Evangelism"
        bullets={[
          "We spread a way of thinking: curiosity about real users, evidence before opinion.",
          "We model cross-functional collaboration rather than functional turf wars.",
          "We normalize talking about usability and experience in leadership forums.",
        ]}
        sectionKey="content"
        itemKey="culture_evangelism"
        sliders={sliders}
        onChange={onChange}
      />

      <Block
        index={7}
        title="Creativity as Resource"
        bullets={[
          "We generate alternative possibilities when teams are stuck in one solution.",
          "We explore unconventional moves leadership can take to stand out.",
          "We de-risk 'new bets' by making them tangible early.",
        ]}
        sectionKey="content"
        itemKey="creativity_resource"
        sliders={sliders}
        onChange={onChange}
      />
    </div>
  );
}
