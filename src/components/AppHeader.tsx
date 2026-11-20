import { LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isReviewActive = location.pathname === "/review";
  const isHistoryActive = location.pathname.startsWith("/history");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b14]/95">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-[#f5f7ff] whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          CodeSense AI
        </Link>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Workspace Navigation"
          className="flex items-center gap-6 text-sm font-medium"
        >
          <Link
            to="/review"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              isReviewActive
                ? "text-[#f5f7ff] border-[#4f8cff]"
                : "text-[#929bb0] border-transparent hover:text-[#f5f7ff]"
            }`}
          >
            Code Studio
          </Link>
          <Link
            to="/history"
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              isHistoryActive
                ? "text-[#f5f7ff] border-[#4f8cff]"
                : "text-[#929bb0] border-transparent hover:text-[#f5f7ff]"
            }`}
          >
            Review History
          </Link>
        </nav>

        {/* Zone 3: User action */}
        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <span className="hidden sm:inline text-xs text-[#929bb0] truncate max-w-[160px]">
              {user.name}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-lg border border-white/12 bg-[#101522] hover:bg-[#141b2b] text-xs font-medium text-[#f5f7ff] whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#929bb0]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
