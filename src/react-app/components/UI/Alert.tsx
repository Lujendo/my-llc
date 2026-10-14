import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, title, message, onClose }) => {
  const typeStyles = {
    success: "bg-success/10 text-success border border-success/20",
    error: "bg-danger/10 text-danger border border-danger/20",
    warning: "bg-warning/10 text-yellow-700 border border-warning/20 dark:text-yellow-400",
    info: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const Icon = icons[type];

  return (
    <div className={`${typeStyles[type]} rounded-lg p-4 mb-4 flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
