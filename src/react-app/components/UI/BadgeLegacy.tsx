import React from "react";

interface BadgeProps {
  label: string;
  status: "completed" | "pending" | "overdue" | "warning" | "info";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, status, className = "" }) => {
  const statusStyles = {
    completed: "bg-success/10 text-success border border-success/20",
    pending: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
    overdue: "bg-danger/10 text-danger border border-danger/20",
    warning: "bg-warning/10 text-yellow-700 border border-warning/20 dark:text-yellow-400",
    info: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]} ${className}`}>
      {label}
    </span>
  );
};
