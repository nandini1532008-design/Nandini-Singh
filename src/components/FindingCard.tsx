import { AlertTriangle, Bug, Gauge } from "lucide-react";
import type { Finding } from "../types/review";

interface FindingCardProps {
  finding: Finding;
}

const CATEGORY_STYLES = {
  bug: {
    heading: "Bug Detected",
    color: "#ff5b65",
    borderClass: "border-[#ff5b65]/30",
    bgClass: "bg-[#ff5b65]/[0.05]",
    Icon: Bug,
  },
  security: {
    heading: "Security Concern",
    color: "#ffbd4a",
    borderClass: "border-[#ffbd4a]/30",
    bgClass: "bg-[#ffbd4a]/[0.05]",
    Icon: AlertTriangle,
  },
  performance: {
    heading: "Performance Suggestion",
    color: "#54a6ff",
    borderClass: "border-[#54a6ff]/30",
    bgClass: "bg-[#54a6ff]/[0.05]",
    Icon: Gauge,
  },
} as const;

const SEVERITY_LABELS: Record<Finding["severity"], string> = {
  low: "Low severity",
  medium: "Medium severity",
  high: "High severity",
};

export function FindingCard({ finding }: FindingCardProps) {
  const style = CATEGORY_STYLES[finding.type] || CATEGORY_STYLES.bug;
  const Icon = style.Icon;

  return (
    <article
      className={`rounded-xl bg-[#141b2b] border ${style.borderClass} p-5 space-y-3.5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono-tech">
          <Icon className="w-4 h-4 shrink-0" style={{ color: style.color }} />
          <span className="font-semibold" style={{ color: style.color }}>
            {style.heading}
          </span>
          <span aria-hidden="true" className="text-[#929bb0]">
            ·
          </span>
          <span className="text-[#929bb0]">{SEVERITY_LABELS[finding.severity]}</span>
        </div>

        <span className="text-xs font-mono-tech text-[#929bb0] tabular-nums">
          {finding.lineRef}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[#f5f7ff] leading-snug">
        {finding.title}
      </h3>

      <p className="text-sm leading-relaxed text-[#f5f7ff]/85">
        {finding.description}
      </p>

      <div className={`rounded-lg ${style.bgClass} border ${style.borderClass} p-3.5`}>
        <p className="text-xs font-mono-tech text-[#929bb0] mb-1">
          Why it matters
        </p>
        <p className="text-sm leading-relaxed text-[#f5f7ff]/85">
          {finding.whyItMatters}
        </p>
      </div>
    </article>
  );
}
