import React from "react";
import { LegalCopy } from "./LegalCopy";
import { FOOTER_COPY } from "../lib/legal";

interface FooterProps {
  onOpenLegal: (view: "terms" | "privacy") => void;
  onOpenCookieSettings: () => void;
}

// Verbatim "not advice" footer copy from content/legal/REVIEW-CHECKBOX-COPY.md §4.
export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onOpenCookieSettings }) => (
  <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600 dark:text-gray-400">
      <p className="leading-relaxed">
        <LegalCopy text={FOOTER_COPY} onOpenLegal={onOpenLegal} />
      </p>
      <button
        onClick={onOpenCookieSettings}
        className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:underline"
      >
        Cookie settings
      </button>
    </div>
  </footer>
);
