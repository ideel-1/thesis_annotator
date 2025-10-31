"use client";

import ImportanceSlider from "@/components/ImportanceSlider";

type SectionBoxProps = {
  index: number;                // 1-based index in that section
  title: string;
  body: string[];               // array of short statements we will join into <p> blocks
  themeKey: string;             // e.g. "org_position", "customer", "show_dont_tell"
  token: string | null;         // reviewer token from ClientAnnotator
};

export default function SectionBox({
  index,
  title,
  body,
  themeKey,
  token,
}: SectionBoxProps) {
  return (
    <div className="relative flex items-start gap-4 rounded-xl border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 mb-8">
      {/* Left index number */}
      <div className="shrink-0 text-neutral-300 font-semibold text-4xl leading-none tabular-nums">
        {index < 10 ? `0${index}` : index}
      </div>

      {/* Right content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {title}
        </h3>

        <div className="space-y-3 text-base leading-relaxed text-neutral-700 tracking-[0.01em]">
          {body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Importance slider */}
        <div className="mt-5 pt-4 border-t border-neutral-200">
          <ImportanceSlider token={token} themeKey={themeKey} />
        </div>
      </div>
    </div>
  );
}
