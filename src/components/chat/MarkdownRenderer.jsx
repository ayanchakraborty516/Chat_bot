import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

/**
 * Remove redundant empty fenced code blocks (e.g. ```javascript\n```) that
 * sometimes precede actual code blocks in streaming or AI completions.
 * @param {string} text
 * @returns {string}
 */
export function cleanMarkdownContent(text) {
  if (!text) return '';
  return text.replace(/```[a-zA-Z0-9_#-]*[ \t]*\r?\n[ \t\r\n]*```(\r?\n)?/g, '');
}

export function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  const sanitizedContent = cleanMarkdownContent(content);
  if (!sanitizedContent) return null;

  return (
    <div className="prose-custom text-gray-800 dark:text-gray-200 max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            if (!children) return null;
            return <>{children}</>;
          },
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children || '').replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n') || className)) {
              // Skip rendering empty code blocks
              if (!codeString.trim()) {
                return null;
              }
              return (
                <CodeBlock
                  language={match ? match[1] : 'text'}
                  value={codeString}
                />
              );
            }

            if (!codeString.trim()) {
              return null;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md font-mono text-[13px] bg-gray-100 dark:bg-gray-800/80 text-brand-600 dark:text-brand-300 border border-gray-200/60 dark:border-gray-700/50"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-surface-dark-border">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-surface-dark-border">
                  {children}
                </table>
              </div>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
