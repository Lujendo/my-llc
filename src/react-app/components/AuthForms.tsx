import React, { useState } from "react";
import { Button, Alert } from "./UI";
import { LegalCopy } from "./LegalCopy";
import { SIGNUP_CONSENT_COPY, SIGNUP_ATTESTATION_COPY, TERMS_VERSION, PRIVACY_VERSION, type SignupConsent } from "../lib/legal";
import type { User } from "../types";

interface AuthFormsProps {
  onSignup: (
    email: string,
    password: string,
    name: string,
    citizenship: string,
    residency: string,
    consent: SignupConsent
  ) => Promise<User>;
  onLogin: (email: string, password: string) => Promise<User>;
  onAuthSuccess: () => void;
  onOpenLegal: (view: "terms" | "privacy") => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onSignup, onLogin, onAuthSuccess, onOpenLegal }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [residency, setResidency] = useState("");
  const [consent, setConsent] = useState(false);
  const [attestation, setAttestation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (!name || !citizenship || !residency) {
          throw new Error("Please fill in all fields");
        }
        // Legal/trust boundary: account creation requires explicit consent.
        if (!consent) {
          throw new Error(
            "You must accept the Terms of Service and Privacy Policy to create an account."
          );
        }
        if (!attestation) {
          throw new Error("You must confirm you are at least 18 years old to create an account.");
        }
        const consentRecord: SignupConsent = {
          acceptedTerms: true,
          acceptedPrivacy: true,
          attestedAdult: true,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
          timestamp: new Date().toISOString(),
        };
        await onSignup(email, password, name, citizenship, residency, consentRecord);
      } else {
        await onLogin(email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">MY-LLC</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Organize your US LLC filings
        </p>

        {/* Error Alert */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Andrea Lujendo"
                  required
                />
              </div>

              <div>
                <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Citizenship
                </label>
                <select
                  id="citizenship"
                  value={citizenship}
                  onChange={(e) => setCitizenship(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">Select Citizenship</option>
                  <option value="Italy">Italy</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Spain">Spain</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="residency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Residency
                </label>
                <select
                  id="residency"
                  value={residency}
                  onChange={(e) => setResidency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">Select Residency</option>
                  <option value="Germany">Germany</option>
                  <option value="Italy">Italy</option>
                  <option value="France">France</option>
                  <option value="Spain">Spain</option>
                  <option value="UK">United Kingdom</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Verbatim signup consent from content/legal/REVIEW-CHECKBOX-COPY.md §6.
                  Not pre-ticked; the Sign Up button stays disabled until ticked. */}
              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <LegalCopy text={SIGNUP_CONSENT_COPY} onOpenLegal={onOpenLegal} />
                </span>
              </label>

              {/* 18+/capacity attestation — same source file, §6. Not pre-ticked. */}
              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={attestation}
                  onChange={(e) => setAttestation(e.target.checked)}
                  className="mt-1"
                />
                <span>{SIGNUP_ATTESTATION_COPY}</span>
              </label>
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={mode === "signup" && (!consent || !attestation)}
            className="w-full"
          >
            {mode === "login" ? "Log In" : "Sign Up"}
          </Button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};
