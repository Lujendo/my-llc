import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Entity, Task } from "../types";
import { Card, Modal } from "./UI";
import { useTasks } from "../hooks/useTasks";

interface ChecklistProps {
  entity: Entity | null;
}

// Section keys must match the backend seed/validation enum (src/worker/routes/tasks.ts).
const SECTIONS = ["Formation", "ITIN", "Federal", "Germany", "Banking", "Ongoing"];

export const Checklist: React.FC<ChecklistProps> = ({ entity }) => {
  const { tasks, toggleTask, getProgress } = useTasks(entity?.id);
  const [expandedSection, setExpandedSection] = useState<string | null>("Formation");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const getSectionProgress = (section: string) => {
    const sectionTasks = tasks.filter((t) => t.section === section);
    if (sectionTasks.length === 0) return 0;
    return Math.round((sectionTasks.filter((t) => t.completed).length / sectionTasks.length) * 100);
  };

  const getSectionTasks = (section: string) => {
    return tasks.filter((t) => t.section === section);
  };

  const getTotalProgress = () => {
    return getProgress();
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
                  {isExpanded ? (
                    <ChevronDown className="w-6 h-6" />
                  ) : (
                    <ChevronRight className="w-6 h-6" />
                  )}
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-success h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

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
                          className={`font-medium text-gray-900 dark:text-white ${
                            task.completed ? "line-through text-gray-500 dark:text-gray-400" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {task.instructions && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowInstructions(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Details
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

      <Modal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={selectedTask?.title || ""}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Instructions</h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {selectedTask?.instructions}
            </p>
          </div>
          {selectedTask?.dueDate && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Due Date</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(selectedTask.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setShowInstructions(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
