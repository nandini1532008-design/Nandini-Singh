import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Gauge,
  History,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { RobotScene, type LandingStage } from "../components/RobotScene";
import { useAuth } from "../context/AuthContext";
import type { SupportedLanguage } from "../types/review";

const ANIMATED_PROMPTS: Array<{
  text: string;
  language: SupportedLanguage;
}> = [
  {
    text: "Review this JavaScript code for bugs.",
    language: "javascript",
  },
  {
    text: "Find security vulnerabilities in my Python application.",
    language: "python",
  },
  {
    text: "Optimize this function for better performance.",
    language: "typescript",
  },
  {
    text: "Explain why this smart contract is vulnerable.",
    language: "javascript",
  },
];

const CAROUSEL_TABS = [
  { num: "01", title: "AI Code Reviewer" },
  { num: "02", title: "Bug Detection" },
  { num: "03", title: "Security Analysis" },
  { num: "04", title: "Performance Optimization" },
  { num: "05", title: "Multi-language Support" },
  { num: "06", title: "Code Explanation" },
  { num: "07", title: "Improved Code Generator" },
  { num: "08", title: "Quality Scoring" },
  { num: "09", title: "Review History" },
  { num: "10", title: "AI Code Reviewer" },
];

const PREVIEW_SAMPLES = [
  {
    id: "python",
    label: "Python",
    score: 62,
    codeLines: [
      "def get_user(username):",
      "    conn = sqlite3.connect('app.db')",
      "    cur = conn.cursor()",
      "    sql = f\"SELECT * FROM users WHERE name = '{username}'\"",
      "    cur.execute(sql)",
      "    return cur.fetchall()",
    ],
    findings: [
      {
        category: "Security Concern",
        tone: "#ffbd4a",
        line: "Line 4",
        title: "SQL Injection via string formatting",
        note: "Parameterize queries with placeholders (?) instead of interpolating user input directly into SQL strings.",
      },
      {
        category: "Bug Detected",
        tone: "#ff5b65",
        line: "Line 2",
        title: "Database connection is never closed",
        note: "Use a 'with sqlite3.connect(...) as conn:' context manager so connections close cleanly even if an error occurs.",
      },
    ],
    improvedLines: [
      "def get_user(username):",
      "    with sqlite3.connect('app.db') as conn:",
      "        cur = conn.cursor()",
      "        cur.execute('SELECT * FROM users WHERE name = ?', (username,))",
      "        return cur.fetchall()",
    ],
  },
  {
    id: "javascript",
    label: "JavaScript",
    score: 71,
    codeLines: [
      "function sumPrices(items) {",
      "  let total = 0;",
      "  for (let i = 0; i <= items.length; i++) {",
      "    total += items[i].price;",
      "  }",
      "  return total;",
      "}",
    ],
    findings: [
      {
        category: "Bug Detected",
        tone: "#ff5b65",
        line: "Line 3",
        title: "Off-by-one loop boundary causes TypeError",
        note: "Arrays are zero-indexed, so i <= items.length reads undefined on the final iteration. Use i < items.length.",
      },
      {
        category: "Performance Suggestion",
        tone: "#54a6ff",
        line: "Lines 2-5",
        title: "Simplify summation with Array.reduce",
        note: "Using reduce with a nullish guard makes intent explicit and avoids manual index management.",
      },
    ],
    improvedLines: [
      "function sumPrices(items) {",
      "  if (!Array.isArray(items)) return 0;",
      "  return items.reduce((sum, item) => sum + (item?.price ?? 0), 0);",
      "}",
    ],
  },
];

