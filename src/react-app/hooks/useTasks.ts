import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types";
import { api } from "../lib/api";

export const useTasks = (entityId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!entityId) return;
    const fetchTasks = async () => {
      try {
        const data = await api.request<{ tasks: Task[] }>(`/api/tasks?entity_id=${entityId}`);
        setTasks(data.tasks || []);
      } catch {
        setTasks([]);
      }
    };
    fetchTasks();
  }, [entityId]);

  const getTasks = useCallback((section?: string) => {
    return section ? tasks.filter((t) => t.section === section) : tasks;
  }, [tasks]);

  const toggleTask = useCallback(
    async (taskId: string) => {
      if (!entityId) throw new Error("Entity not selected");
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const data = await api.request<{ task: Task }>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
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
