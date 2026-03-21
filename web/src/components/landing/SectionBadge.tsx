import { cn } from "@/lib/utils";

interface SectionBadgeProps {
  label: string;
  tag?: string;
  className?: string;
}

export function SectionBadge({ label, tag, className }: SectionBadgeProps) {
  return (
    <div
      className={cn(
        "liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body font-light text-white/60",
        className
      )}
    >
      {tag && (
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-black">
          {tag}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
}
