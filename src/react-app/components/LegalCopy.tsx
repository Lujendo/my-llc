import React from "react";

interface LegalCopyProps {
  text: string;
  onOpenLegal?: (view: "terms" | "privacy") => void;
}

// Renders the verbatim legal strings from lib/legal.ts, turning `**bold**` into
// <strong> and the [Terms of Service] / [Privacy Policy] markers into real links.
// Real hrefs so right-click / open-in-new-tab work; onClick keeps in-app nav when
// a handler is supplied (App also reads the pathname on load).
export const LegalCopy: React.FC<LegalCopyProps> = ({ text, onOpenLegal }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\[Terms of Service\]|\[Privacy Policy\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "[Terms of Service]") {
          return (
            <a
              key={i}
              href="/terms"
              onClick={(e) => {
                if (onOpenLegal) {
                  e.preventDefault();
                  onOpenLegal("terms");
                }
              }}
              className="text-blue-600 dark:text-blue-400 underline"
            >
              Terms of Service
            </a>
          );
        }
        if (part === "[Privacy Policy]") {
          return (
            <a
              key={i}
              href="/privacy"
              onClick={(e) => {
                if (onOpenLegal) {
                  e.preventDefault();
                  onOpenLegal("privacy");
                }
              }}
              className="text-blue-600 dark:text-blue-400 underline"
            >
              Privacy Policy
            </a>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};
