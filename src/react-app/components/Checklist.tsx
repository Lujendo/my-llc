import React, { useEffect, useState } from "react";
import type { Entity, Task } from "../types";
import { Card, Badge, Modal, Alert } from "./UI";
import { SAMPLE_TASKS } from "../data/sampleData";

interface ChecklistProps {
  entity: Entity | null;
}

const SECTIONS = ["Formation", "ITIN", "Federal", "German", "Banking", "Ongoing"];

export const Checklist: React.FC<ChecklistProps> = ({ entity }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>("Formation");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!entity) return;

    const stored = localStorage.getItem(`tasks_${entity.id}`);
    if (!stored) {
      const initialTasks = SAMPLE_TASKS.map((t) => ({ ...t, entityId: entity.id }));
      localStorage.setItem(`tasks_${entity.id}`, JSON.stringify(initialTasks));
      setTasks(initialTasks);
    } else {
      setTasks(JSON.parse(stored));
    }
  }, [entity]);

  const toggleTask = (taskId: string) => {
    if (!entity) return;

    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    localStorage.setItem(`tasks_${entity.id}`, JSON.stringify(updated));
    setTasks(updated);
  };

  const getSectionProgress = (section: string) => {
    const sectionTasks = tasks.filter((t) => t.section === section);
    if (sectionTasks.length === 0) return 0;
    return Math.round((sectionTasks.filter((t) => t.completed).length / sectionTasks.length) * 100);
  };

  const getSectionTasks = (section: string) => {
    return tasks.filter((t) => t.section === section);
  };

  const getTotalProgress = () => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
  };

  if (!entity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please add an entity to view checklist</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Compliance Checklist</h1>
        <p className="text-gray-600 dark:text-gray-400">Complete all tasks to ensure full compliance</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{getTotalProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-success h-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {tasks.filter((t) => t.completed).length} of {tasks.length} tasks completed
          </p>
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const sectionTasks = getSectionTasks(section);
          const progress = getSectionProgress(section);
          const isExpanded = expandedSection === section;

          return (
            <Card
              key={section}
              onClick={() => setExpandedSection(isExpanded ? null : section)}
              interactive
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{section}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sectionTasks.filter((t) => t.completed).length} of {sectionTasks.length} completed
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{progress}%</span>
                  </div>
                  <span className="text-2xl">{isExpanded ? "▼" : "▶"}</span>
                </div>
              </div>

              {/* Section Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-success h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Tasks */}
              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  {sectionTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 w-5 h-5 rounded cursor-pointer"
                        aria-label={`Mark ${task.title} as complete`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm ${
                            task.completed
                              ? "text-gray-500 dark:text-gray-500 line-through"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {!task.completed && task.instructions && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowInstructions(true);
                          }}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        >
                          Help
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructions}
        title={selectedTask?.title || "Task Instructions"}
        onClose={() => {
          setShowInstructions(false);
          setSelectedTask(null);
        }}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Section</h4>
              <Badge label={selectedTask.section} status="info" />
            </div>

            {selectedTask.dueDate && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Due Date</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(selectedTask.dueDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Instructions</h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedTask.instructions}</p>
            </div>

            <Alert
              type="info"
              message="For detailed guidance, consult IRS publication or your tax advisor."
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
