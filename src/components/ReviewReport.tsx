import Editor from "@monaco-editor/react";
import { ArrowRight, Check, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import {
  LANGUAGE_OPTIONS,
  type ReviewReportData,
} from "../types/review";
import { FindingCard } from "./FindingCard";
import { ScoreCard } from "./ScoreCard";

interface ReviewReportProps {
  report: ReviewReportData;
  onApplyImprovedCode?: (improvedCode: string) => void;
}

export function ReviewReport({
  report,
  onApplyImprovedCode,
}: ReviewReportProps) {
  const [copiedImproved, setCopiedImproved] = useState(false);

  const langOption =
    LANGUAGE_OPTIONS.find((l) => l.value === report.language) ||
    LANGUAGE_OPTIONS[0];

  const handleCopyImproved = async () => {
    try {
      await navigator.clipboard.writeText(report.improvedCode);
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-5">
      <ScoreCard
        qualityScore={report.qualityScore}
        summary={report.summary}
        findings={report.findings}
      />

      {/* Findings List */}
      <div className="space-y-3.5">
        {report.findings.length === 0 ? (
          <div className="rounded-xl bg-[#141b2b] border border-[#40d99b]/30 p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#40d99b] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#f5f7ff]">
                No Issues Detected
              </h3>
              <p className="text-sm text-[#929bb0] leading-relaxed">
                This submission looks clean with no bugs, security risks, or
                obvious performance bottlenecks flagged.
              </p>
            </div>
          </div>
        ) : (
          report.findings.map((finding, idx) => (
            <FindingCard key={`${finding.type}-${idx}`} finding={finding} />
          ))
        )}
      </div>

      {/* Improved Code Panel (Green) */}
      <section className="rounded-xl bg-[#141b2b] border border-[#40d99b]/35 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#40d99b]/20 bg-[#40d99b]/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#40d99b]">
              Improved Code
            </h3>
            <p className="text-xs text-[#929bb0] mt-0.5">
              Review and test suggestions before deploying to production.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onApplyImprovedCode && (
              <button
                type="button"
                onClick={() => onApplyImprovedCode(report.improvedCode)}
                className="px-3 py-1.5 rounded-lg bg-[#40d99b]/15 border border-[#40d99b]/35 text-xs font-medium text-[#40d99b] hover:bg-[#40d99b]/25 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Load into Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyImproved}
              className="px-3 py-1.5 rounded-lg bg-[#101522] border border-white/12 text-xs text-[#f5f7ff] hover:border-white/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedImproved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#40d99b]" />
                  <span className="text-[#40d99b]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="h-[300px] bg-[#0c101b]">
          <Editor
            height="300px"
            language={langOption.monacoId}
            value={report.improvedCode}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 21,
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </div>
      </section>
    </div>
  );
}
