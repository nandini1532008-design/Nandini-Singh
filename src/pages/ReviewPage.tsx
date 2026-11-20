import {
  AlertCircle,
  Code2,
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiClient, extractApiErrorMessage } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { CodeEditor } from "../components/CodeEditor";
import { ReviewReport } from "../components/ReviewReport";
import {
  LANGUAGE_OPTIONS,
  type ReviewReportData,
  type SupportedLanguage,
} from "../types/review";

interface ReviewLocationState {
  suggestedLanguage?: SupportedLanguage;
  prefillCode?: string;
}

export function ReviewPage() {
  const location = useLocation();
  const routeState = (location.state as ReviewLocationState | null) || {};

  const initialLanguage: SupportedLanguage =
    routeState.suggestedLanguage &&
    LANGUAGE_OPTIONS.some((l) => l.value === routeState.suggestedLanguage)
      ? routeState.suggestedLanguage
      : "javascript";

  const initialCode =
    typeof routeState.prefillCode === "string"
      ? routeState.prefillCode
      : LANGUAGE_OPTIONS.find((l) => l.value === initialLanguage)?.sampleCode ||
        LANGUAGE_OPTIONS[0].sampleCode;

  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState<string>(initialCode);
  const [editorHeight, setEditorHeight] = useState<number>(520);
  const [report, setReport] = useState<ReviewReportData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analyzing) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  const handleLanguageChange = (nextLang: SupportedLanguage) => {
    const prevSample = LANGUAGE_OPTIONS.find(
      (l) => l.value === language
    )?.sampleCode;
    const nextSample = LANGUAGE_OPTIONS.find(
      (l) => l.value === nextLang
    )?.sampleCode;

    setLanguage(nextLang);
    if ((!code.trim() || code === prevSample) && nextSample) {
      setCode(nextSample);
    }
  };

  const handleLoadSample = () => {
    const sample = LANGUAGE_OPTIONS.find(
      (l) => l.value === language
    )?.sampleCode;
    if (sample) {
      setCode(sample);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    setError(null);

    if (!code.trim()) {
      setError("Please enter or paste some code before running an analysis.");
      return;
    }

    if (code.length > 10000) {
      setError(
        `Your submission is ${code.length.toLocaleString()} characters. Please keep code under 10,000 characters.`
      );
      return;
    }

    if (!LANGUAGE_OPTIONS.some((l) => l.value === language)) {
      setError("Please select a supported programming language.");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiClient.post<ReviewReportData>("/review", {
        code,
        language,
      });
      setReport(res.data);
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Unable to analyze your code right now. Please try again."
        )
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-[#f5f7ff] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Studio Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              AI Code Review Studio
            </h1>
            <p className="text-sm text-[#929bb0] mt-1">
              Paste your code, select the language, and get structured bug,
              security, and performance guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={analyzing}
              className="px-3.5 py-2.5 rounded-lg bg-[#141b2b] border border-white/12 hover:border-white/25 text-xs font-medium text-[#f5f7ff] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              Load Sample
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#4f8cff] to-[#8b5cf6] hover:opacity-95 disabled:opacity-60 text-xs font-mono-tech font-semibold tracking-wider text-white whitespace-nowrap inline-flex items-center gap-2 shadow-[0_10px_28px_-10px_rgba(79,140,255,0.65)] transition-opacity cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ANALYZING CODE...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>ANALYZE CODE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop 58% Editor / 42% Report Split */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left 58%: Editor */}
          <div className="w-full lg:w-[58%] shrink-0">
            <CodeEditor
              code={code}
              language={language}
              onChangeCode={setCode}
              onChangeLanguage={handleLanguageChange}
              height={editorHeight}
              onChangeHeight={setEditorHeight}
              title="Submission Editor"
            />
          </div>

          {/* Right 42%: AI Review Report */}
          <div className="w-full lg:w-[42%] space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-[#ff5b65]/10 border border-[#ff5b65]/35 p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#ff5b65] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#f5f7ff]">
                      Analysis Failed
                    </p>
                    <p className="text-sm text-[#ff9ca2] leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-3.5 py-1.5 rounded-lg bg-[#ff5b65]/20 border border-[#ff5b65]/40 text-xs font-medium text-[#f5f7ff] hover:bg-[#ff5b65]/30 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Analysis</span>
                </button>
              </div>
            )}

            {analyzing ? (
              <div className="rounded-xl bg-[#101522] border border-[#4f8cff]/25 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
                <div className="w-12 h-12 rounded-full border-2 border-[#4f8cff]/25 border-t-[#4f8cff] animate-spin" />
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-base font-semibold text-[#f5f7ff]">
                    Reviewing your {language} code
                  </p>
                  <p className="text-sm text-[#929bb0]">
                    Checking control flow, security boundaries, performance
                    patterns, and preparing improved code...
                  </p>
                  <p className="font-mono-tech text-xs text-[#4f8cff] tabular-nums pt-1">
                    Elapsed: {elapsedSeconds.toFixed(1)}s
                  </p>
                </div>
              </div>
            ) : report ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="font-mono-tech text-xs text-[#929bb0]">
                    Saved to your review history
                  </span>
                  <Link
                    to={`/history/${report.reviewId}`}
                    className="text-xs font-medium text-[#4f8cff] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Permalink</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <ReviewReport
                  report={report}
                  onApplyImprovedCode={(improved) => setCode(improved)}
                />
              </div>
            ) : (
              <div className="rounded-xl bg-[#101522] border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
                <div className="w-12 h-12 rounded-xl bg-[#141b2b] border border-white/10 flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-[#4f8cff]" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h2 className="text-base font-semibold text-[#f5f7ff]">
                    Ready for Analysis
                  </h2>
                  <p className="text-sm text-[#929bb0] leading-relaxed">
                    Edit the snippet on the left or paste your own code, then
                    click <span className="text-[#f5f7ff]">ANALYZE CODE</span>{" "}
                    to receive a detailed report.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
