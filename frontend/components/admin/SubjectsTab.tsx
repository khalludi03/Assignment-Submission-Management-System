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
      <form
        onSubmit={handleCreate}
        className="card mb-5 flex max-w-lg gap-3 p-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject name (e.g. Physics)"
          required
          className="input flex-1"
        />
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Adding..." : "Add subject"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {!subjects ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <div className="card max-w-lg overflow-hidden">
          {subjects.length === 0 ? (
            <p className="p-5 text-sm text-zinc-400">No subjects yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {subjects.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-zinc-100">{s.name}</span>
                  <button onClick={() => handleDelete(s)} className="btn btn-danger">
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
