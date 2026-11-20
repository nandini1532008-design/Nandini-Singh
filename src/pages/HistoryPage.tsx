import {
  ArrowRight,
  Code2,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, extractApiErrorMessage } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import {
  LANGUAGE_OPTIONS,
  type ReviewReportData,
  type SupportedLanguage,
} from "../types/review";

export function HistoryPage() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<"all" | SupportedLanguage>(
    "all"
  );

  const [deleteTarget, setDeleteTarget] = useState<ReviewReportData | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ reviews: ReviewReportData[] }>(
        "/reviews"
      );
      const sorted = [...res.data.reviews].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReviews(sorted);
    } catch (err) {
      setError(
        extractApiErrorMessage(err, "Unable to load your review history.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      if (languageFilter !== "all" && r.language !== languageFilter) {
        return false;
      }
      if (!q) return true;
      const inCode = r.code.toLowerCase().includes(q);
      const inSummary = r.summary.toLowerCase().includes(q);
      const inFindings = r.findings.some((f) =>
        f.title.toLowerCase().includes(q)
      );
      return inCode || inSummary || inFindings;
    });
  }, [reviews, searchQuery, languageFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/reviews/${deleteTarget.reviewId}`);
      setReviews((prev) =>
        prev.filter((r) => r.reviewId !== deleteTarget.reviewId)
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to delete review."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-[#f5f7ff] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Review History
            </h1>
            <p className="text-sm text-[#929bb0] mt-1">
              Search past code submissions, inspect findings, and track your
              progress.
            </p>
          </div>
          <Link
            to="/review"
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#4f8cff] to-[#8b5cf6] text-xs font-semibold text-white whitespace-nowrap inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <span>New Code Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search & Language Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#929bb0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search review history"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code snippets, summaries, or findings..."
              className="w-full rounded-lg bg-[#101522] border border-white/12 pl-10 pr-4 py-2.5 text-sm text-[#f5f7ff] placeholder:text-[#929bb0]/55 focus:outline-none focus:border-[#4f8cff]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#101522] border border-white/10">
            <button
              type="button"
              onClick={() => setLanguageFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                languageFilter === "all"
                  ? "bg-[#141b2b] text-[#f5f7ff]"
                  : "text-[#929bb0] hover:text-[#f5f7ff]"
              }`}
            >
              All
            </button>
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => setLanguageFilter(lang.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  languageFilter === lang.value
                    ? "bg-[#141b2b] text-[#f5f7ff]"
                    : "text-[#929bb0] hover:text-[#f5f7ff]"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-[#ff5b65]/10 border border-[#ff5b65]/35 px-4 py-3 text-sm text-[#ff9ca2]"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 rounded-xl bg-[#101522] border border-white/8 animate-pulse"
              />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-xl bg-[#101522] border border-white/10 p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#141b2b] border border-white/10 flex items-center justify-center mx-auto">
              <Code2 className="w-6 h-6 text-[#4f8cff]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#f5f7ff]">
                {reviews.length === 0
                  ? "No Saved Reviews Yet"
                  : "No Matching Reviews"}
              </h2>
              <p className="text-sm text-[#929bb0] max-w-md mx-auto">
                {reviews.length === 0
                  ? "Run your first code analysis in the Studio and it will automatically be saved here."
                  : "Try clearing your search term or switching the language filter."}
              </p>
            </div>
            {reviews.length === 0 && (
              <Link
                to="/review"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f8cff] text-xs font-semibold text-white"
              >
                <span>Go to Code Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map((item) => {
              const langLabel =
                LANGUAGE_OPTIONS.find((l) => l.value === item.language)
                  ?.label || item.language;
              const bugs = item.findings.filter((f) => f.type === "bug").length;
              const sec = item.findings.filter(
                (f) => f.type === "security"
              ).length;
              const perf = item.findings.filter(
                (f) => f.type === "performance"
              ).length;
              const previewLines = item.code
                .split("\n")
                .slice(0, 3)
                .join("\n");
              const dateStr = new Date(item.createdAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <article
                  key={item.reviewId}
                  onClick={() => navigate(`/history/${item.reviewId}`)}
                  className="rounded-xl bg-[#141b2b] border border-white/10 hover:border-[#4f8cff]/50 p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Unboxed typographic metadata */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-mono-tech text-[#929bb0]">
                        <span className="text-[#f5f7ff] font-medium">
                          {langLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{dateStr}</span>
                      </div>
                      <span className="font-mono-tech text-sm font-bold text-[#40d99b] tabular-nums">
                        {item.qualityScore}/100
                      </span>
                    </div>

                    {/* Code snippet preview */}
                    <pre className="rounded-lg bg-[#080b14] border border-white/8 p-3 font-mono-tech text-xs text-[#e5ebff]/85 overflow-hidden max-h-20 leading-5">
                      {previewLines}
                    </pre>

                    <p className="text-xs text-[#929bb0] line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Footer Counts & Delete */}
                  <div className="pt-3 border-t border-white/8 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs font-mono-tech tabular-nums">
                      <span className="text-[#ff5b65]">{bugs} bugs</span>
                      <span className="text-[#ffbd4a]">{sec} sec</span>
                      <span className="text-[#54a6ff]">{perf} perf</span>
                    </div>

                    <button
                      type="button"
                      aria-label="Delete review"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="p-1.5 rounded-lg text-[#929bb0] hover:text-[#ff5b65] hover:bg-[#ff5b65]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-[#141b2b] border border-white/15 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-modal-title" className="text-lg font-semibold">
              Delete this code review?
            </h2>
            <p className="text-sm text-[#929bb0] leading-relaxed">
              This will permanently remove the submitted code and its AI review
              report from your history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-[#f5f7ff] hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[#ff5b65] hover:bg-[#f04c56] text-xs font-semibold text-white cursor-pointer disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
