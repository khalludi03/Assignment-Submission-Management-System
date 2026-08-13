"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { Assignment, Submission } from "@/lib/types";

interface Merged {
  assignment: Assignment;
  submission?: Submission;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function StudentDashboard() {
  const [items, setItems] = useState<Merged[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [assignments, submissions] = await Promise.all([
          api<Assignment[]>("/api/assignments/my"),
          api<Submission[]>("/api/submissions/mine"),
        ]);
        const merged: Merged[] = assignments.map((assignment) => ({
          assignment,
          submission: submissions.find((s) => s.assignmentId === assignment.id),
        }));
        setItems(merged);
        const draft: Record<number, string> = {};
        for (const a of assignments) draft[a.id] = "";
        setAnswers(draft);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          window.location.assign("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load assignments.");
      }
    }
    load();
  }, []);

  async function handleSubmit(assignmentId: number) {
    const answer = (answers[assignmentId] ?? "").trim();
    if (!answer) return;
    setSavingId(assignmentId);
    try {
      await api<Submission>(`/api/submissions/${assignmentId}`, {
        method: "POST",
        body: { answer },
      });
      setItems((prev) =>
        prev
          ? prev.map((it) =>
              it.assignment.id === assignmentId
                ? { ...it, submission: { ...(it.submission ?? {}), answer, status: "Submitted" } as Submission }
                : it,
            )
          : prev,
      );
      setAnswers((prev) => ({ ...prev, [assignmentId]: "" }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        window.location.assign("/login");
        return;
      }
      alert(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSavingId(null);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar title="Student Dashboard" />
        <main className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="Student Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Your Assignments</h2>
        {!items ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No published assignments yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(({ assignment, submission }) => {
              const deadlinePassed = new Date(assignment.deadline) <= new Date();
              const graded = submission?.status === "Graded";
              const locked = deadlinePassed || graded;
              const submissionExists = Boolean(submission);

              return (
                <div key={assignment.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {assignment.subjectName} · {assignment.teacherName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        graded
                          ? "bg-green-100 text-green-700"
                          : submission
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {graded ? "Graded" : submission ? "Submitted" : "Pending"}
                    </span>
                  </div>

                  {assignment.description && (
                    <p className="mt-3 text-sm text-gray-700">{assignment.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Deadline: {formatDate(assignment.deadline)}</span>
                    <span>Max marks: {assignment.maxMarks}</span>
                  </div>

                  {deadlinePassed && !submission && (
                    <p className="mt-2 text-xs font-medium text-red-600">Deadline passed — submission closed.</p>
                  )}

                  {submission && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                      {submission.status === "Graded" && (
                        <p className="font-medium text-gray-900">
                          Marks: {submission.marks ?? "—"} / {assignment.maxMarks}
                        </p>
                      )}
                      {submission.feedback && <p className="mt-1 text-gray-700">{submission.feedback}</p>}
                      <p className="mt-1 text-xs text-gray-500">
                        {submission.updatedAt || submission.submittedAt
                          ? `Last updated: ${formatDate(submission.updatedAt ?? submission.submittedAt)}`
                          : ""}
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <textarea
                      value={answers[assignment.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                      disabled={locked}
                      rows={3}
                      placeholder={locked ? "Closed for editing." : "Write your answer here..."}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={locked || savingId === assignment.id || !(answers[assignment.id] ?? "").trim()}
                      className="mt-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingId === assignment.id
                        ? "Saving..."
                        : submissionExists
                          ? "Update submission"
                          : "Submit"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
