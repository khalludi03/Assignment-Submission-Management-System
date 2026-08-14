"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { delay } from "@/lib/delay";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Props {
  fetchUrl: string;
  createUrl: string;
  deleteUrl: (id: number) => string;
  inputPlaceholder: string;
  emptyText: string;
  buttonLabel: string;
  noun: string;
}

export default function SimpleListTab({
  fetchUrl,
  createUrl,
  deleteUrl,
  inputPlaceholder,
  emptyText,
  buttonLabel,
  noun,
}: Props) {
  const [items, setItems] = useState<{ id: number; name: string }[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<{ id: number; name: string }[]>(fetchUrl);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const [created] = await Promise.all([
        api<{ id: number; name: string }>(createUrl, { method: "POST", body: { name } }),
        delay(1400),
      ]);
      setItems((prev) => (prev ? [...prev, created] : prev));
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const item = pendingDelete;
      await Promise.all([
        api(deleteUrl(item.id), { method: "DELETE" }),
        delay(1200),
      ]);
      setItems((prev) => (prev ? prev.filter((x) => x.id !== item.id) : prev));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="card mb-5 flex max-w-lg gap-3 p-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={inputPlaceholder}
          required
          className="input flex-1"
        />
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? (
            <>
              <span className="spinner" />
              Adding...
            </>
          ) : (
            buttonLabel
          )}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {!items ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <div className="card max-w-lg overflow-hidden">
          {items.length === 0 ? (
            <p className="p-5 text-sm text-zinc-400">{emptyText}</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-zinc-100">{item.name}</span>
                  <button onClick={() => setPendingDelete(item)} className="btn btn-danger">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${noun}?`}
        message={pendingDelete ? `This will remove "${pendingDelete.name}".` : ""}
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
