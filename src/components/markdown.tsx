"use client";
import { remark } from "remark";
import html from "remark-html";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactElement } from "react";
import { twMerge } from "tailwind-merge";

type MarkdownProps = {
  text: string;
  onTimeClick?: (time: string) => void;
  className?: string;
};

export function Markdown({ text, onTimeClick, className = "" }: MarkdownProps) {
  const [processedContent, setProcessedContent] = useState<ReactElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const processMarkdown = useMemo(() => {
    return async (markdownText: string) => {
      try {
        setIsLoading(true);
        const result = await remark().use(html, { sanitize: true }).process(markdownText);
        return result.toString();
      } catch (error) {
        console.error("Error processing markdown:", error);
        return markdownText; // Fallback to raw text if processing fails
      } finally {
        setIsLoading(false);
      }
    };
  }, []);

  const processTimeStamps = useCallback(
    (htmlContent: string) => {
      if (!onTimeClick) {
        return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
      }

      // Replace timestamps in the HTML content with clickable spans
      const processedHtml = htmlContent.replace(/(\(?(\d{1,2}:\d{2}:\d{2})\)?)/g, (match, fullMatch, timeOnly) => {
        return `<span class="${twMerge(
          "timestamp-button font-semibold cursor-pointer",
          "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        )}" data-time="${timeOnly}">${fullMatch}</span>`;
      });

      return (
        <div
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          onClick={e => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("timestamp-button")) {
              const time = target.getAttribute("data-time");
              if (time) {
                onTimeClick(time);
              }
            }
          }}
        />
      );
    },
    [onTimeClick]
  );

  useEffect(() => {
    processMarkdown(text).then(htmlContent => {
      const content = processTimeStamps(htmlContent);
      setProcessedContent(content);
    });
  }, [text, processMarkdown, processTimeStamps]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        `prose text-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:pl-4 prose-blockquote:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300`,
        className
      )}
    >
      {processedContent}
    </div>
  );
}
