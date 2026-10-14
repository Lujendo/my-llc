import React, { useMemo, useState } from "react";
import type { Entity, Deadline, Task } from "../types";
import { Card, Badge, Modal } from "./UI";
import { useTasks } from "../hooks/useTasks";

interface TimelineProps {
  entity: Entity | null;
}

// ponytail: the timeline derives deadlines from the backend task list — one source
// of truth, no separate deadline store. Tasks without a due date are omitted.
const CATEGORY_BY_SECTION: Record<string, Deadline["category"]> = {
  Formation: "State",
  ITIN: "US",
  Federal: "US",
  Germany: "HomeCountry",
  Banking: "Compliance",
  Ongoing: "Compliance",
};

const daysUntil = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const toDeadline = (t: Task): Deadline => {
  const days = daysUntil(t.dueDate!);
  return {
    id: t.id,
    entityId: t.entityId,
    title: t.title,
    dueDate: t.dueDate!,
    category: CATEGORY_BY_SECTION[t.section] ?? "Compliance",
    status: t.completed ? "completed" : days < 0 ? "overdue" : "pending",
    urgency: days <= 7 ? "high" : days <= 30 ? "medium" : "low",
  };
};

export const Timeline: React.FC<TimelineProps> = ({ entity }) => {
  const { tasks } = useTasks(entity?.id);
  const deadlines = useMemo(
    () => tasks.filter((t) => !!t.dueDate).map(toDeadline),
    [tasks]
  );
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getSortedDeadlines = () => {
    return [...deadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 border-success/30";
      case "pending":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-700";
      case "overdue":
        return "bg-danger/10 border-danger/30";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string): "completed" | "pending" | "overdue" => {
    return (status as "completed" | "pending" | "overdue") || "pending";
  };

  const getUrgencyLabel = (days: number) => {
    if (days < 0) return "OVERDUE";
    if (days === 0) return "TODAY";
    if (days <= 7) return `${days}d LEFT`;
    return `${days}d`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "US":
        return "text-blue-600 dark:text-blue-400";
      case "State":
        return "text-purple-600 dark:text-purple-400";
      case "HomeCountry":
        return "text-orange-600 dark:text-orange-400";
      case "Compliance":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // ponytail: list view only for MVP, calendar view can be added later if needed
  const monthDeadlines = new Map<string, Deadline[]>();
  getSortedDeadlines().forEach((deadline) => {
    const month = new Date(deadline.dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    if (!monthDeadlines.has(month)) {
      monthDeadlines.set(month, []);
    }
    monthDeadlines.get(month)!.push(deadline);
  });

  if (!entity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to view timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Deadline Timeline</h1>
        <p className="text-gray-600 dark:text-gray-400">All critical tax deadlines for {entity.name}</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === "calendar"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          Calendar View
        </button>
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="space-y-6">
          {deadlines.length === 0 && (
            <Card>
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No deadlines yet. Add a due date to a task in your checklist to see it here.
              </p>
            </Card>
          )}
          {Array.from(monthDeadlines.entries()).map(([month, monthDL]) => (
            <div key={month}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{month}</h2>
              <div className="space-y-3">
                {monthDL.map((deadline) => {
                  const days = daysUntil(deadline.dueDate);

                  return (
                    <Card
                      key={deadline.id}
                      onClick={() => {
                        setSelectedDeadline(deadline);
                        setShowDetails(true);
                      }}
                      interactive
                      className={`border-2 ${getStatusColor(deadline.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{deadline.title}</h3>
                            <Badge label={deadline.category} status="info" />
                          </div>
                          <p className={`text-sm font-medium ${getCategoryColor(deadline.category)}`}>
                            {new Date(deadline.dueDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge label={getUrgencyLabel(days)} status={getStatusBadge(deadline.status)} />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {deadline.status === "completed" && "✓ Completed"}
                            {deadline.status === "pending" &&
                              (days <= 7
                                ? `⚠️ Due Soon`
                                : days <= 30
                                  ? "Upcoming"
                                  : "Scheduled")}
                            {deadline.status === "overdue" && "✕ Overdue"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p>Calendar view showing {deadlines.length} deadlines</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getSortedDeadlines()
                .slice(0, 12)
                .map((deadline) => (
                  <div
                    key={deadline.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedDeadline(deadline);
                      setShowDetails(true);
                    }}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{deadline.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        title={selectedDeadline?.title || "Deadline Details"}
        onClose={() => {
          setShowDetails(false);
          setSelectedDeadline(null);
        }}
      >
        {selectedDeadline && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category</h4>
              <Badge label={selectedDeadline.category} status="info" />
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Due Date</h4>
              <p className="text-gray-700 dark:text-gray-300">
                {new Date(selectedDeadline.dueDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h4>
              <Badge label={selectedDeadline.status.toUpperCase()} status={getStatusBadge(selectedDeadline.status)} />
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Urgency</h4>
              <Badge label={selectedDeadline.urgency.toUpperCase()} status={getStatusBadge(selectedDeadline.urgency)} />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              Set reminders in your calendar for this deadline. Consider marking this complete once filed.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
