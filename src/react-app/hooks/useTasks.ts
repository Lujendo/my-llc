import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types";

export const useTasks = (entityId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!entityId) return;

    const stored = localStorage.getItem(`tasks_${entityId}`);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        localStorage.removeItem(`tasks_${entityId}`);
      }
    }
  }, [entityId]);

  const getTasks = useCallback((section?: string) => {
    return section ? tasks.filter((t) => t.section === section) : tasks;
  }, [tasks]);

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!entityId) throw new Error("Entity not selected");

      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      localStorage.setItem(`tasks_${entityId}`, JSON.stringify(updated));
      setTasks(updated);
    },
    [tasks, entityId]
  );

  const getProgress = useCallback(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
  }, [tasks]);

  return {
    tasks,
    getTasks,
    toggleTask,
    getProgress,
  };
};
