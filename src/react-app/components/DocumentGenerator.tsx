import React, { useState } from "react";
import type { Entity } from "../types";
import { Card, Button, Modal, Alert } from "./UI";

interface DocumentGeneratorProps {
  entity: Entity | null;
  user: any;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ entity, user }) => {
  const [activeTab, setActiveTab] = useState<"w7" | "agreement" | "memo">("w7");
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    dateOfBirth: "",
    passportNumber: "",
    address: "",
  });

  if (!entity || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to generate documents</p>
      </div>
    );
  }

  // ponytail: form rendering only, actual PDF generation in backend later
  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDownloadPDF = () => {
    Alert;
    alert("PDF download feature coming soon. Integrate with backend for jsPDF generation.");
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Document Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate and download tax forms for {entity.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        {["w7", "agreement", "memo"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {tab === "w7" && "Form W-7"}
            {tab === "agreement" && "Operating Agreement"}
            {tab === "memo" && "Treaty Memo"}
          </button>
        ))}
      </div>

      {/* W-7 Form */}
      {activeTab === "w7" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Form W-7: ITIN Application</h2>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name (as it appears on passport)
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleFormChange("fullName", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth (MM/DD/YYYY)
              </label>
              <input
                type="text"
                value={formData.dateOfBirth}
                onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                placeholder="01/15/1980"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passport Number
              </label>
              <input
                type="text"
                value={formData.passportNumber}
                onChange={(e) => handleFormChange("passportNumber", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foreign Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleFormChange("address", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <Alert
              type="info"
              message="You must sign and mail Form W-7 with a copy of your passport to the IRS. You cannot file electronically without an ITIN."
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                Preview PDF
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadPDF}
                className="flex-1"
              >
                Download PDF
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Operating Agreement */}
      {activeTab === "agreement" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">LLC Operating Agreement</h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Entity Name:</strong> {entity.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Formation Date:</strong> {new Date(entity.formationDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>State:</strong> {entity.state}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Member Count:</strong> {entity.membersCount}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 h-64 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Operating Agreement Preview</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                THIS LIMITED LIABILITY COMPANY OPERATING AGREEMENT (the "Agreement") is made and entered into
                effective as of {new Date(entity.formationDate).toLocaleDateString()}, by and among:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                <strong>{user.name}</strong>, an individual (the "Member")
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                WHEREAS, the Member desires to form a limited liability company under the laws of the State of{" "}
                {entity.state}...
              </p>
            </div>

            <Alert
              type="info"
              message="This is a template. Customize as needed and have it reviewed by a lawyer before signing."
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                Preview PDF
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadPDF}
                className="flex-1"
              >
                Download PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Treaty Memo */}
      {activeTab === "memo" && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Treaty Position Memo</h2>

          <div className="space-y-4">
            <Alert
              type="info"
              message="This memo documents your tax treaty election and foreign tax credit strategy. Required for German tax filing."
            />

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Treaty Position Statement</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Taxpayer: {user.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Entity: {entity.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Citizenship: {user.citizenship}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Under the income tax treaty between the United States and {user.citizenship}, and as a {entity.membersCount}-member LLC treated as a disregarded entity for U.S. tax purposes, the undersigned claims treaty relief under Article 23 (Relief from Double Taxation).
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                Preview PDF
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadPDF}
                className="flex-1"
              >
                Download PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        title={`${activeTab === "w7" ? "Form W-7" : activeTab === "agreement" ? "Operating Agreement" : "Treaty Memo"} Preview`}
        onClose={() => setShowPreview(false)}
      >
        <div className="text-center py-8 text-gray-500">
          <p>PDF preview placeholder</p>
          <p className="text-sm mt-2">Full PDF rendering implemented in backend</p>
        </div>
      </Modal>
    </div>
  );
};
