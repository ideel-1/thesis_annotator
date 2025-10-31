export function AppearanceBadge({ level }: { level?: number }) {
    if (!level) return null;
  
    const meta =
      level === 3
        ? { color: "bg-red-500", label: "extensively" }
        : level === 2
        ? { color: "bg-orange-400", label: "mentioned" }
        : { color: "bg-yellow-400", label: "sparsely or did not" };
  
    return (
      <div className="ml-4 flex items-center gap-2 shrink-0 mt-4 text-[11px] leading-tight text-neutral-600">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${meta.color}`}
          aria-hidden="true"
        />
        <span className="select-none">{meta.label}</span>
      </div>
    );
  }
  