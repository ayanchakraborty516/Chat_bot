import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
// Common prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/helpers';

export function CodeBlock({ language = 'text', value = '' }) {
  const [copied, setCopied] = useState(false);
  const cleanLang = (language || 'text').toLowerCase();

  useEffect(() => {
    // Run Prism highlight on this block
    if (value && value.trim()) {
      Prism.highlightAll();
    }
  }, [value, cleanLang]);

  // Avoid rendering empty code block boxes
  if (!value || !value.trim()) {
    return null;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe syntax highlight fallback
  const getHighlightedHtml = () => {
    const grammar = Prism.languages[cleanLang] || Prism.languages.text || Prism.languages.markup;
    try {
      return Prism.highlight(value, grammar, cleanLang);
    } catch {
      return value;
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-gray-200 dark:border-surface-dark-border bg-gray-900 text-gray-100 overflow-hidden text-xs shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-950/80 border-b border-gray-800 text-gray-400 select-none">
        <span className="font-mono text-xs uppercase tracking-wider font-semibold text-gray-300">
          {cleanLang}
        </span>

        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with inner horizontal scroll only */}
      <div className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <pre className="!bg-transparent !p-0 !m-0">
          <code
            className={`language-${cleanLang}`}
            dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
          />
        </pre>
      </div>
    </div>
  );
}

export default CodeBlock;
