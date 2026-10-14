import React, { useState } from "react";
import type { Entity } from "../types";
import { Card, Button, Badge, Alert } from "./UI";
import { GLOBAL_TAX_DISCLAIMER, REVIEW_CHECKBOX_LABEL, REVIEW_CHECKBOX_SUPPORT, DISCLAIMER_VERSION } from "../lib/w7";
import { buildTreatyMemo, TREATY_MEMO_DISCLAIMER } from "../lib/treaty";
import { logDocAcceptance } from "../lib/acceptance";

interface TreatyAnalyzerProps {
  entity: Entity | null;
  user: any;
}

export const TreatyAnalyzer: React.FC<TreatyAnalyzerProps> = ({ entity, user }) => {
  const [answers, setAnswers] = useState({
    disregarded: true,
    hasIncome: false,
    foreignAccounts: false,
  });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [memoAck, setMemoAck] = useState(false);

  // ponytail: simplified treaty analysis for MVP, full logic implemented in backend
  const riskLevel = answers.hasIncome ? "high" : "low";

  const handleAnalyze = () => {
    setShowAnalysis(true);
  };

  const onMemoAckToggle = (checked: boolean) => {
    setMemoAck(checked);
    if (checked) {
      logDocAcceptance({
        documentType: "treaty_memo",
        documentVersion: DISCLAIMER_VERSION,
        acceptedAt: new Date().toISOString(),
        event: "ticked",
        form: "Treaty Memo",
        userId: user?.id ?? null,
      });
    }
  };

  const downloadMemo = () => {
    const { filename, text } = buildTreatyMemo({
      taxpayer: user?.name ?? "",
      entity: entity?.name ?? "",
      citizenship: user?.citizenship ?? "",
      residency: user?.residency ?? "",
      membersCount: entity?.membersCount ?? 1,
      disregarded: answers.disregarded,
      hasIncome: answers.hasIncome,
      foreignAccounts: answers.foreignAccounts,
      riskLevel: riskLevel,
    });
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logDocAcceptance({
      documentType: "treaty_memo",
      documentVersion: DISCLAIMER_VERSION,
      acceptedAt: new Date().toISOString(),
      event: "downloaded",
      form: "Treaty Memo",
      userId: user?.id ?? null,
    });
  };

  if (!entity || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to analyze treaties</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Treaty Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze double taxation risks for {user.name}
        </p>
      </div>

      {/* Questionnaire */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Entity Structure Questionnaire</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Is this a disregarded entity (single-member LLC taxed as sole proprietorship)?
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={answers.disregarded}
                  onChange={() => setAnswers({ ...answers, disregarded: true })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Yes (transparent)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!answers.disregarded}
                  onChange={() => setAnswers({ ...answers, disregarded: false })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">No (C-corp or other)</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Did the LLC generate income in 2025?
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={answers.hasIncome}
                  onChange={() => setAnswers({ ...answers, hasIncome: true })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!answers.hasIncome}
                  onChange={() => setAnswers({ ...answers, hasIncome: false })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Do you have foreign bank accounts or assets over $10k?
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={answers.foreignAccounts}
                  onChange={() => setAnswers({ ...answers, foreignAccounts: true })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!answers.foreignAccounts}
                  onChange={() => setAnswers({ ...answers, foreignAccounts: false })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button variant="primary" onClick={handleAnalyze} className="w-full">
              Analyze Treaty Risk
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {showAnalysis && (
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Treaty Analysis Results</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Situation</h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>• Entity: {answers.disregarded ? "Disregarded LLC" : "C-Corp or Partnership"}</p>
                  <p>• Citizenship: {user.citizenship}</p>
                  <p>• Residency: {user.residency}</p>
                  <p>• Income Status: {answers.hasIncome ? "Active income generator" : "No income (holding/future)"}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Double Taxation Risk</h3>
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    label={riskLevel.toUpperCase()}
                    status={riskLevel === "high" ? "overdue" : "info"}
                  />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {riskLevel === "high"
                    ? "Your entity structure and income may trigger double taxation. Immediate treaty analysis required."
                    : "Your entity has low double taxation risk. Standard filing procedures apply."}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Filing Order</h3>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                  <li>File tax return with home country ({user.residency})</li>
                  <li>File US Form 1040-NR (if applicable)</li>
                  <li>File Form 1116 (Foreign Tax Credit)</li>
                  <li>File state annual reports</li>
                </ol>
              </div>

              {answers.hasIncome && (
                <Alert
                  type="warning"
                  title="Action Required"
                  message="Consult a tax advisor before filing. High-risk entities require professional guidance."
                />
              )}

              {/* Disclaimers + enforced review gate before the memo download. */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{TREATY_MEMO_DISCLAIMER}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{GLOBAL_TAX_DISCLAIMER}</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={memoAck} onChange={(e) => onMemoAckToggle(e.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{REVIEW_CHECKBOX_LABEL}</span>
                    <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">{REVIEW_CHECKBOX_SUPPORT}</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="success" className="flex-1" onClick={downloadMemo} disabled={!memoAck}>
                  Download Treaty Memo
                </Button>
                <Button variant="secondary" className="flex-1">
                  Email to Advisor
                </Button>
              </div>
              {!memoAck && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The memo download stays disabled until you tick the acknowledgment above.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
