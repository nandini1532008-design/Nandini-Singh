import type { Finding } from "../types/review";

interface ScoreCardProps {
  qualityScore: number;
  summary: string;
  findings: Finding[];
}

export function ScoreCard({ qualityScore, summary, findings }: ScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(qualityScore)));
  const bugCount = findings.filter((f) => f.type === "bug").length;
  const securityCount = findings.filter((f) => f.type === "security").length;
  const perfCount = findings.filter((f) => f.type === "performance").length;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedScore / 100);

  const scoreTone =
    clampedScore >= 80
      ? { stroke: "#40d99b", label: "Strong" }
      : clampedScore >= 55
      ? { stroke: "#ffbd4a", label: "Needs Attention" }
      : { stroke: "#ff5b65", label: "Critical Issues" };

  return (
    <div className="rounded-xl bg-[#141b2b] border border-white/10 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Radial Score Indicator */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg
            className="w-24 h-24 -rotate-90"
            viewBox="0 0 88 88"
            aria-label={`Code quality score ${clampedScore} out of 100`}
          >
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="7"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={scoreTone.stroke}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#f5f7ff] tabular-nums leading-none">
              {clampedScore}
            </span>
            <span className="text-[10px] font-mono-tech text-[#929bb0] mt-1">
              / 100
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[#929bb0]">
            <span>Quality Score</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: scoreTone.stroke }}>{scoreTone.label}</span>
          </div>
          <p className="text-sm leading-relaxed text-[#f5f7ff]/90">{summary}</p>
        </div>
      </div>

      {/* Category Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/8">
        <div className="rounded-lg bg-[#101522] border border-white/6 px-3.5 py-2.5">
          <p className="text-xs text-[#929bb0]">Total Findings</p>
          <p className="mt-1 text-lg font-semibold text-[#f5f7ff] tabular-nums font-mono-tech">
            {findings.length}
          </p>
        </div>
        <div className="rounded-lg bg-[#101522] border border-[#ff5b65]/20 px-3.5 py-2.5">
          <p className="text-xs text-[#ff5b65]">Bugs</p>
          <p className="mt-1 text-lg font-semibold text-[#f5f7ff] tabular-nums font-mono-tech">
            {bugCount}
          </p>
        </div>
        <div className="rounded-lg bg-[#101522] border border-[#ffbd4a]/20 px-3.5 py-2.5">
          <p className="text-xs text-[#ffbd4a]">Security</p>
          <p className="mt-1 text-lg font-semibold text-[#f5f7ff] tabular-nums font-mono-tech">
            {securityCount}
          </p>
        </div>
        <div className="rounded-lg bg-[#101522] border border-[#54a6ff]/20 px-3.5 py-2.5">
          <p className="text-xs text-[#54a6ff]">Performance</p>
          <p className="mt-1 text-lg font-semibold text-[#f5f7ff] tabular-nums font-mono-tech">
            {perfCount}
          </p>
        </div>
      </div>
    </div>
  );
}
