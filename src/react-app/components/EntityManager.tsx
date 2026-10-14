import React, { useState } from "react";
import type { Entity } from "../types";
import type { EntityInput } from "../hooks/useEntities";
import { X } from "lucide-react";
import { Card, Button, Alert } from "./UI";
import { LegalCopy } from "./LegalCopy";
import { ENTITY_DISCLAIMER } from "../lib/legal";
import { US_STATES, stateLabel, toStateCode } from "../lib/states";

interface EntityManagerProps {
  entities: Entity[];
  onCreate: (data: EntityInput) => Promise<Entity>;
  onUpdate: (id: string, data: Partial<EntityInput>) => Promise<Entity>;
  onDelete: (id: string) => Promise<void>;
  onEntityAdded: (entity: Entity) => void;
  onClose: () => void;
}

const TAX_CLASSES = ["Disregarded Entity", "Partnership", "S-Corporation", "C-Corporation"];

const emptyForm = (): EntityInput => ({
  name: "",
  formationDate: "",
  state: "WY",
  membersCount: 1,
  ownerName: "",
  ownerCitizenship: "",
  ownerResidency: "",
  ownerType: "foreign",
  taxClassification: "Disregarded Entity",
});

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export const EntityManager: React.FC<EntityManagerProps> = ({
  entities,
  onCreate,
  onUpdate,
  onDelete,
  onEntityAdded,
  onClose,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EntityInput>(emptyForm);

  const resetForm = () => {
    setFormData(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setFormData(emptyForm());
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  const startEdit = (entity: Entity) => {
    setFormData({
      name: entity.name,
      formationDate: entity.formationDate ? entity.formationDate.slice(0, 10) : "",
      state: toStateCode(entity.state) || "WY",
      membersCount: entity.membersCount ?? 1,
      ownerName: entity.ownerName ?? "",
      ownerCitizenship: entity.ownerCitizenship ?? "",
      ownerResidency: entity.ownerResidency ?? "",
      ownerType: entity.ownerType ?? "foreign",
      taxClassification: entity.taxClassification ?? entity.businessType ?? "Disregarded Entity",
    });
    setEditingId(entity.id);
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
        resetForm();
      } else {
        const created = await onCreate(formData);
        resetForm();
        onEntityAdded(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (entityId: string) => {
    if (!confirm("Are you sure? This will delete all associated tasks and deadlines.")) return;
    setError(null);
    setBusy(true);
    try {
      await onDelete(entityId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Entities</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && <Alert type="error" message={error} />}

          {/* Entity List */}
          {entities.length > 0 ? (
            <div className="space-y-3">
              {entities.map((entity) => (
                <Card key={entity.id} className="border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white break-words">{entity.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stateLabel(entity.state)} • Formed{" "}
                        {entity.formationDate ? new Date(entity.formationDate).toLocaleDateString() : "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entity.membersCount ?? 1} member{(entity.membersCount ?? 1) > 1 ? "s" : ""} •{" "}
                        {entity.taxClassification ?? entity.businessType ?? "—"}
                      </p>
                      {/* BUG-04: owner data was captured but never shown on the card. */}
                      {(entity.ownerName || entity.ownerCitizenship || entity.ownerResidency) && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Owner: {entity.ownerName || "—"}
                          {entity.ownerCitizenship ? ` • citizen of ${entity.ownerCitizenship}` : ""}
                          {entity.ownerResidency ? ` • resident in ${entity.ownerResidency}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => startEdit(entity)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(entity.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Alert type="info" message="No entities yet. Create your first LLC to get started." />
          )}

          {/* Add / Edit Entity Form */}
          {showForm && (
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {editingId ? "Edit Entity" : "Add New Entity"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>LLC Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Formation Date</label>
                    <input
                      type="date"
                      value={formData.formationDate}
                      onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={inputCls}
                    >
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Members</label>
                    <input
                      type="number"
                      value={formData.membersCount}
                      onChange={(e) => setFormData({ ...formData, membersCount: parseInt(e.target.value) || 1 })}
                      className={inputCls}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tax classification</label>
                    <select
                      value={formData.taxClassification}
                      onChange={(e) => setFormData({ ...formData, taxClassification: e.target.value })}
                      className={inputCls}
                    >
                      {TAX_CLASSES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Owner data (H4) — foreign-owned single-member LLC default. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Owner name</label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Owner citizenship</label>
                    <input
                      type="text"
                      value={formData.ownerCitizenship}
                      onChange={(e) => setFormData({ ...formData, ownerCitizenship: e.target.value })}
                      placeholder="e.g. Italy"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Owner country of tax residence</label>
                    <input
                      type="text"
                      value={formData.ownerResidency}
                      onChange={(e) => setFormData({ ...formData, ownerResidency: e.target.value })}
                      placeholder="e.g. Germany"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Owner type</label>
                    <select
                      value={formData.ownerType}
                      onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                      className={inputCls}
                    >
                      <option value="foreign">Foreign</option>
                      <option value="domestic">Domestic</option>
                    </select>
                  </div>
                </div>

                {/* Verbatim entity creation disclaimer from
                    content/legal/REVIEW-CHECKBOX-COPY.md §3. */}
                <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <LegalCopy text={ENTITY_DISCLAIMER} />
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="primary" type="submit" className="flex-1" isLoading={busy}>
                    {editingId ? "Save Changes" : "Create Entity"}
                  </Button>
                  <Button variant="secondary" onClick={resetForm} className="flex-1" type="button">
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Add Entity Button */}
          {!showForm && (
            <Button variant="success" onClick={startCreate} className="w-full">
              + Add New Entity
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
