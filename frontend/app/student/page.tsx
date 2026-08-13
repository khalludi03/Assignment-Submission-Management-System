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
      <div className="min-h-screen bg-black">
        <NavBar title="Student Dashboard" />
        <main className="mx-auto max-w-6xl px-4 py-8 text-red-400">{error}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <NavBar title="Student Dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold text-zinc-50">Your Assignments</h2>
        {!items ? (
          <p className="text-zinc-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-400">No published assignments yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(({ assignment, submission }) => {
              const deadlinePassed = new Date(assignment.deadline) <= new Date();
              const graded = submission?.status === "Graded";
              const locked = deadlinePassed || graded;
              const submissionExists = Boolean(submission);

              return (
                <div key={assignment.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-50">{assignment.title}</h3>
                      <p className="mt-0.5 text-sm text-zinc-400">
                        {assignment.subjectName} · {assignment.teacherName}
                      </p>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        graded ? "badge-green" : submission ? "badge-blue" : "badge-gray"
                      }`}
                    >
                      {graded ? "Graded" : submission ? "Submitted" : "Pending"}
                    </span>
                  </div>

                  {assignment.description && (
                    <p className="mt-3 text-sm text-zinc-300">{assignment.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>Deadline: {formatDate(assignment.deadline)}</span>
                    <span>Max marks: {assignment.maxMarks}</span>
                  </div>

                  {deadlinePassed && !submission && (
                    <p className="mt-2 text-xs font-medium text-red-400">
                      Deadline passed — submission closed.
                    </p>
                  )}

                  {submission && (
                    <div className="mt-3 rounded-md border border-zinc-800/60 bg-zinc-950 p-3 text-sm">
                      {submission.status === "Graded" && (
                        <p className="font-medium text-zinc-100">
                          Marks: {submission.marks ?? "—"} / {assignment.maxMarks}
                        </p>
                      )}
                      {submission.feedback && <p className="mt-1 text-zinc-300">{submission.feedback}</p>}
                      <p className="mt-1 text-xs text-zinc-500">
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
                      className="input"
                    />
                    <button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={locked || savingId === assignment.id || !(answers[assignment.id] ?? "").trim()}
                      className="btn btn-primary mt-2"
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
