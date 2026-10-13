import React, { useState } from "react";
import type { Entity } from "../types";
import { Card, Button, Alert } from "./UI";

interface EntityManagerProps {
  entities: Entity[];
  userId: string | undefined;
  onClose: () => void;
  onEntityAdded: (entity: Entity) => void;
}

export const EntityManager: React.FC<EntityManagerProps> = ({
  entities,
  userId,
  onClose,
  onEntityAdded,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    formationDate: "",
    state: "Wyoming",
    membersCount: 1,
    businessType: "Holding",
  });

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      userId,
      name: formData.name,
      formationDate: formData.formationDate,
      state: formData.state,
      membersCount: formData.membersCount,
      businessType: formData.businessType,
      createdAt: new Date().toISOString(),
    };

    const updated = [...entities, newEntity];
    localStorage.setItem(`entities_${userId}`, JSON.stringify(updated));
    onEntityAdded(newEntity);

    setFormData({
      name: "",
      formationDate: "",
      state: "Wyoming",
      membersCount: 1,
      businessType: "Holding",
    });
    setShowForm(false);
  };

  const handleDeleteEntity = (entityId: string) => {
    if (!userId) return;
    if (!confirm("Are you sure? This will delete all associated tasks and deadlines.")) return;

    const updated = entities.filter((e) => e.id !== entityId);
    localStorage.setItem(`entities_${userId}`, JSON.stringify(updated));
    localStorage.removeItem(`tasks_${entityId}`);
    localStorage.removeItem(`deadlines_${entityId}`);
    
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Entities</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Entity List */}
          {entities.length > 0 ? (
            <div className="space-y-3">
              {entities.map((entity) => (
                <Card key={entity.id} className="border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{entity.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entity.state} • Formed {new Date(entity.formationDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entity.membersCount} member{entity.membersCount > 1 ? "s" : ""} • {entity.businessType}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteEntity(entity.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Alert type="info" message="No entities yet. Create your first LLC to get started." />
          )}

          {/* Add Entity Form */}
          {showForm && (
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Entity</h3>
              <form onSubmit={handleCreateEntity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LLC Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Formation Date
                  </label>
                  <input
                    type="date"
                    value={formData.formationDate}
                    onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option>Wyoming</option>
                      <option>Delaware</option>
                      <option>Nevada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Members
                    </label>
                    <input
                      type="number"
                      value={formData.membersCount}
                      onChange={(e) => setFormData({ ...formData, membersCount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" type="submit" className="flex-1">
                    Create Entity
                  </Button>
                  <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Add Entity Button */}
          {!showForm && (
            <Button variant="success" onClick={() => setShowForm(true)} className="w-full">
              + Add New Entity
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
