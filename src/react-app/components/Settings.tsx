import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Card, Button, Alert } from "./UI";

interface SettingsProps {
  user: any;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onClose }) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [emailFrequency, setEmailFrequency] = useState("daily");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleSave = () => {
    localStorage.setItem("emailFrequency", emailFrequency);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {saved && (
            <Alert type="success" message="Settings saved successfully!" />
          )}

          {/* User Profile Section */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Profile</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Name:</strong> {user?.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Citizenship:</strong> {user?.citizenship}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Residency:</strong> {user?.residency}
              </p>
            </div>
          </Card>

          {/* Display Settings */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Display</h3>
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <label className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    darkMode ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Notifications</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Reminder Frequency
              </label>
              <select
                value={emailFrequency}
                onChange={(e) => setEmailFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="3days">Every 3 Days</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input type="checkbox" id="sms" className="w-4 h-4" />
              <label htmlFor="sms" className="text-sm text-gray-700 dark:text-gray-300">
                SMS reminders (if available)
              </label>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Language</h3>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="en">English</option>
              <option value="de">Deutsch (German)</option>
              <option value="it">Italiano (Italian)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Multi-language support coming in Phase 2
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="primary" onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
