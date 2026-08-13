"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { SubjectItem } from "@/lib/types";

export default function SubjectsTab() {
  const [subjects, setSubjects] = useState<SubjectItem[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setSubjects(await api<SubjectItem[]>("/api/admin/subjects"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load subjects.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await api<SubjectItem>("/api/admin/subjects", { method: "POST", body: { name } });
      setSubjects((prev) => (prev ? [...prev, created] : prev));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject: SubjectItem) {
    if (!confirm(`Delete subject "${subject.name}"?`)) return;
    try {
      await api(`/api/admin/subjects/${subject.id}`, { method: "DELETE" });
      setSubjects((prev) => (prev ? prev.filter((s) => s.id !== subject.id) : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete subject.");
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-5 flex max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject name (e.g. Physics)"
          required
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add subject"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!subjects ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {subjects.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No subjects yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-900">{s.name}</span>
                  <button
                    onClick={() => handleDelete(s)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
