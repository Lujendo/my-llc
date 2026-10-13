import React, { useState } from "react";
import { Button, Alert } from "./UI";
import type { User } from "../types";

interface AuthFormsProps {
  onSignup: (email: string, password: string, name: string, citizenship: string, residency: string) => Promise<User>;
  onLogin: (email: string, password: string) => Promise<User>;
  onAuthSuccess: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onSignup, onLogin, onAuthSuccess }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [residency, setResidency] = useState("");
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
        await onSignup(email, password, name, citizenship, residency);
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
          Tax compliance for foreign LLC owners
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
            </>
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
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

        {/* Test Account Info */}
        {mode === "login" && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-400 mb-2">TEST ACCOUNT (MVP)</p>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Email: <code>test@example.com</code>
              <br />
              Password: <code>test123</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
