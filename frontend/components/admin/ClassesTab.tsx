"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { ClassItem } from "@/lib/types";

export default function ClassesTab() {
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setClasses(await api<ClassItem[]>("/api/admin/classes"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load classes.");
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
      const created = await api<ClassItem>("/api/admin/classes", { method: "POST", body: { name } });
      setClasses((prev) => (prev ? [...prev, created] : prev));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cls: ClassItem) {
    if (!confirm(`Delete class "${cls.name}"?`)) return;
    try {
      await api(`/api/admin/classes/${cls.id}`, { method: "DELETE" });
      setClasses((prev) => (prev ? prev.filter((c) => c.id !== cls.id) : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class.");
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-5 flex max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Class name (e.g. Class 9)"
          required
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add class"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!classes ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {classes.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No classes yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-900">{c.name}</span>
                  <button
                    onClick={() => handleDelete(c)}
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
