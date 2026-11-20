import { ArrowLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient, extractApiErrorMessage } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { CodeEditor } from "../components/CodeEditor";
import { ReviewReport } from "../components/ReviewReport";
import { LANGUAGE_OPTIONS, type ReviewReportData } from "../types/review";

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<ReviewReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .get<ReviewReportData>(`/reviews/${id}`)
      .then((res) => {
        if (active) setReview(res.data);
      })
      .catch((err) => {
        if (active) {
          setError(
            extractApiErrorMessage(err, "Unable to load this review report.")
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/reviews/${review.reviewId}`);
      navigate("/history", { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to delete review."));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const langLabel =
    LANGUAGE_OPTIONS.find((l) => l.value === review?.language)?.label ||
    review?.language ||
    "";

  return (
    <div className="min-h-screen bg-[#080b14] text-[#f5f7ff] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <Link
              to="/history"
              className="text-xs font-mono-tech text-[#929bb0] hover:text-[#f5f7ff] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to History</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {review ? `${langLabel} Review Report` : "Review Report"}
            </h1>
            {review && (
              <p className="text-xs font-mono-tech text-[#929bb0]">
                Submitted{" "}
                {new Date(review.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>

          {review && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate("/review", {
                    state: {
                      suggestedLanguage: review.language,
                      prefillCode: review.code,
                    },
                  })
                }
                className="px-4 py-2 rounded-lg bg-[#141b2b] border border-white/12 hover:border-[#4f8cff]/50 text-xs font-medium text-[#f5f7ff] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open in Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#4f8cff]" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#ff5b65]/12 border border-[#ff5b65]/35 hover:bg-[#ff5b65]/22 text-xs font-medium text-[#ff9ca2] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#4f8cff]/30 border-t-[#4f8cff] animate-spin" />
            <p className="text-sm text-[#929bb0] font-mono-tech">
              Loading report...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl bg-[#ff5b65]/10 border border-[#ff5b65]/35 p-6 space-y-3"
          >
            <p className="text-sm text-[#ff9ca2]">{error}</p>
            <Link
              to="/history"
              className="inline-block text-xs font-medium text-[#f5f7ff] underline"
            >
              Return to History
            </Link>
          </div>
        ) : (
          review && (
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="w-full lg:w-[55%] shrink-0">
                <CodeEditor
                  code={review.code}
                  language={review.language}
                  readOnly
                  height={540}
                  title="Original Submission"
                />
              </div>
              <div className="w-full lg:w-[45%]">
                <ReviewReport report={review} />
              </div>
            </div>
          )
        )}
      </main>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-[#141b2b] border border-white/15 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Delete this review?</h2>
            <p className="text-sm text-[#929bb0]">
              This action permanently deletes this submission and its AI report.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-[#ff5b65] text-xs font-semibold text-white cursor-pointer disabled:opacity-60"
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
