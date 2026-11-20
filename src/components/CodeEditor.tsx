import Editor from "@monaco-editor/react";
import { Check, Copy, Sparkles, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { LANGUAGE_OPTIONS, type SupportedLanguage } from "../types/review";

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChangeCode?: (value: string) => void;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  readOnly?: boolean;
  height?: number;
  onChangeHeight?: (h: number) => void;
  title?: string;
}

export function CodeEditor({
  code,
  language,
  onChangeCode,
  onChangeLanguage,
  readOnly = false,
  height = 520,
  onChangeHeight,
  title = "Code Input",
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<unknown>(null);

  const selectedLang =
    LANGUAGE_OPTIONS.find((l) => l.value === language) || LANGUAGE_OPTIONS[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const handleFormat = () => {
    const ed = editorRef.current as
      | { getAction?: (id: string) => { run?: () => void } | null }
      | null;
    ed?.getAction?.("editor.action.formatDocument")?.run?.();
  };

  const charCount = code.length;
  const isOverLimit = charCount > 10000;

  return (
    <div className="rounded-xl bg-[#101522] border border-white/10 overflow-hidden flex flex-col">
      {/* Editor Toolbar */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#141b2b] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono-tech text-[#929bb0]">{title}</span>
          {!readOnly && onChangeLanguage ? (
            <select
              aria-label="Programming language"
              value={language}
              onChange={(e) =>
                onChangeLanguage(e.target.value as SupportedLanguage)
              }
              className="bg-[#080b14] text-[#f5f7ff] text-xs font-medium rounded-lg border border-white/15 px-3 py-1.5 focus:outline-none focus:border-[#4f8cff] cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium text-[#f5f7ff]">
              {selectedLang.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && onChangeHeight && (
            <div className="hidden sm:flex items-center gap-1 rounded-lg bg-[#080b14] p-0.5 border border-white/10">
              {[420, 520, 640].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChangeHeight(h)}
                  className={`px-2 py-1 text-[11px] font-mono-tech rounded-md transition-colors cursor-pointer ${
                    height === h
                      ? "bg-[#141b2b] text-[#f5f7ff]"
                      : "text-[#929bb0] hover:text-[#f5f7ff]"
                  }`}
                >
                  {h}px
                </button>
              ))}
            </div>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={handleFormat}
              className="px-2.5 py-1.5 rounded-lg bg-[#080b14] border border-white/10 text-xs text-[#929bb0] hover:text-[#f5f7ff] hover:border-white/25 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Format code"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-[#080b14] border border-white/10 text-xs text-[#929bb0] hover:text-[#f5f7ff] hover:border-white/25 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#40d99b]" />
                <span className="text-[#40d99b]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {!readOnly && onChangeCode && (
            <button
              type="button"
              onClick={() => onChangeCode("")}
              className="px-2.5 py-1.5 rounded-lg bg-[#080b14] border border-white/10 text-xs text-[#929bb0] hover:text-[#ff5b65] hover:border-[#ff5b65]/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Clear editor"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Surface */}
      <div style={{ height }} className="w-full bg-[#0c101b]">
        <Editor
          height={`${height}px`}
          language={selectedLang.monacoId}
          value={code}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          onChange={(val) => {
            if (!readOnly && onChangeCode) {
              onChangeCode(val ?? "");
            }
          }}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13.5,
            lineHeight: 22,
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            padding: { top: 14, bottom: 14 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer Info Bar */}
      {!readOnly && (
        <div className="px-4 py-2 border-t border-white/8 bg-[#101522] flex items-center justify-between text-xs font-mono-tech">
          <span className="text-[#929bb0]">
            {code.split("\n").length} lines
          </span>
          <span
            className={isOverLimit ? "text-[#ff5b65] font-medium" : "text-[#929bb0]"}
          >
            {charCount.toLocaleString()} / 10,000 chars
          </span>
        </div>
      )}
    </div>
  );
}
