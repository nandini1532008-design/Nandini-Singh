import { X } from "lucide-react";
import { useState } from "react";

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
}

type InfoTopic = "about" | "github" | "contact" | "privacy" | "terms" | null;

const TOPIC_CONTENT: Record<
  Exclude<InfoTopic, null>,
  { title: string; body: string }
> = {
  about: {
    title: "About CodeSense AI",
    body: "CodeSense AI pairs procedural 3D visual craft with server-side Gemini code analysis to help developers spot bugs, security risks, and performance bottlenecks while learning why each improvement matters.",
  },
  github: {
    title: "Repository & Stack",
    body: "Built with React, TypeScript, Monaco Editor, Three.js 0.160.0, Express, Mongoose, JWT authentication, and Google Gemini structured JSON analysis.",
  },
  contact: {
    title: "Contact",
    body: "Name: NANDINI SINGH — Email: eng25cs0623@dsu.edu.in. Reach out with any questions about CodeSense AI or launch the review studio to analyze your code.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "Submitted code snippets are transmitted over authenticated requests to the backend review service for analysis and stored under your private user account history. Only the account owner can view or delete saved reviews.",
  },
  terms: {
    title: "Terms of Use",
    body: "CodeSense AI provides educational static and AI-assisted code review suggestions. Always review, test, and verify suggested code changes before deploying them to production environments.",
  },
};

export function Footer({ onNavigateSection }: FooterProps) {
  const [activeTopic, setActiveTopic] = useState<InfoTopic>(null);

  return (
    <footer className="relative z-20 border-t border-[#141414]/12 bg-[#efece6]">
      <div className="max-w-[1380px] mx-auto px-4 md:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[#141414]/70">
          CODESENSE AI · 2026
        </p>

        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono-tech text-xs text-[#141414]/70"
        >
          <button
            type="button"
            onClick={() => setActiveTopic("about")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection("product")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => setActiveTopic("github")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => setActiveTopic("contact")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTopic("privacy")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveTopic("terms")}
            className="hover:text-[#141414] hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            Terms
          </button>
        </nav>
      </div>

      <div className="max-w-[1380px] mx-auto px-4 md:px-8 pb-10 pt-2">
        <div className="nova-outline-box w-full !flex flex-col sm:flex-row sm:items-center justify-between gap-4 !p-5 md:!p-6 !rounded-2xl">
          <div className="space-y-1">
            <span className="block font-mono-tech text-xs tracking-[0.12em] text-[#141414]/60">
              CONTACT DETAILS
            </span>
            <p className="text-xl md:text-2xl font-bold tracking-tight text-[#141414]">
              NANDINI SINGH
            </p>
          </div>

          <a
            href="mailto:eng25cs0623@dsu.edu.in"
            className="nova-btn-gradient px-5 py-3 rounded-xl font-mono-tech text-sm md:text-base font-semibold tracking-tight inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="brand-gradient-text">eng25cs0623@dsu.edu.in</span>
          </a>
        </div>
      </div>

      {activeTopic && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/45 p-4"
          onClick={() => setActiveTopic(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-[#efece6] border border-[#141414]/15 p-6 shadow-2xl text-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#141414]/10">
              <h3
                id="footer-dialog-title"
                className="text-lg font-semibold tracking-tight"
              >
                {TOPIC_CONTENT[activeTopic].title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-[#141414]/8 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#141414]/75">
              {TOPIC_CONTENT[activeTopic].body}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="px-4 py-2 rounded-lg bg-[#141414] text-[#efece6] text-xs font-mono-tech cursor-pointer hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
