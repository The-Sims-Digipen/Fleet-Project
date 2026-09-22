import { useState } from "react";

export function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Very lightweight syntax highlighting via regex replacements on escaped HTML
  function highlight(src: string): string {
    const esc = src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return esc
      // JSX tags
      .replace(/(&lt;\/?)([\w.]+)/g, '$1<span class="syn-tag">$2</span>')
      // Props / attributes
      .replace(/\s([\w-]+)=/g, ' <span class="syn-attr">$1</span>=')
      // Strings (after escaping)
      .replace(/&quot;([^&]*)&quot;/g, '&quot;<span class="syn-str">$1</span>&quot;')
      .replace(/&#39;([^&]*)&#39;/g, "&#39;<span class=\"syn-str\">$1</span>&#39;")
      .replace(/"([^"<]*)"/g, '"<span class="syn-str">$1</span>"')
      // Keywords
      .replace(/\b(import|export|from|const|let|function|return|type|true|false|null|undefined)\b/g,
        '<span class="syn-kw">$1</span>')
      // Comments
      .replace(/(\/\/[^\n]*)/g, '<span class="syn-comment">$1</span>');
  }

  return (
    <div className="w-full overflow-hidden rounded-[8px] bg-chargedup-night">
      {/* Language + copy bar */}
      <div className="flex items-center justify-between border-b border-chargedup-white/10 px-4 py-2">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-chargedup-white/35">
          {language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 font-body text-xs text-chargedup-white/50 transition-colors hover:bg-chargedup-white/10 hover:text-chargedup-white"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#e8ba44" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-chargedup-gold">Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
                <path d="M1 4v6a1.5 1.5 0 001.5 1.5h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/*
        Scroll container — overflow-x-auto enables horizontal scrolling for long lines.
        max-h-[360px] + overflow-y-auto prevents very long snippets from pushing the page.
        The inner <pre> must NOT have overflow itself so the scroll happens at this level.
      */}
      <div className="overflow-x-auto overflow-y-auto max-h-[360px] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
        <pre className="p-4 text-[0.82rem] leading-6 text-chargedup-white/85 whitespace-pre">
          <code
            className="font-mono"
            dangerouslySetInnerHTML={{ __html: highlight(code) }}
          />
        </pre>
      </div>
      <style>{`
        .syn-tag  { color: #79d4ff; }
        .syn-attr { color: #e8ba44; }
        .syn-str  { color: #98d08a; }
        .syn-kw   { color: #c792ea; }
        .syn-comment { color: rgba(255,255,255,0.35); font-style: italic; }
      `}</style>
    </div>
  );
}
