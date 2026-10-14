import React, { useState } from "react";
import { Button } from "./UI";
import { COOKIE_BANNER_COPY } from "../lib/legal";

const KEY = "cookie_consent_v1";

interface Consent {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
}

const read = (): Consent | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
};

interface CookieConsentProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

// Verbatim banner copy from content/legal/REVIEW-CHECKBOX-COPY.md §5.
// Accept and Reject are equal-prominence buttons — no dark pattern.
export const CookieConsent: React.FC<CookieConsentProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [consent, setConsent] = useState<Consent | null>(read);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!forceOpen && consent?.decided) return null;
  const showSettings = settings || forceOpen;

  const decide = (a: boolean, m: boolean) => {
    const next: Consent = { essential: true, analytics: a, marketing: m, decided: true };
    localStorage.setItem(KEY, JSON.stringify(next));
    setConsent(next);
    setSettings(false);
    onClose?.();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {showSettings ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Cookie settings
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked disabled /> Strictly necessary (always on)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />{" "}
              Analytics
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />{" "}
              Marketing
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => decide(analytics, marketing)}>
                Save choices
              </Button>
              <Button
                variant="secondary"
                onClick={() => (forceOpen ? onClose?.() : setSettings(false))}
              >
                {forceOpen ? "Close" : "Cancel"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
              {COOKIE_BANNER_COPY}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => decide(true, true)}>
                Accept all
              </Button>
              {/* Equal prominence with "Accept all" — no dark pattern (GDPR/ePrivacy). */}
              <Button variant="primary" onClick={() => decide(false, false)}>
                Reject non-essential
              </Button>
              <button
                onClick={() => setSettings(true)}
                className="text-sm text-blue-600 dark:text-blue-400 underline px-2"
              >
                Cookie settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
