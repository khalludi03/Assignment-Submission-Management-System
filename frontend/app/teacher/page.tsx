"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import AssignmentForm from "@/components/teacher/AssignmentForm";
import SubmissionPanel from "@/components/teacher/SubmissionPanel";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { Assignment, TeacherAssignment } from "@/lib/types";

type View =
  | { type: "list" }
  | { type: "form"; editing?: Assignment }
  | { type: "submissions"; assignment: Assignment };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function TeacherDashboard() {
  const [pairs, setPairs] = useState<TeacherAssignment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [view, setView] = useState<View>({ type: "list" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [pairData, assignmentData] = await Promise.all([
        api<TeacherAssignment[]>("/api/assignments/teaching"),
        api<Assignment[]>("/api/assignments/teacher"),
      ]);
      setPairs(pairData);
      setAssignments(assignmentData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(a: Assignment) {
    try {
      const updated = await api<Assignment>(`/api/assignments/${a.id}/${a.status === "Published" ? "unpublish" : "publish"}`, {
        method: "POST",
      });
      setAssignments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to change status.");
    }
  }

  async function handleDelete(a: Assignment) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/assignments/${a.id}`, { method: "DELETE" });
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  function handleSaved(updated: Assignment) {
    setAssignments((prev) => {
      const exists = prev.some((x) => x.id === updated.id);
      return exists ? prev.map((x) => (x.id === updated.id ? updated : x)) : [updated, ...prev];
    });
    setView({ type: "list" });
  }

  return (
    <div className="min-h-screen bg-black">
      <NavBar title="Teacher Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {view.type === "submissions" ? (
          <SubmissionPanel
            assignment={view.assignment}
            onBack={() => setView({ type: "list" })}
          />
        ) : view.type === "form" ? (
          <>
            {pairs.length === 0 && (
              <p className="mb-4 text-sm text-amber-400">
                You are not assigned to any class/subject yet. Ask an admin to assign you.
              </p>
            )}
            {pairs.length > 0 && (
              <AssignmentForm
                pairs={pairs}
                initial={view.editing}
                onSave={handleSaved}
                onCancel={() => setView({ type: "list" })}
              />
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-50">My Assignments</h2>
              <button
                onClick={() => setView({ type: "form" })}
                disabled={pairs.length === 0}
                className="btn btn-primary"
              >
                New Assignment
              </button>
            </div>

            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : assignments.length === 0 ? (
              <p className="text-zinc-400">You haven&apos;t created any assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const deadlinePassed = new Date(a.deadline) <= new Date();
                  return (
                    <div key={a.id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-zinc-50">{a.title}</h3>
                          <p className="mt-0.5 text-sm text-zinc-400">
                            {a.className} · {a.subjectName}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Deadline: {formatDate(a.deadline)} {deadlinePassed && "(passed)"} · Max{" "}
                            {a.maxMarks} marks
                          </p>
                        </div>
                        <span
                          className={`badge shrink-0 ${a.status === "Published" ? "badge-green" : "badge-gray"}`}
                        >
                          {a.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setView({ type: "submissions", assignment: a })}
                          className="btn btn-primary"
                        >
                          Submissions
                        </button>
                        <button onClick={() => togglePublish(a)} className="btn btn-secondary">
                          {a.status === "Published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => setView({ type: "form", editing: a })}
                          className="btn btn-secondary"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(a)} className="btn btn-danger">
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
