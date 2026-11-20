import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onNavigateSection: (sectionId: string) => void;
}

export function Navbar({ onNavigateSection }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bannerClosed, setBannerClosed] = useState(false);
  const [scrolledPastThreshold, setScrolledPastThreshold] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastThreshold(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showBanner = !bannerClosed && !scrolledPastThreshold;
  const primaryDestination = isAuthenticated ? "/review" : "/register";

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {/* Top Announcement Bar */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out bg-[#141414] text-[#efece6] ${
          showBanner ? "max-h-12 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-4 md:px-8 h-10 flex items-center justify-between gap-4">
          <div className="w-6 hidden sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => navigate(primaryDestination)}
            className="text-xs font-mono-tech tracking-wide text-[#efece6]/90 hover:text-white transition-colors truncate flex items-center gap-1.5 cursor-pointer"
          >
            <span>
              New: CodeSense AI V1 Is Here — Your Personal AI Code Reviewer
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[#ff8a3d]" />
          </button>
          <button
            type="button"
            onClick={() => setBannerClosed(true)}
            aria-label="Close announcement bar"
            className="p-1.5 text-[#efece6]/70 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Sticky Navigation (3-zone Top Bar Contract) */}
      <header
        className={`transition-colors duration-200 border-b ${
          scrolledPastThreshold
            ? "bg-[#efece6]/95 border-[#141414]/12 shadow-[0_8px_28px_-20px_rgba(20,20,20,0.3)]"
            : "bg-[#efece6]/88 border-[#141414]/8"
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#141414] whitespace-nowrap shrink-0"
          >
            CodeSense AI
          </Link>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 font-mono-tech text-xs tracking-[0.08em] text-[#141414]/70"
          >
            <button
              type="button"
              onClick={() => onNavigateSection("intro")}
              className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection("product")}
              className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection("preview-workbench")}
              className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection("reviews")}
              className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reviews
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <Link
              to={primaryDestination}
              className="nova-btn-gradient px-4 py-2.5 rounded-lg font-mono-tech text-xs font-medium tracking-[0.06em] whitespace-nowrap shrink-0 inline-flex items-center gap-2"
            >
              <span>LAUNCH CODESENSE</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#ffb347]" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
