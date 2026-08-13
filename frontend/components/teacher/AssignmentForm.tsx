"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Assignment, TeacherAssignment } from "@/lib/types";

interface Props {
  pairs: TeacherAssignment[];
  initial?: Assignment;
  onSave: (assignment: Assignment) => void;
  onCancel: () => void;
}

export default function AssignmentForm({ pairs, initial, onSave, onCancel }: Props) {
  const initialPair = initial
    ? pairs.find((p) => p.classId === initial.classId && p.subjectId === initial.subjectId)
    : pairs[0];

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [deadline, setDeadline] = useState(initial ? toLocalInput(initial.deadline) : "");
  const [maxMarks, setMaxMarks] = useState(initial ? String(initial.maxMarks) : "");
  const [pairKey, setPairKey] = useState(initialPair ? `${initialPair.classId}-${initialPair.subjectId}` : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const [classId, subjectId] = pairKey.split("-").map(Number);
    if (!title.trim() || !deadline || !maxMarks) {
      setError("Title, deadline and max marks are required.");
      return;
    }

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      deadline: new Date(deadline).toISOString(),
      maxMarks: Number(maxMarks),
      classId,
      subjectId,
    };

    setSaving(true);
    try {
      const saved = initial
        ? await api<Assignment>(`/api/assignments/${initial.id}`, { method: "PUT", body })
        : await api<Assignment>("/api/assignments", { method: "POST", body });
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {initial ? "Edit Assignment" : "New Assignment"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Class · Subject</label>
          <select
            value={pairKey}
            onChange={(e) => setPairKey(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Select...
            </option>
            {pairs.map((p) => (
              <option key={`${p.classId}-${p.subjectId}`} value={`${p.classId}-${p.subjectId}`}>
                {p.className} · {p.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Max marks</label>
          <input
            type="number"
            min={1}
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Save changes" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
