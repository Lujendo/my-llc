import React from "react";
import { Check } from "lucide-react";
import type { Entity } from "../types";
import { Card, Badge, Button } from "./UI";
import { useTasks } from "../hooks/useTasks";
import { stateLabel } from "../lib/states";

interface DashboardProps {
  user: any;
  entity: Entity | null;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, entity, onNavigate }) => {
  // ponytail: tasks are the single source of truth (backend); deadlines are derived.
  const { tasks } = useTasks(entity?.id);
  const completedCount = tasks.filter((t) => t.completed).length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Next 5 outstanding tasks that carry a due date.
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && !t.completed)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-danger font-bold";
      case "medium":
        return "text-warning font-semibold";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "overdue";
      case "medium":
        return "warning";
      default:
        return "info";
    }
  };

  const daysUntilDeadline = (dueDate: string) => {
    const today = new Date();
    const deadline = new Date(dueDate);
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!user || !entity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {user.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {entity.name} ({stateLabel(entity.state)}) • Formed{" "}
          {entity.formationDate ? new Date(entity.formationDate).toLocaleDateString() : "—"}
        </p>
      </div>

      {/* Compliance Status */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Compliance Status
          </h2>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-success h-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {completedCount} of {tasks.length} tasks completed ({completionRate}%)
          </p>
        </div>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Deadlines (Next 30 Days)
        </h2>
        <div className="space-y-3">
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((task) => {
              const days = daysUntilDeadline(task.dueDate!);
              const urgency = days <= 7 ? "high" : days <= 30 ? "medium" : "low";
              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-gray-900 dark:text-white ${getUrgencyColor(urgency)}`}>
                        {task.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Due {new Date(task.dueDate!).toLocaleDateString()} ({days} days)
                    </p>
                  </div>
                  <Badge label={urgency.toUpperCase()} status={getUrgencyBadge(urgency)} />
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming deadlines</p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="primary" onClick={() => onNavigate("checklist")}>
            View Checklist
          </Button>
          <Button variant="secondary" onClick={() => onNavigate("timeline")}>
            View Timeline
          </Button>
          <Button variant="secondary" onClick={() => onNavigate("treaty")}>
            Run Treaty Analyzer
          </Button>
          <Button variant="secondary" onClick={() => onNavigate("documents")}>
            Generate Documents
          </Button>
        </div>
      </Card>

      {/* Completion Highlights */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completed Items</h2>
        <div className="space-y-2">
          {tasks.filter((t) => t.completed).length > 0 ? (
            tasks
              .filter((t) => t.completed)
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No tasks completed yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
