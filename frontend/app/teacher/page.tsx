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
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Teacher Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {view.type === "submissions" ? (
          <SubmissionPanel
            assignment={view.assignment}
            onBack={() => setView({ type: "list" })}
          />
        ) : view.type === "form" ? (
          <>
            {pairs.length === 0 && (
              <p className="mb-4 text-sm text-amber-700">
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
              <h2 className="text-xl font-semibold text-gray-900">My Assignments</h2>
              <button
                onClick={() => setView({ type: "form" })}
                disabled={pairs.length === 0}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                New Assignment
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : assignments.length === 0 ? (
              <p className="text-gray-500">You haven&apos;t created any assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const deadlinePassed = new Date(a.deadline) <= new Date();
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {a.className} · {a.subjectName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Deadline: {formatDate(a.deadline)} {deadlinePassed && "(passed)"} · Max{" "}
                            {a.maxMarks} marks
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            a.status === "Published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setView({ type: "submissions", assignment: a })}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Submissions
                        </button>
                        <button
                          onClick={() => togglePublish(a)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {a.status === "Published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => setView({ type: "form", editing: a })}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
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