const FEATURE_CARDS = [
  {
    num: "01",
    title: "Intelligent Bug Detection",
    description:
      "Pinpoints off-by-one loops, null dereferences, assignment typos, and subtle edge-case failures with line references.",
    Icon: Bug,
  },
  {
    num: "02",
    title: "Security Vulnerability Analysis",
    description:
      "Flags SQL injection, unsafe input concatenation, exposed credentials, and fragile authentication logic early.",
    Icon: AlertTriangle,
  },
  {
    num: "03",
    title: "Performance Optimization",
    description:
      "Identifies quadratic nested loops, redundant allocations, and expensive repeated work inside hot execution paths.",
    Icon: Gauge,
  },
  {
    num: "04",
    title: "Beginner-Friendly Explanations",
    description:
      "Every finding includes a 'Why it matters' note that teaches the underlying concept in plain, encouraging language.",
    Icon: Sparkles,
  },
  {
    num: "05",
    title: "Corrected Code Suggestions",
    description:
      "Generates clean, idiomatic improvements in your original language so you can compare and copy verified fixes.",
    Icon: Code2,
  },
  {
    num: "06",
    title: "Review History",
    description:
      "Persists every code submission and AI report to your private history so you can search, revisit, and track progress.",
    Icon: History,
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    number: "01",
    initials: "AK",
    name: "Aarav Kulkarni",
    role: "CS Undergrad · Sample Testimonial",
    quote:
      "CodeSense AI helped me understand why my code was failing instead of simply showing me an error.",
  },
  {
    number: "02",
    initials: "ML",
    name: "Maya Lin",
    role: "Junior Backend Developer · Sample Testimonial",
    quote:
      "The security explanations make code reviews easier to understand, especially when learning new programming concepts.",
  },
  {
    number: "03",
    initials: "DS",
    name: "Daniel Sato",
    role: "Full-Stack Builder · Sample Testimonial",
    quote:
      "Having bug detection and corrected code in one place saves time during development.",
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const introRef = useRef<HTMLElement | null>(null);
  const productRef = useRef<HTMLElement | null>(null);
  const reviewsRef = useRef<HTMLElement | null>(null);

  const [stage, setStage] = useState<LandingStage>(0);

  // Animated Prompt Box state
  const [promptIdx, setPromptIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Feature carousel state
  const [activeTab, setActiveTab] = useState(0);
  const [carouselPausedUntil, setCarouselPausedUntil] = useState(0);

  // Interactive preview state
  const [previewSampleId, setPreviewSampleId] = useState<string>("python");
  const [previewScanning, setPreviewScanning] = useState(false);

  // Testimonial carousel state
  const [reviewIndex, setReviewIndex] = useState(0);

  // Scroll spy for 3D Robot Stage
  useEffect(() => {
    const updateStageFromScroll = () => {
      const midY = window.innerHeight * 0.45;
      const productTop = productRef.current?.getBoundingClientRect().top ?? 9999;
      const reviewsTop = reviewsRef.current?.getBoundingClientRect().top ?? 9999;

      if (reviewsTop <= midY) {
        setStage(2);
      } else if (productTop <= midY) {
        setStage(1);
      } else {
        setStage(0);
      }
    };

    updateStageFromScroll();
    window.addEventListener("scroll", updateStageFromScroll, { passive: true });
    window.addEventListener("resize", updateStageFromScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateStageFromScroll);
      window.removeEventListener("resize", updateStageFromScroll);
    };
  }, []);

  // Typewriter prompt effect (38ms type, 2600ms hold, 2 chars / 14ms delete, 250ms wait)
  useEffect(() => {
    const currentPrompt = ANIMATED_PROMPTS[promptIdx].text;
    let timer: number;

    if (!isDeleting && typedText.length < currentPrompt.length) {
      timer = window.setTimeout(() => {
        setTypedText(currentPrompt.slice(0, typedText.length + 1));
      }, 38);
    } else if (!isDeleting && typedText.length === currentPrompt.length) {
      timer = window.setTimeout(() => {
        setIsDeleting(true);
      }, 2600);
    } else if (isDeleting && typedText.length > 0) {
      timer = window.setTimeout(() => {
        setTypedText(currentPrompt.slice(0, Math.max(0, typedText.length - 2)));
      }, 14);
    } else {
      timer = window.setTimeout(() => {
        setIsDeleting(false);
        setPromptIdx((prev) => (prev + 1) % ANIMATED_PROMPTS.length);
      }, 250);
    }

    return () => window.clearTimeout(timer);
  }, [promptIdx, typedText, isDeleting]);

  // Auto-advancing 10-tab feature strip (every 2.4s)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Date.now() < carouselPausedUntil) return;
      setActiveTab((prev) => (prev + 1) % CAROUSEL_TABS.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [carouselPausedUntil]);

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    setCarouselPausedUntil(Date.now() + 6000);
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const primaryCtaTarget = isAuthenticated ? "/review" : "/register";

  const activePreview = useMemo(
    () =>
      PREVIEW_SAMPLES.find((s) => s.id === previewSampleId) ||
      PREVIEW_SAMPLES[0],
    [previewSampleId]
  );

  const handlePreviewAnalyze = () => {
    setPreviewScanning(true);
    window.setTimeout(() => {
      setPreviewScanning(false);
    }, 450);
  };

  const currentReview = SAMPLE_TESTIMONIALS[reviewIndex];
  const nextReview =
    SAMPLE_TESTIMONIALS[(reviewIndex + 1) % SAMPLE_TESTIMONIALS.length];

  return (
    <div className="relative min-h-screen bg-[#efece6] text-[#141414] overflow-x-clip">
      {/* Architectural Vertical Hairline Guides (17%, 50%, 83%) - hidden on mobile */}
      <div
        aria-hidden="true"
        className="hidden md:block fixed inset-0 pointer-events-none z-0"
      >
        <div
          className="absolute top-0 bottom-0 w-px bg-[#141414]/[0.08]"
          style={{ left: "17%" }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[#141414]/[0.08]"
          style={{ left: "50%" }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[#141414]/[0.08]"
          style={{ left: "83%" }}
        />
      </div>

      {/* Interactive 3D Ceramic Robot Viewport */}
      <RobotScene stage={stage} />

      {/* Top Announcement & Sticky Navigation */}
      <Navbar onNavigateSection={scrollToSection} />

      <main className="relative z-10">
        {/* ================================================================ */}
        {/* SECTION 1 — INTRO                                                */}
        {/* ================================================================ */}
        <section
          id="intro"
          ref={introRef}
          className="min-h-screen pt-32 pb-16 px-4 md:px-8 max-w-[1380px] mx-auto flex flex-col justify-between"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-4">
            {/* Left Content Column (Leaves Right Column Open for 3D Robot) */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-5">
                <p className="font-mono-tech text-xs tracking-[0.14em] text-[#141414]/60">
                  UNLEASH THE POWER OF AI CODE REVIEW
                </p>

                <h1 className="flex flex-col items-start gap-3 text-[clamp(2.75rem,6vw,5.25rem)] font-bold tracking-[-0.03em] leading-[0.95] text-[#141414]">
                  <span className="nova-outline-box">Thinking</span>
                  <span className="nova-outline-box">Machines</span>
                </h1>

                <p className="max-w-xl text-base md:text-lg leading-relaxed text-[#141414]/75">
                  Your intelligent coding companion. Detect bugs, understand
                  vulnerabilities, and write better code with AI.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    to={primaryCtaTarget}
                    className="nova-btn-gradient px-6 py-3 rounded-lg text-sm font-semibold whitespace-nowrap inline-flex items-center gap-2"
                  >
                    <span>Start Reviewing</span>
                    <ArrowRight className="w-4 h-4 text-[#ffb347]" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollToSection("product")}
                    className="nova-btn-outline px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer"
                  >
                    Explore Features
                  </button>
                </div>
              </div>

              {/* Animated Prompt Box */}
              <div className="max-w-lg rounded-xl border border-[#141414]/15 bg-[#efece6]/90 p-4 shadow-[0_12px_32px_-20px_rgba(20,20,20,0.28)]">
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#141414]/10">
                  <span className="font-mono-tech text-[11px] tracking-[0.08em] text-[#141414]/55">
                    PROMPT INTERFACE
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(primaryCtaTarget, {
                        state: {
                          suggestedLanguage:
                            ANIMATED_PROMPTS[promptIdx].language,
                        },
                      })
                    }
                    className="font-mono-tech text-[11px] text-[#141414]/75 hover:text-[#141414] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Try in Studio</span>
                    <ArrowUpRight className="w-3 h-3 text-[#ff5a5f]" />
                  </button>
                </div>

                <div className="pt-3 min-h-[52px] flex items-center">
                  <p className="font-mono-tech text-sm md:text-[15px] text-[#141414] leading-snug">
                    <span>{typedText}</span>
                    <span
                      aria-hidden="true"
                      className="inline-block w-2 h-4 ml-1 align-middle brand-gradient-bg animate-caret"
                    />
                  </p>
                </div>
              </div>

              {/* Feature List (4 rows with thin dividers and clean static circular indicators) */}
              <div className="max-w-lg border-t border-[#141414]/15">
                {[
                  "BUG DETECTION",
                  "SECURITY ANALYSIS",
                  "PERFORMANCE OPTIMIZATION",
                  "BEGINNER-FRIENDLY EXPLANATIONS",
                ].map((label) => (
                  <div
                    key={label}
                    className="py-3 border-b border-[#141414]/12 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full border border-[#141414]/45 bg-[#ff8a3d]/35 shrink-0"
                      />
                      <span className="font-mono-tech text-xs tracking-[0.1em] text-[#141414]/85">
                        {label}
                      </span>
                    </div>
                    <span className="font-mono-tech text-[11px] text-[#141414]/45">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Spacer preserving unobstructed view of the 3D Ceramic Robot */}
            <div className="hidden lg:block lg:col-span-5 min-h-[420px]" />
          </div>

          {/* Bottom Intro Footer Row */}
          <div className="pt-12 border-t border-[#141414]/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-base md:text-lg font-medium tracking-tight text-[#141414]/85">
              Your code deserves a second opinion.
            </p>
            <button
              type="button"
              onClick={() => scrollToSection("product")}
              className="font-mono-tech text-xs tracking-[0.14em] text-[#141414]/65 hover:text-[#141414] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>SCROLL</span>
              <ArrowDown className="w-3.5 h-3.5 animate-scroll-arrow" />
            </button>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 2 — PRODUCT                                              */}
        {/* ================================================================ */}
        <section
          id="product"
          ref={productRef}
          className="pt-20 pb-24 border-t border-[#141414]/12"
        >
          {/* Auto-Moving 10-Tab Feature Carousel */}
          <div className="max-w-[1380px] mx-auto px-4 md:px-8 mb-6 flex items-center justify-between gap-4">
            <p className="font-mono-tech text-xs tracking-[0.12em] text-[#141414]/60">
              CAPABILITY INDEX · {CAROUSEL_TABS[activeTab].num} / 10
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous capability"
                onClick={() =>
                  handleSelectTab(
                    (activeTab - 1 + CAROUSEL_TABS.length) %
                      CAROUSEL_TABS.length
                  )
                }
                className="w-9 h-9 rounded-lg border border-[#141414]/18 bg-[#efece6]/90 hover:border-[#141414] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next capability"
                onClick={() =>
                  handleSelectTab((activeTab + 1) % CAROUSEL_TABS.length)
                }
                className="w-9 h-9 rounded-lg border border-[#141414]/18 bg-[#efece6]/90 hover:border-[#141414] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-hidden border-y border-[#141414]/12 bg-[#efece6]/78 py-5">
            <div
              className="flex transition-transform duration-500 ease-out px-4 md:px-8 gap-4"
              style={{
                transform: `translateX(-${Math.min(activeTab, CAROUSEL_TABS.length - 1) * 18}%)`,
              }}
            >
              {CAROUSEL_TABS.map((tab, idx) => {
                const isActive = idx === activeTab;
                return (
                  <button
                    key={`${tab.num}-${tab.title}-${idx}`}
                    type="button"
                    onClick={() => handleSelectTab(idx)}
                    className={`relative w-[72vw] sm:w-[44vw] md:w-[33vw] shrink-0 text-left px-5 py-4 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#efece6] border border-[#141414]/65 shadow-[0_8px_24px_-16px_rgba(20,20,20,0.3)]"
                        : "bg-[#efece6]/65 border border-[#141414]/12 hover:border-[#141414]/35"
                    }`}
                  >
                    {/* Small architectural corner brackets */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${
                        isActive ? "border-[#ff5a5f]" : "border-[#141414]/25"
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${
                        isActive ? "border-[#ff5a5f]" : "border-[#141414]/25"
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${
                        isActive ? "border-[#ff5a5f]" : "border-[#141414]/25"
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${
                        isActive ? "border-[#ff5a5f]" : "border-[#141414]/25"
                      }`}
                    />

                    <div className="flex items-center gap-4">
                      <span
                        className={`font-mono-tech text-xs px-2 py-1 border ${
                          isActive
                            ? "border-[#ff8a3d] text-[#141414] font-semibold"
                            : "border-[#141414]/15 text-[#141414]/55"
                        }`}
                      >
                        {tab.num}
                      </span>
                      <span className="text-sm md:text-base font-semibold tracking-tight text-[#141414] truncate">
                        {tab.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2 Headline + Robot Head Focal Space */}
          <div className="max-w-[1380px] mx-auto px-4 md:px-8 pt-20 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-5">
              <p className="font-mono-tech text-xs tracking-[0.14em] text-[#141414]/60">
                SEMANTIC STATIC &amp; SECURITY ENGINE
              </p>
              <h2 className="flex flex-col items-start gap-3 text-[clamp(2.25rem,5vw,4.25rem)] font-bold tracking-[-0.03em] leading-[0.98] text-[#141414]">
                <span className="nova-outline-box">Your Gateway</span>
                <span className="nova-outline-box">To Better Code</span>
              </h2>
              <p className="max-w-xl text-base text-[#141414]/75 leading-relaxed">
                Inspect syntax, security risks, and algorithmic bottlenecks in
                one unified workspace—paired with clear explanations built for
                growing engineers.
              </p>
            </div>
            <div className="hidden lg:block lg:col-span-5 min-h-[240px]" />
          </div>

          {/* Realistic Application Preview Workbench */}
          <div
            id="preview-workbench"
            className="max-w-[1380px] mx-auto px-4 md:px-8"
          >
            <div className="rounded-2xl bg-[#080b14] text-[#f5f7ff] border border-[#141414]/20 shadow-[0_32px_80px_-28px_rgba(8,11,20,0.65)] overflow-hidden">
              {/* Preview Top Bar */}
              <div className="px-5 py-3.5 border-b border-white/10 bg-[#101522] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono-tech text-xs text-[#929bb0]">
                    CodeSense Studio Preview
                  </span>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#080b14] border border-white/10">
                    {PREVIEW_SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => setPreviewSampleId(sample.id)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          previewSampleId === sample.id
                            ? "bg-[#141b2b] text-[#f5f7ff]"
                            : "text-[#929bb0] hover:text-[#f5f7ff]"
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewAnalyze}
                    className="px-4 py-1.5 rounded-lg bg-[#4f8cff] hover:bg-[#3f7cf0] text-xs font-mono-tech font-medium text-white transition-colors cursor-pointer"
                  >
                    {previewScanning ? "ANALYZING..." : "ANALYZE CODE"}
                  </button>
                  <Link
                    to={primaryCtaTarget}
                    className="px-3.5 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-xs font-medium text-[#f5f7ff] transition-colors whitespace-nowrap"
                  >
                    Open Full Studio
                  </Link>
                </div>
              </div>

              {/* Preview Split Workspace (58% Editor / 42% Report) */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Left: Realistic Code Editor Preview */}
                <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0c101b] p-5">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/8 text-xs font-mono-tech text-[#929bb0]">
                    <span>submission.{activePreview.id === "python" ? "py" : "js"}</span>
                    <span>{activePreview.codeLines.length} lines</span>
                  </div>
                  <pre className="font-mono-tech text-xs md:text-[13px] leading-6 overflow-x-auto text-[#e5ebff]">
                    {activePreview.codeLines.map((line, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="w-5 text-right text-[#929bb0]/50 select-none">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>

                  {/* Improved Code Panel Preview */}
                  <div className="mt-6 rounded-xl bg-[#141b2b] border border-[#40d99b]/35 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#40d99b]/20 bg-[#40d99b]/[0.06] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#40d99b]">
                        Improved Code Suggestion
                      </span>
                      <span className="font-mono-tech text-[11px] text-[#929bb0]">
                        {activePreview.label}
                      </span>
                    </div>
                    <pre className="p-4 font-mono-tech text-xs leading-6 overflow-x-auto text-[#d9fcef]">
                      {activePreview.improvedLines.map((line, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="w-5 text-right text-[#40d99b]/50 select-none">
                            {i + 1}
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>

                {/* Right: Realistic Review Report Preview */}
                <div className="lg:col-span-5 bg-[#080b14] p-5 space-y-4">
                  <div className="rounded-xl bg-[#141b2b] border border-white/10 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono-tech text-[11px] text-[#929bb0]">
                        Quality Score
                      </p>
                      <p className="text-2xl font-bold text-[#f5f7ff] tabular-nums mt-0.5">
                        {activePreview.score}{" "}
                        <span className="text-xs font-normal text-[#929bb0]">
                          / 100
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono-tech tabular-nums">
                      <span className="text-[#ff5b65]">1 Bug</span>
                      <span className="text-[#ffbd4a]">
                        {activePreview.id === "python" ? "1 Security" : "0 Security"}
                      </span>
                      <span className="text-[#54a6ff]">
                        {activePreview.id === "javascript" ? "1 Perf" : "0 Perf"}
                      </span>
                    </div>
                  </div>

                  {activePreview.findings.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl bg-[#141b2b] border border-white/10 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono-tech">
                        <span style={{ color: item.tone }}>{item.category}</span>
                        <span className="text-[#929bb0]">{item.line}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#f5f7ff]">
                        {item.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-[#929bb0]">
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6 Feature Cards */}
          <div className="max-w-[1380px] mx-auto px-4 md:px-8 pt-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURE_CARDS.map((card) => {
                const Icon = card.Icon;
                return (
                  <div
                    key={card.num}
                    className="rounded-xl bg-[#efece6]/92 border border-[#141414]/14 p-6 flex flex-col justify-between gap-5 hover:border-[#141414]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tech text-xs text-[#141414]/55">
                        {card.num}
                      </span>
                      <Icon className="w-4 h-4 text-[#ff5a5f]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight text-[#141414]">
                        {card.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#141414]/70">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3 — REVIEWS                                              */}
        {/* ================================================================ */}
        <section
          id="reviews"
          ref={reviewsRef}
          className="min-h-[82vh] py-24 px-4 md:px-8 border-t border-[#141414]/12 max-w-[1380px] mx-auto flex flex-col justify-center"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 rounded-2xl bg-[#efece6]/92 border border-[#141414]/15 p-7 md:p-10 space-y-8 shadow-[0_24px_60px_-34px_rgba(20,20,20,0.3)]">
              {/* Header: TSTMNL, Review number, Avatar, Name, Role */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#141414]/12">
                <div className="flex items-center gap-3 font-mono-tech text-xs tracking-[0.12em] text-[#141414]/65">
                  <span>TSTMNL</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {currentReview.number} / 0{SAMPLE_TESTIMONIALS.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous testimonial"
                    onClick={() =>
                      setReviewIndex(
                        (prev) =>
                          (prev - 1 + SAMPLE_TESTIMONIALS.length) %
                          SAMPLE_TESTIMONIALS.length
                      )
                    }
                    className="w-9 h-9 rounded-lg border border-[#141414]/18 hover:border-[#141414] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next testimonial"
                    onClick={() =>
                      setReviewIndex(
                        (prev) => (prev + 1) % SAMPLE_TESTIMONIALS.length
                      )
                    }
                    className="w-9 h-9 rounded-lg border border-[#141414]/18 hover:border-[#141414] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Testimonial Body */}
              <div className="min-h-[210px] flex flex-col justify-between gap-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentReview.number}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-6"
                  >
                    <blockquote className="text-xl md:text-3xl font-semibold tracking-tight leading-snug text-[#141414]">
                      “{currentReview.quote}”
                    </blockquote>

                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#141414] text-[#efece6] flex items-center justify-center font-mono-tech text-xs font-semibold shrink-0">
                        {currentReview.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#141414]">
                          {currentReview.name}
                        </p>
                        <p className="font-mono-tech text-xs text-[#141414]/60">
                          {currentReview.role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next Review Preview */}
              <div className="pt-5 border-t border-[#141414]/10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono-tech text-[11px] text-[#141414]/45">
                    UP NEXT · {nextReview.number}
                  </p>
                  <p className="text-sm text-[#141414]/55 truncate mt-0.5">
                    “{nextReview.quote}”
                  </p>
                </div>
                <Link
                  to={primaryCtaTarget}
                  className="nova-btn-gradient px-4 py-2.5 rounded-lg text-xs font-mono-tech whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb347]" />
                  <span>Start Reviewing</span>
                </Link>
              </div>
            </div>

            {/* Right Column Open for Robot Face Quotation Mark */}
            <div className="hidden lg:block lg:col-span-5 min-h-[380px]" />
          </div>
        </section>
      </main>

      <Footer onNavigateSection={scrollToSection} />
    </div>
  );
}
